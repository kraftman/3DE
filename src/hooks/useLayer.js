import { useStore } from '../contexts/useStore'; // adjust the import path as needed
import {
  findChildIds,
  getFunctionContent,
  getImportHandles,
} from '../utils/nodeUtils';

import { getNodesForFile } from '../utils/getNodesForFile.js';

import path from 'path-browserify';

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
    // might be able to merge this with onCodeNodeTextChange
    store.setNodes((nodes) => {
      return nodes.map((node) => {
        if (node.data.fullPath === fullPath && node.type === 'module') {
          node.data = { ...node.data, rootCode: value };
        }
        return node;
      });
    });
  };

  const onCodeNodeTextChange = (fullPath, functionId, value) => {
    // update the body of the function

    store.setFlatFiles((files) => {
      const file = files[fullPath];

      const newFile = {
        ...file,
        functions: file.functions.map((func) => {
          if (func.id === functionId) {
            func.body = value;
          }
          return func;
        }),
      };
      return { ...files, [fullPath]: newFile };
    });

    store.setNodes((nodes) => {
      return nodes.map((node) => {
        if (node.data.functionId === functionId && node.type === 'code') {
          node.data = { ...node.data, content: value };
        }
        return node;
      });
    });
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

  const onFileSelected = (newPos, fullPath) => {
    const fileInfo = store.flatFiles[fullPath];

    const newNodes = getNodesForFile(fileInfo, newPos, null);
    console.log('newNodes', newNodes);
    store.setNodes((nodes) => nodes.concat(newNodes));
  };

  return {
    ...store,
    nodes: nodes,
    edges: edges,
    onModuleClose,
    toggleChildren,
    onCodeNodeTextChange,
    onfunctionTitledChanged,
    onFileSelected,
    onRootNodeTextChange,
  };
};
