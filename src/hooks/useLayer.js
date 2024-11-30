import { useStore } from '../contexts/useStore'; // adjust the import path as needed
import { getRaw } from '../utils/nodeUtils';

import { getNodesForFile } from '../utils/getNodesForFile.js';

export const useLayer = () => {
  const store = useStore();

  const nodes = store.layers[store.currentLayer]?.nodes || [];
  const edges = store.layers[store.currentLayer]?.edges || [];

  const toggleHideImmediateChildren = (moduleId) => {
    store.setNodes((nodes) => {
      const moduleNodes = nodes.filter(
        (node) => node.data.moduleId === moduleId
      );
      console.log('found module nodes:', moduleNodes);
      const moduleNodeIds = moduleNodes.map((node) => node.id);

      const moduleNode = moduleNodes.find(
        (node) => node.type === 'module' && node.id === moduleId
      );

      const newRaw = getRaw(moduleId, moduleNodes);
      const newNodes = nodes.map((node) => {
        if (moduleNodeIds.includes(node.id) && node.type !== 'module') {
          return {
            ...node,
            hidden: moduleNode.data.showRaw,
          };
        }
        if (node.type === 'module' && node.id === moduleId) {
          node.data = {
            ...node.data,
            showRaw: !node.data.showRaw,
            raw: newRaw,
          };
        }
        return node;
      });
      return newNodes;
    });
  };

  const createMissingImport = (moduleId, importPath) => {
    // we dont know the extension so assume js for now
    const fullPath = importPath + '.js';
    if (store.flatFiles[fullPath]) {
      return;
    }
    const newFile = {
      index: fullPath,
      children: [],
      data: fullPath,
      fileData: '',
      isFolder: false,
    };
    store.setFlatFiles((files) => {
      const newFiles = {
        ...files,
        [fullPath]: newFile,
      };
      return newFiles;
    });

    store.setNodes((nodes) => {
      const parentModule = nodes.find(
        (node) => node.id === moduleId && node.type === 'module'
      );
      const newPosition = {
        x: parentModule.data.width + 100,
        y: 0,
      };
      const newNodes = getNodesForFile(fullPath, '', newPosition, moduleId);
      return nodes.concat(newNodes);
    });
  };

  const onModuleClose = (moduleId) => {
    store.setNodes((nodes) => {
      const nonModuleNodes = nodes.filter(
        (node) => node.data.moduleId !== moduleId
      );
      return nonModuleNodes;
    });
  };

  return {
    ...store,
    nodes: nodes,
    edges: edges,
    getNodeById: (id) =>
      store.layers[store.currentLayer]?.nodes.find((node) => node.id === id),
    toggleHideImmediateChildren,
    onModuleClose,
    createMissingImport,
  };
};
