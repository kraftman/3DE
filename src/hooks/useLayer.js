import { useStore } from '../contexts/useStore'; // adjust the import path as needed

import { parseWithRecast } from '../utils/parseWithRecast.js';

import {
  hideModuleChildren,
  showModuleChildren,
} from '../utils/moduleUtils.js';

export const useLayer = () => {
  const store = useStore();

  const nodes = store.layers[store.currentLayer]?.nodes || [];
  const edges = store.layers[store.currentLayer]?.edges || [];

  const onModuleClose = (moduleId) => {
    store.setNodes((nodes) => {
      const nonModuleNodes = nodes.filter(
        (node) => node.data.moduleId !== moduleId
      );
      return nonModuleNodes;
    });
  };

  const toggleChildren = (localFlatFiles, moduleId, showChildren) => {
    // later need to make sure the children arent already open
    if (showChildren) {
      return store.setNodes((nodes) => hideModuleChildren(nodes, moduleId));
    }

    store.setNodes((nodes) => {
      const { newNodes, newEdges } = showModuleChildren(
        nodes,
        moduleId,
        localFlatFiles
      );
      store.setEdges(newEdges);
      return newNodes;
    });
  };

  const onRootNodeTextChange = (fullPath, value) => {
    // need to edit the actual rootcode ast
    const parsed = parseWithRecast(value);
    if (!parsed) {
      console.error('skipping invalid code');
      return;
    }
    store.setFlatFiles((files) => {
      const file = files[fullPath];
      const newFile = {
        ...file,
        rootCode: parsed,
      };
      console.log('setting new file', newFile);
      return { ...files, [fullPath]: newFile };
    });
  };

  const onCodeNodeTextChange = (fullPath, functionId, newBodyStatements) => {
    console.log('valud', newBodyStatements);
    // update the body of the function

    store.setFlatFiles((files) => {
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
  };

  const onfunctionTitledChanged = (functionId, title) => {
    store.setFunctions((functions) =>
      functions.map((func) => {
        if (func.id === functionId) {
          func.name = title;
        }
        return func;
      })
    );
    store.setNodes((nodes) =>
      nodes.map((node) => {
        if (node.data.functionId === functionId) {
          node.data = { ...node.data, functionName: title };
        }
        return node;
      })
    );
  };

  return {
    nodes: nodes,
    edges: edges,
    onModuleClose,
    toggleChildren,
    onCodeNodeTextChange,
    onfunctionTitledChanged,
    onRootNodeTextChange,
  };
};
