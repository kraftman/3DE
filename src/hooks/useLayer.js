import { useCallback } from 'react';
import { useStore } from '../contexts/useStore'; // adjust the import path as needed

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

  const onModuleClose = (moduleId) => {
    setNodes((nodes) => {
      const nonModuleNodes = nodes.filter(
        (node) => node.data.moduleId !== moduleId
      );
      return nonModuleNodes;
    });
  };

  const toggleShowChildModules = useCallback(
    (moduleId, fullPath, showChildren) => {
      // later need to make sure the children arent already open
      if (showChildren) {
        return setNodes((nodes) => hideModuleChildren(nodes, moduleId));
      }
      const nodes = getNodes();
      const edges = getEdges();
      const fileInfo = flatFiles[fullPath];
      const { newNodes, newEdges } = showModuleChildren(
        nodes,
        edges,
        moduleId,
        flatFiles,
        fileInfo
      );

      setNodes(newNodes);
      setEdges((edges) => [...edges, ...newEdges]);
    },
    [flatFiles]
  );

  const onRootNodeTextChange = useCallback(
    (fullPath, value) => {
      // need to edit the actual rootcode ast
      console.log('new value', value);
      const parsed = parseWithRecast(value);
      console.log('parsed', parsed);
      const parsedBody = parsed.program.body;
      if (!parsed) {
        console.error('skipping invalid code');
        return;
      }
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

  const onCodeNodeTextChange = useCallback(
    (fullPath, functionId, newBodyStatements) => {
      console.log('valud', newBodyStatements);
      // update the body of the function

      const file = flatFiles[fullPath];
      visit(file.fullAst, {
        visitFunctionDeclaration(path) {
          if (path.node._id && path.node._id === functionId) {
            path.get('body').replace({
              type: 'BlockStatement',
              body: newBodyStatements,
            });

            return false;
          }

          this.traverse(path);
        },
      });

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
    // store.setFunctions((functions) =>
    //   functions.map((func) => {
    //     if (func.id === functionId) {
    //       func.name = title;
    //     }
    //     return func;
    //   })
    // );
    setNodes((nodes) =>
      nodes.map((node) => {
        if (node.data.functionId === functionId) {
          node.data = { ...node.data, functionName: title };
        }
        return node;
      })
    );
  }, []);

  return {
    onModuleClose,
    toggleShowChildModules,
    onCodeNodeTextChange,
    onfunctionTitledChanged,
    onRootNodeTextChange,
  };
};
