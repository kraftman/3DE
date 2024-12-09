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
  const { setNodes, setEdges } = useStore(
    useShallow((state) => ({
      setNodes: state.setNodes,
      setEdges: state.setEdges,
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

  const toggleChildren = useCallback(
    (localFlatFiles, moduleId, showChildren) => {
      // later need to make sure the children arent already open
      if (showChildren) {
        return setNodes((nodes) => hideModuleChildren(nodes, moduleId));
      }

      setNodes((nodes) => {
        const { newNodes, newEdges } = showModuleChildren(
          nodes,
          moduleId,
          localFlatFiles
        );
        setEdges(newEdges);
        return newNodes;
      });
    },
    []
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
          // Find the matching function by ID
          console.log('checking path:', path);
          if (path.node._id && path.node._id === functionId) {
            console.log('Updating function:', path.node.id.name);

            // Replace the function's body with the new statements
            path.get('body').replace({
              type: 'BlockStatement',
              body: newBodyStatements,
            });

            console.log('Updated function:', path.node);
            return false; // Stop further traversal
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
    toggleChildren,
    onCodeNodeTextChange,
    onfunctionTitledChanged,
    onRootNodeTextChange,
  };
};
