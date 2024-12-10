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

      visit(fileAst, {
        visitProgram(path) {
          const body = path.node.body;

          // Separate imports and other declarations
          const importNodes = [];
          const otherNodes = [];

          body.forEach((node) => {
            if (node.type === 'ImportDeclaration') {
              importNodes.push(node);
            } else {
              const isRoot = isRootLevelNode(path.node);
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

      setFlatFiles((files) => {
        const file = files[fullPath];

        const newFile = {
          ...file,
          functions: file.functions.map((func) => {
            if (func.id === functionId) {
              console.log('updating function', func);
              const newFunc = {
                ...func,
                node: {
                  ...func.node,
                  body: {
                    ...func.node.body,
                    body: newBodyStatements,
                  },
                },
              };
              console.log('after update', newFunc);
              return newFunc;
            }
            return func;
          }),
        };
        return { ...files, [fullPath]: newFile };
      });

      // also need to handle them creating a new function in code
    },
    []
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
