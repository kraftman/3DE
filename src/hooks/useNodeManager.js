import { useStore } from '../contexts/useStore';
import { useCallback } from 'react';
const { namedTypes: n, visit } = require('ast-types');
import { v4 as uuid } from 'uuid';
import {
  findChildIds,
  getImportHandles,
} from '../utils/nodeUtils/nodeUtils.js';
import * as recast from 'recast';
import { createChildNodes } from '../utils/createChildNodes.js';

import { getNodesForFile } from '../utils/getNodesForFile.js';
import path from 'path-browserify';
import {
  collapseModule,
  expandModule,
  findChildNodes,
  findChildModules,
} from '../utils/moduleUtils';
import { useFileManager } from './useFileManager.js';
import {
  findFileForImport,
  importWithoutExtension,
  enrichFileInfo,
} from '../utils/fileUtils';
import { removeFunctionFromAst, addFunctionToAst } from '../utils/codeUtils';
import { findHandleEdges } from '../utils/moduleUtils';

import { useShallow } from 'zustand/react/shallow';
import { useFileSystem } from '../stores/useFileSystem.js';

import { useReactFlow } from '@xyflow/react';
import { checkAndFixFunctionHoisting } from '../utils/checkAndFixFunctionHoisting.js';
import { useLayout } from './useLayout.js';
import { createPartialNode } from '../utils/nodeUtils/nodeUtils.js';

const positionIsInsideModule = (parent, newPos) => {
  return (
    newPos.x > parent.position.x &&
    newPos.y > parent.position.y &&
    newPos.x < parent.position.x + parent.data.width &&
    newPos.y < parent.position.y + parent.data.height
  );
};

const getModulesUnderPosition = (nodes, newPos) => {
  const moduleNodes = nodes.filter((node) => node.type === 'module');
  const foundModule = moduleNodes.find((module) =>
    positionIsInsideModule(module, newPos)
  );
  return foundModule;
};

const stripExt = (filename) => {
  return filename.replace(/\.[^/.]+$/, '');
};

