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

  const onCodeNodeTextChange = (moduleId, functionId, value) => {
    store.setModules((modules) => {
      return modules.map((module) => {
        if (module.id === moduleId) {
          module.functions = module.functions.map((func) => {
            if (func.id === functionId) {
              func.data.content = value;
            }
            return func;
          });
        }
        return module;
      });
    });

    store.setNodes((nodes) => {
      return nodes.map((node) => {
        if (node.data.functionId === functionId && node.type === 'code') {
          console.log('found node:', node);
          node.data = { ...node.data, content: value };
        }
        return node;
      });
    });
  };

  const onFunctionTextChanged = (functionId, content) => {
    let foundfunc;
    store.setFunctions((functions) =>
      functions.map((func) => {
        if (func.id === functionId) {
          func.content = content;
          foundfunc = func;
        }
        return func;
      })
    );
    store.setNodes((nodes) =>
      nodes.map((node) => {
        if (node.data.functionId === functionId) {
          node.data = { ...node.data, content, functionName: foundfunc.name };
        }
        return node;
      })
    );
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

    const fileContents = fileInfo.fileData;

    const newNodes = getNodesForFile(fullPath, fileContents, newPos, null);
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
    onFunctionTextChanged,
    onfunctionTitledChanged,
    onFileSelected,
  };
};
