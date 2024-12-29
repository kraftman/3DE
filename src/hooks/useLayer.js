import { useCallback } from 'react';
import { useStore } from '../contexts/useStore'; // adjust the import path as needed
import { useLayout } from './useLayout.js';

import { parseWithRecast } from '../utils/parseWithRecast.js';
import { useShallow } from 'zustand/react/shallow';
const { namedTypes: n, visit } = require('ast-types');

import {
  hideModuleChildren,
  showModuleChildren,
} from '../utils/moduleUtils.js';
import { useFileSystem } from '../stores/useFileSystem.js';
import { isRootLevelNode } from '../utils/parser.js';
import * as recast from 'recast';

export const useLayer = () => {
  const { setNodes, setEdges, getNodes, getEdges } = useStore(
    useShallow((state) => ({
      setNodes: state.setNodes,
      setEdges: state.setEdges,
      getNodes: state.getNodes,
      getEdges: state.getEdges,
    }))
  );
  const { flatFiles, setFlatFiles } = useFileSystem(
    useShallow((state) => ({
      setFlatFiles: state.setFlatFiles,
      flatFiles: state.flatFiles,
    }))
  );

  const { layoutNodes } = useLayout();

  const onModuleClose = (moduleId) => {
    setNodes((nodes) => {
      const nonModuleNodes = nodes.filter(
        (node) => node.data.moduleId !== moduleId
      );
      return nonModuleNodes;
    });
  };

  const toggleShowChildModules = useCallback(
    (moduleId) => {
      const nodes = getNodes();
      const edges = getEdges();

      const moduleNode = nodes.find(
        (node) => node.type === 'module' && node.id === moduleId
      );
      if (moduleNode.data.showChildren) {
        return setNodes((nodes) => hideModuleChildren(nodes, moduleId));
      }

      const { newNodes, newEdges } = showModuleChildren(
        nodes,
        edges,
        moduleNode,
        flatFiles
      );

      setNodes(newNodes);
      setEdges((edges) => edges.concat(newEdges));

      layoutNodes();
    },
    [flatFiles]
  );

  const onRootNodeTextChange = useCallback(
    (fullPath, value) => {
      // need to edit the actual rootcode ast
      console.log('new value', value);
      const parsed = parseWithRecast(value);
      if (!parsed) {
        console.error('skipping invalid code');
        return;
      }
      const parsedBody = parsed.program.body;
      const file = flatFiles[fullPath];
      const fileAst = file.fullAst;

      const newRootCode = [];

      visit(parsed, {
        visitProgram(path) {
          // Traverse through the body of the program
          path.get('body').each((nodePath) => {
            newRootCode.push({
              line: newRootCode.length,
              path: nodePath,
            });
          });
          return false;
        },
      });
      console.log('old ast', recast.print(fileAst).code);
      visit(fileAst, {
        visitProgram(path) {
          // Separate imports and other declarations
          const importNodes = [];
          const otherNodes = [];

          path.get('body').each((nodePath) => {
            const node = nodePath.node;
            if (node.type === 'ImportDeclaration') {
              importNodes.push(node);
            } else {
              const isRoot = isRootLevelNode(nodePath);
              console.log('==== is root', isRoot);
              console.log('==== node', recast.print(node).code);
              if (!isRoot) {
                otherNodes.push(node);
              }
            }
          });

          path.node.body = [
            ...importNodes, // Keep imports at the top
            ...parsedBody, // Inject the parsed nodes
            ...otherNodes, // Append the rest of the nodes
          ];
          console.log('new body', path.node.body);

          return false; // Stop traversal
        },
      });
      console.log('new ast', recast.print(fileAst).code);

      const newFile = {
        ...file,
        fullAst: fileAst,
        rootCode: newRootCode,
      };

      setFlatFiles((files) => {
        return { ...files, [fullPath]: newFile };
      });
    },
    [flatFiles]
  );

  function handleFunctionNode(path, functionId, newBodyStatements) {
    if (path.node._id && path.node._id === functionId) {
      console.log('old path', path);
      console.log('new body statements', newBodyStatements);
      path.node.body = newBodyStatements;
      console.log('new path', path);

      return false;
    }
  }

  const onFunctionTextChange = useCallback(
    (fullPath, functionId, newBodyStatements) => {
      const file = flatFiles[fullPath];
      visit(file.fullAst, {
        visitFunctionDeclaration(path) {
          handleFunctionNode(path, functionId, newBodyStatements);
          this.traverse(path);
        },
        visitFunctionExpression(path) {
          handleFunctionNode(path, functionId, newBodyStatements);
          this.traverse(path);
        },
        visitArrowFunctionExpression(path) {
          handleFunctionNode(path, functionId, newBodyStatements);
          this.traverse(path);
        },
        visitObjectMethod(path) {
          handleFunctionNode(path, functionId, newBodyStatements);
          this.traverse(path);
        },
        visitClassMethod(path) {
          handleFunctionNode(path, functionId, newBodyStatements);
          this.traverse(path);
        },
      });
      console.log(
        'new ast after text change:',
        recast.print(file.fullAst).code
      );

      setFlatFiles((files) => {
        const newFile = {
          ...file,
          functions: [...file.functions],
        };
        return { ...files, [fullPath]: newFile };
      });

      // also need to handle them creating a new function in code
    },
    [flatFiles]
  );

  const onfunctionTitledChanged = useCallback((functionId, title) => {
    setNodes((nodes) =>
      nodes.map((node) => {
        if (node.data.functionId === functionId) {
          node.data = { ...node.data, functionName: title };
        }
        return node;
      })
    );
  }, []);

  function handleFunctionSignatureChange(path, newAst) {
    const newFunction = newAst.program.body[0];
    path.node.params = newFunction.params;
    const node = path.node;
    if (
      node.type === 'FunctionDeclaration' ||
      node.type === 'FunctionExpression'
    ) {
      path.node.id = newFunction.id; // Update function name
    } else if (node.type === 'ArrowFunctionExpression') {
      // For arrow functions, update the variable name
      const variableDeclarator = path.parentPath.value; // Assuming parent is VariableDeclarator
      console.log('variable declarator', variableDeclarator);
      if (variableDeclarator.type === 'VariableDeclarator') {
        console.log('updating node', variableDeclarator);
        variableDeclarator.id.name = newFunction.id.name;
      } else {
        console.error(
          'Failed to update variable name for arrow function',
          newFunction
        );
      }
    }
  }

  const onFunctionSignatureChange = useCallback(
    (fullPath, functionId, newAst) => {
      const file = flatFiles[fullPath];
      const funcInfo = file.functions.find((func) => func.id === functionId);
      handleFunctionSignatureChange(funcInfo.path, newAst);
      console.log('new ast after sig change:', file.fullAst);

      setFlatFiles((files) => {
        const newFunctions = file.functions.map((func) => {
          if (func.id === functionId) {
            return { ...func };
          }
          return func;
        });
        console.log('update file', fullPath);
        const newFile = {
          ...file,
          functions: newFunctions,
          fullAst: { ...file.fullAst },
        };
        console.log('new file ast:', recast.print(newFile.fullAst).code);
        return { ...files, [fullPath]: newFile };
      });
    },
    [flatFiles]
  );

  return {
    onModuleClose,
    toggleShowChildModules,
    onFunctionTextChange,
    onfunctionTitledChanged,
    onRootNodeTextChange,
    onFunctionSignatureChange,
  };
};
