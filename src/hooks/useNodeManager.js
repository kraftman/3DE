import { useStore } from '../contexts/useStore';
import {
  getRaw,
  findChildIds,
  getFunctionContent,
  getImportHandles,
} from '../utils/nodeUtils';
import { useUpdateNodeInternals } from '@xyflow/react';

import { getNodesForFile } from '../utils/getNodesForFile.js';
import path from 'path-browserify';
import {
  collapseModule,
  expandModule,
  findChildNodes,
  findChildModules,
} from '../utils/moduleUtils';
import { useFileManager } from './useFileManager.js';
import { findFileForImport, importWithoutExtension } from '../utils/fileUtils';

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
  const { renameFile } = useFileManager();
  const updateNodeInternals = useUpdateNodeInternals();

  const toggleHideImmediateChildren = (moduleId) => {
    store.setNodes((nodes) => {
      const moduleNodes = nodes.filter(
        (node) => node.data.moduleId === moduleId
      );

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

  const toggleCollapseModule = (moduleId, isCollapsed) => {
    console.log('toggleCollapseModule', moduleId, isCollapsed);
    store.setNodes((nodes) => {
      let newNodes;
      if (isCollapsed) {
        console.log('expanding');
        newNodes = expandModule(nodes, moduleId);
      } else {
        console.log('collapsing');
        newNodes = collapseModule(nodes, moduleId);
      }
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
  };

  const onNodeDragStop = (event, node) => {
    if (node.type === 'pureFunctionNode') {
      handleFunctionDrag(node);
    }
  };

  const renameModule = (moduleId, newPath) => {
    store.setNodes((nodes) => {
      const moduleNode = nodes.find(
        (node) => node.id === moduleId && node.type === 'module'
      );
      const oldPath = moduleNode.data.fullPath;
      console.log('rename', oldPath, newPath);
      renameFile(oldPath, newPath);

      return nodes.map((node) => {
        if (node.id === moduleId) {
          return {
            ...node,
            data: {
              ...node.data,
              fullPath: newPath,
            },
          };
        }
        return node;
      });
    });

    // should ths be here or filemanager?
    // need to change the fullpath in the module
    // and in the filesystem
  };

  const toggleChildModule = (moduleId, fullPath) => {
    console.log('toggle child module', fullPath);
    // if the child module exists, remove it
    // if the child module doesnt exist, create it

    // const fileInfo = store.flatFiles[fullPath];

    // const newNodes = getNodesForFile(fileInfo, newPos, null);
    // console.log('newNodes', newNodes);
    // store.setNodes((nodes) => nodes.concat(newNodes));

    // find modules where the path is the fullPath, and the parentId is this module
    // recursively remove it and its children
    store.setNodes((nodes) => {
      const children = findChildModules(nodes, moduleId);
      console.log('children', children);
      const foundChild = children.find(
        (child) =>
          importWithoutExtension(child.data.fullPath) ===
          importWithoutExtension(fullPath)
      );
      if (foundChild) {
        const childrenOfChild = findChildNodes(nodes, foundChild.id);
        const childIds = childrenOfChild.map((child) => child.id);
        childIds.push(foundChild.id);
        return nodes.filter((node) => !childIds.includes(node.id));
      } else {
        const parentModule = nodes.find(
          (node) => node.id === moduleId && node.type === 'module'
        );
        const newPos = {
          x: parentModule.position.x + 500,
          y: 0,
        };
        const resolvedFile = findFileForImport(store.flatFiles, fullPath);

        const newNodes = getNodesForFile(resolvedFile, newPos, moduleId);
        return nodes.concat(newNodes);
      }
    });
  };

  const getNodeById = (id) => {
    return store.layers[store.currentLayer]?.nodes.find(
      (node) => node.id === id
    );
  };

  return {
    toggleHideImmediateChildren,
    toggleCollapseModule,
    createMissingImport,
    onNodeDragStart,
    onNodeDragStop,
    renameModule,
    toggleChildModule,
    getNodeById,
  };
};
