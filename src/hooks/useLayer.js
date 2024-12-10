import { useCallback } from 'react';
import { useStore } from '../contexts/useStore'; // adjust the import path as needed

import { parseWithRecast } from '../utils/parseWithRecast.js';
import { useShallow } from 'zustand/react/shallow';

import {
  hideModuleChildren,
  showModuleChildren,
} from '../utils/moduleUtils.js';
import { useFileSystem } from '../stores/useFileSystem.js';

export const useLayer = () => {
  const { setNodes, setEdges } = useStore(
    useShallow((state) => ({
      setNodes: state.setNodes,
      setEdges: state.setEdges,
    }))
  );
  const setFlatFiles = useFileSystem(useShallow((state) => state.setFlatFiles));

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

  const onRootNodeTextChange = useCallback((fullPath, value) => {
    // need to edit the actual rootcode ast
    const parsed = parseWithRecast(value);
    if (!parsed) {
      console.error('skipping invalid code');
      return;
    }
    setFlatFiles((files) => {
      const file = files[fullPath];
      const newFile = {
        ...file,
        rootCode: parsed,
      };
      console.log('setting new file', newFile);
      return { ...files, [fullPath]: newFile };
    });
  }, []);

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
