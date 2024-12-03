import { useStore } from '../contexts/useStore';
import {
  getRaw,
  findChildIds,
  getFunctionContent,
  getImportHandles,
} from '../utils/nodeUtils';

import { getNodesForFile } from '../utils/getNodesForFile.js';
import path from 'path-browserify';

const functionIsOutsideParent = (parent, functionNode) => {
  return (
    functionNode.position.x > parent.data.width ||
    functionNode.position.y > parent.data.height ||
    functionNode.position.x + functionNode.data.width < 0 ||
    functionNode.position.y + functionNode.data.height < 0
  );
};

const stripExt = (filename) => {
  return filename.replace(/\.[^/.]+$/, '');
};

export const useNodeManager = () => {
  const store = useStore();

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
      rootCode: [],
      functions: [],
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
      const newNodes = getNodesForFile(newFile, newPosition, moduleId);
      return nodes.concat(newNodes);
    });
  };

  const onNodeDragStart = (event, node) => {
    if (!event.shiftKey) {
      return;
    }
    if (node.type === 'pureFunctionNode') {
      store.setNodes((nodes) => {
        const newNodes = nodes.map((search) => {
          if (search.id === node.id) {
            search = { ...search, extent: undefined };
          }
          return search;
        });
        return newNodes;
      });
    }
  };

  const handleFunctionDrag = (functionNode) => {
    const parentModule = store.nodes.find(
      (node) => node.id === functionNode.data.moduleId
    );
    const isOutside = functionIsOutsideParent(parentModule, functionNode);

    if (!isOutside) {
      console.log('still in module, skipping');
      store.setNodes((nodes) => {
        const newNodes = nodes.map((search) => {
          if (search.id === functionNode.id) {
            search.extent = 'parent';
          }
          return search;
        });
        return newNodes;
      });
      return;
    }

    const { functionName } = functionNode.data;

    const lines = [];
    getFunctionContent(lines, store.nodes, functionNode.parentId);
    const finalContent = lines.join('\n');

    const parentPath = parentModule.data.fullPath;
    const parentDir = path.dirname(parentPath);
    const newPath = path.join(parentDir, functionName + '.js');

    store.setFlatFiles((files) => {
      const newFiles = {
        ...files,
        [newPath]: {
          index: newPath,
          children: [],
          data: functionName + '.js',
          fileData: finalContent,
          isFolder: false,
        },
      };
      return newFiles;
    });

    store.setNodes((nodes) => {
      const newPosition = {
        x: parentModule.data.width + 100,
        y: 0,
      };
      const newNodes = getNodesForFile(
        newPath,
        finalContent,
        newPosition,
        functionNode.data.moduleId
      );

      const childNodeIds = findChildIds(nodes, functionNode.id);

      childNodeIds.push(functionNode.id);
      nodes = nodes.filter((node) => !childNodeIds.includes(node.id));
      console.log('after filter:', nodes);
      nodes = nodes.map((node) => {
        if (node.id === functionNode.data.moduleId) {
          const newImport = {
            name: functionName,
            imported: functionName,
            moduleSpecifier: './' + functionName,
            type: 'local',
            fullPath: stripExt(newPath),
          };
          console.log('newImport', newImport);
          const newHandles = getImportHandles(
            node.data.imports.concat(newImport),
            node.id
          );
          console.log('newHandles', newHandles);

          return {
            ...node,
            data: {
              ...node.data,
              imports: node.data.imports.concat(newImport),
              handles: newHandles,
            },
          };
        }
        return node;
      });
      return nodes.concat(newNodes);
    });

    // remove the function from its parent module
    // create a new file using the function name in the directory of the parent
    // check there isnt one already
    // add the function to the new file as an export
    // add an import to the parent module
  };

  const onNodeDragStop = (event, node) => {
    if (node.type === 'pureFunctionNode') {
      handleFunctionDrag(node);
    }
  };

  return {
    toggleHideImmediateChildren,
    createMissingImport,
    onNodeDragStart,
    onNodeDragStop,
    getNodeById: (id) =>
      store.layers[store.currentLayer]?.nodes.find((node) => node.id === id),
  };
};