export const useNodeManager = () => {
  const { setNodes, getNodes, setEdges, getEdges } = useStore(
    useShallow((state) => ({
      setNodes: state.setNodes,
      setEdges: state.setEdges,
      getNodes: state.getNodes,
      getEdges: state.getEdges,
    }))
  );
  const { setFlatFiles, flatFiles } = useFileSystem();
  const { renameFile, createFile } = useFileManager();
  const { layoutNodes } = useLayout();

  const { screenToFlowPosition } = useReactFlow();

  const toggleShowRawCode = useCallback(
    (moduleId) => {
      setNodes((nodes) => {
        const moduleNodes = nodes.filter(
          (node) => node.data.moduleId === moduleId
        );
        const moduleNodeIds = moduleNodes.map((node) => node.id);
        const moduleNode = moduleNodes.find(
          (node) => node.id === moduleId && node.type === 'module'
        );

        const fullPath = moduleNode.data.fullPath;
        const fileInfo = flatFiles[fullPath];
        checkAndFixFunctionHoisting(fileInfo.fullAst);
        const newRaw = recast.print(fileInfo.fullAst).code;
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
    },
    [flatFiles]
  );

  const toggleCollapseModule = useCallback((moduleId, isCollapsed) => {
    setNodes((nodes) => {
      let newNodes;
      if (isCollapsed) {
        newNodes = expandModule(nodes, moduleId);
      } else {
        newNodes = collapseModule(nodes, moduleId);
      }
      return newNodes;
    });

    layoutNodes();
  }, []);

  const createMissingImport = useCallback(
    (moduleId, importPath) => {
      // we dont know the extension so assume js for now
      const fullPath = importPath + '.js';
      if (flatFiles[fullPath]) {
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
      enrichFileInfo(newFile);
      setFlatFiles((files) => {
        const newFiles = {
          ...files,
          [fullPath]: newFile,
        };
        return newFiles;
      });

      setNodes((nodes) => {
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
    },
    [flatFiles]
  );

  const onNodeDragStart = useCallback((event, node) => {
    if (!event.shiftKey) {
      return;
    }
    if (node.type === 'pureFunctionNode') {
      unclampFunction(node.id);
    }
  }, []);

  const clampFunctionToModule = useCallback((functionNodeId) => {
    setNodes((nodes) => {
      const newNodes = nodes.map((search) => {
        if (search.id === functionNodeId) {
          return {
            ...search,
            extent: 'parent',
          };
        }
        return search;
      });
      return newNodes;
    });
  }, []);

  const unclampFunction = useCallback((functionNodeId) => {
    setNodes((nodes) => {
      const newNodes = nodes.map((search) => {
        if (search.id === functionNodeId) {
          return {
            ...search,
            extent: undefined,
          };
        }
        return search;
      });
      return newNodes;
    });
  }, []);

  const moveFunctionToNewParent = (newParent, oldParent, functionNode) => {
    // remove the function from the old module ast
    // remove the function from the old module functions list
    // add the function to the new module ast
    // add the function to the new module functions list
    // create a new node for the function
    let fileInfo = flatFiles[functionNode.data.fullPath];
    removeFunctionFromAst(fileInfo.fullAst, functionNode.data.functionId);
    const foundFunction = fileInfo.functions.find(
      (func) => func.id === functionNode.data.functionId
    );
    console.log('founnd function', foundFunction);

    const newFileInfo = flatFiles[newParent.data.fullPath];
    addFunctionToAst(newFileInfo.fullAst, foundFunction.node);

    setFlatFiles((files) => {
      const newFiles = {
        ...files,
        [functionNode.data.fullPath]: {
          ...fileInfo,
          functions: fileInfo.functions.filter(
            (func) => func.id !== functionNode.data.functionId
          ),
        },
        [newParent.data.fullPath]: {
          ...files[newParent.data.fullPath],
          functions:
            files[newParent.data.fullPath].functions.concat(foundFunction),
        },
      };
      return newFiles;
    });

    setNodes((nodes) => {
      return nodes.map((node) => {
        if (node.id === functionNode.id) {
          return {
            ...node,
            parentId: newParent.id,
            position: {
              x: 100,
              y: 100,
            },
            data: {
              ...node.data,
              moduleId: newParent.id,
              fullPath: newParent.data.fullPath,
            },
          };
        }
        if (
          node.data.fullPath === functionNode.data.fullPath &&
          node.type !== 'module'
        ) {
          return {
            ...node,
            data: {
              ...node.data,
              moduleId: newParent.id,
              fullPath: newParent.data.fullPath,
            },
          };
        }
        return node;
      });
    });
  };

  const createModuleForFunction = (functionNode, parentModule) => {
    // Get all imports for the file
    // find any imports that the function uses
    // remove the function from the AST
    // check if there are imports that are no longer used by the remaining code
    // if so, remove them
    // add the imports that the functions uses to the new file
    // add an import to the new filed
    // remove the function from the functions array
    // remove the function node and its children from the nodes array.
    // create the new nodes and add them to the nodes array
    const { functionId, functionName } = functionNode.data;

    const fileInfo = flatFiles[functionNode.data.fullPath];
    const foundFunction = fileInfo.functions.find(
      (func) => func.id === functionId
    );

    console.log('foundFunction', foundFunction);
    const finalContent = recast.print(foundFunction.node, {
      reuseWhitespace: true,
    }).code;

    removeFunctionFromAst(fileInfo.fullAst, functionId);

    const parentPath = parentModule.data.fullPath;
    const parentDir = path.dirname(parentPath);
    const newPath = path.join(parentDir, functionName + '.js');
    const newFileInfo = {
      index: newPath,
      children: [],
      data: functionName + '.js',
      fileData: finalContent,
      savedData: finalContent,
      isFolder: false,
    };

    enrichFileInfo(newFileInfo);
    createFile(newFileInfo);

    setFlatFiles((files) => {
      const newFiles = {
        ...files,
        [functionNode.data.fullPath]: { ...fileInfo },
      };
      return newFiles;
    });

    setNodes((nodes) => {
      const newPosition = {
        x: parentModule.data.width + 100,
        y: 0,
      };

      const newNodes = getNodesForFile(
        newFileInfo,
        newPosition,
        functionNode.data.moduleId
      );

      const childNodeIds = findChildIds(nodes, functionNode.id);

      childNodeIds.push(functionNode.id);

      // remove the old function from the old module
      // also need to remove the children
      nodes = nodes.filter((node) => !childNodeIds.includes(node.id));

      nodes = nodes.map((node) => {
        if (node.id === functionNode.data.moduleId) {
          const newImport = {
            name: functionName,
            imported: functionName,
            moduleSpecifier: './' + functionName,
            type: 'local',
            fullPath: stripExt(newPath),
          };
          const newHandles = getImportHandles(
            node.data.imports.concat(newImport),
            node.id
          );

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

  const onNodeDragStop = useCallback(
    (event, node) => {
      if (node.type === 'pureFunctionNode') {
        const currentNodes = getNodes();
        const functionNode = node;
        const parentModule = currentNodes.find(
          (node) => node.id === functionNode.data.moduleId
        );
        const rPos = screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });
        const newParent = getModulesUnderPosition(currentNodes, rPos);

        if (!newParent) {
          return createModuleForFunction(functionNode, parentModule);
        }

        if (newParent?.id === parentModule.id) {
          console.log('clamping');
          clampFunctionToModule(functionNode.id);
          return;
        }
        // // TODO: handle dragging function into another function
        return moveFunctionToNewParent(newParent, parentModule, functionNode);
      }
    },
    [flatFiles]
  );

  const renameModule = useCallback((moduleId, newPath) => {
    setNodes((nodes) => {
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
  }, []);

  const toggleChildModule = useCallback(
    (moduleId, fullPath, depth) => {
      const nodes = getNodes();
      const children = findChildModules(nodes, moduleId);
      const foundChild = children.find(
        (child) =>
          importWithoutExtension(child.data.fullPath) ===
          importWithoutExtension(fullPath)
      );
      if (foundChild) {
        const foundNodes = [
          foundChild,
          ...findChildNodes(nodes, foundChild.id),
        ];
        const childIds = foundNodes.map((child) => child.id);
        setNodes((nodes) => {
          return nodes.map((node) => {
            if (childIds.includes(node.id)) {
              return {
                ...node,
                hidden: !foundChild.hidden,
              };
            }
            return node;
          });
        });
      } else {
        const moduleNode = nodes.find((node) => node.id === moduleId);
        let newNodes = createChildNodes(
          flatFiles,
          nodes,
          moduleNode,
          fullPath,
          depth
        );
        const moduleNodes = newNodes.filter((node) => node.type === 'module');
        const edges = getEdges();
        // TODO fix edges here
        const newEdges = findHandleEdges(edges, nodes, moduleNodes);
        setNodes((nodes) => nodes.concat(newNodes));
        setEdges((edges) => [...edges, ...newEdges]);

        layoutNodes();
      }
    },
    [flatFiles]
  );

  const togglePartialModule = useCallback(
    (moduleId, relativePath, functionName) => {
      const nodes = getNodes();
      const moduleNode = nodes.find((node) => node.id === moduleId);
      const fullPath = path.join(
        path.dirname(moduleNode.data.fullPath),
        relativePath
      );
      const fileInfo = findFileForImport(flatFiles, fullPath);
      const foundFunction = fileInfo.functions.find(
        (func) => func.name === functionName
      );

      const existingNode = nodes.find(
        (node) =>
          node.data.fullPath === fileInfo.index &&
          node.data.functionId === foundFunction.id
      );
      if (existingNode) {
        setNodes((nodes) => {
          return nodes.map((node) => {
            if (node.id === existingNode.id) {
              return {
                ...node,
                hidden: !existingNode.hidden,
              };
            }
            return node;
          });
        });
        return;
      }

      const newNode = createPartialNode(
        foundFunction,
        moduleNode,
        fileInfo.index
      );
      setNodes((nodes) => {
        return nodes.concat(newNode);
      });

      const newEdge = {
        id: uuid(),
        source: moduleId,
        target: newNode.id,
        sourceHandle: moduleNode.id + '-' + fullPath + ':out',
        targetHandle: newNode.id + '-handle',
      };
      setEdges((edges) => {
        return edges.concat(newEdge);
      });

      layoutNodes();
    },
    [flatFiles]
  );

  return {
    toggleShowRawCode,
    toggleCollapseModule,
    togglePartialModule,
    createMissingImport,
    onNodeDragStart,
    onNodeDragStop,
    renameModule,
    toggleChildModule,
  };
};
