import React, {
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
} from 'react';
import {
  ReactFlow,
  MiniMap,
  Panel,
  Controls,
  Background,
  useReactFlow,
  useUpdateNodeInternals,
  applyEdgeChanges,
  applyNodeChanges,
} from '@xyflow/react';

import dagre from '@dagrejs/dagre';
import Button from '@mui/material/Button';
import { Tooltip } from 'react-tooltip';

import '@xyflow/react/dist/style.css';

// or if you just want basic styles
import '@xyflow/react/dist/base.css';
import 'react-tooltip/dist/react-tooltip.css';
import { EditorNode } from '../../components/nodes/EditorNode';
import { ModuleNode } from '../../components/nodes/ModuleNode/ModuleNode.jsx';
import { PureFunctionNode } from '../../components/nodes/PureFunctionNode/PureFunctionNode';
import { CodeNode } from '../../components/nodes/CodeNode/CodeNode';
import { PreviewNode } from '../../components/nodes/PreviewNode';
import { GroupNode } from '../../components/nodes/GroupNode';
import { SettingsNode } from '../../components/nodes/SettingsNode/SettingsNode';
import { ImageNode } from '../../components/nodes/ImageNode';

import { FolderSelectButton } from '../../components/FolderSelectButton';
import { BasicTree } from '../../components/FolderTree';
import './updatenode.css';
import path from 'path-browserify';

import { SnackbarProvider, enqueueSnackbar } from 'notistack';
import { useLayer } from './useLayer';

import { v4 as uuidv4 } from 'uuid';

import {
  LayerManager,
  getRandomDarkHexColorWithAlpha,
} from '../../components/LayerManager';

import { SearchBar } from '../../components/SearchBar';

import { removeTextChunk, insertTextChunk } from '../../components/editorUtils';

import {
  createSelectionHandle,
  getNewEdges,
  getNewNodeId,
  isValidCode,
} from './utils';
import { useFileSystem } from '../../contexts/FileSystemContext';

import { getModuleNodes, findChildren, getRaw } from '../../utils/nodeUtils.js';

import { parseCode } from '../../utils/parser';

import { mockModule } from './mocks.js';

const defaultViewport = { x: 0, y: 0, zoom: 1.5 };

import { loadSession, saveSession } from '../../electronHelpers.js';

import { getNodesForFile } from '../../utils/getNodesForFile.js';

import { TextNode } from '../../components/nodes/TextNode/TextNode.js';
import { MarkdownNode } from '../../components/nodes/MarkdownNode/MarkdownNode.js';

import {
  hideModuleChildren,
  showModuleChildren,
} from '../../utils/moduleUtils.js';

export const Flow = () => {
  const {
    setLayers,
    setCurrentLayer,
    layers,
    setNodes,
    setEdges,
    nodes,
    edges,
    state: layerState,
    currentLayer,
  } = useLayer();

  const [focusNode, setFocusNode] = useState(null);
  const [functions, setFunctions] = useState([]);
  const [draggingNode, setDraggingNode] = useState(null);
  const [modules, setModules] = useState([]);

  const updateNodeInternals = useUpdateNodeInternals();

  const { flatFiles, rootPath, loadFileSystem, setFlatFiles } = useFileSystem();

  const loadModules = () => {
    // parse the module into an AST, getting the exports, the imports, the root level declarations,
    try {
      const newModule = parseCode(mockModule);
      const fullPath = '/home/chris/marvel-app/src/app/character/[id]/page.tsx';
      const moduleNodes = getModuleNodes(newModule, fullPath);
      const { moduleNode, rootCode, children, edges: newEdges } = moduleNodes;

      const allNodes = [].concat(moduleNode).concat(rootCode).concat(children);
      setNodes((nodes) => {
        return nodes.concat(allNodes);
      });

      setEdges((edges) => {
        return edges.concat(newEdges);
      });
      setModules((modules) => modules.concat(module));
    } catch (e) {
      console.error('error parsing module:', e);
    }
  };

  useEffect(() => {
    const loadSessions = async () => {
      return;
    };
    loadSessions();
    loadModules();
    onFolderSelected('/home/chris/marvel-app');
  }, []);

  const onNodeClick = (event, node) => {
    setFocusNode(node);
  };

  useEffect(() => {
    const handleKeyDown = async (e) => {
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        const fullPath = nodes.find((node) => node.id === focusNode.id).data
          .fullPath;

        const extension = path.extname(fullPath);
        const jsFiles = ['.js', '.jsx', '.ts', '.tsx'];
        const isJsFile = jsFiles.includes(extension);

        const fileData = flatFiles[fullPath].fileData;
        const isValid = isValidCode(fileData);
        if (!isJsFile || !isValid) {
          enqueueSnackbar({
            message: 'Invalid code',
            options: {
              variant: 'error',
            },
          });
          return;
        }

        //TODO use the result as the new file contents, as it should be formatted
        setFlatFiles((files) => {
          const newFiles = {
            ...files,
            [fullPath]: { ...files[fullPath], savedData: fileData },
          };
          return newFiles;
        });
      } else if (e.ctrlKey && e.key === 'ArrowUp') {
        const nextLayer = Math.max(currentLayer - 1, 0);
        setCurrentLayer(nextLayer);
      } else if (e.ctrlKey && e.key === 'ArrowDown') {
        const numLayers = Object.keys(layers).length;
        const nextLayer = Math.min(currentLayer + 1, numLayers - 1);

        setCurrentLayer(nextLayer);
      } else if (e.ctrlKey && e.shiftKey && e.key === 'T') {
        setLayers((layers) => {
          const layerCount = Object.keys(layers).length;
          return {
            ...layers,
            [layerCount]: {
              nodes: [],
              edges: [],
              color: getRandomDarkHexColorWithAlpha(),
            },
          };
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [focusNode, flatFiles, currentLayer, layers]);

  const onNodesChange = (changes) => {
    setNodes((prevNodes) => {
      return applyNodeChanges(changes, prevNodes);
    });
  };

  const onEdgesChange = (changes) => {
    setEdges((prevEdges) => {
      applyEdgeChanges(changes, prevEdges);
    });
  };

  const connectingNodeId = useRef(null);
  const connectingHandleId = useRef(null);
  const { screenToFlowPosition, getIntersectingNodes } = useReactFlow();

  const onFileNameChange = (nodeId, oldFullPath, newFileName) => {
    const newFullPath = path.join(path.dirname(oldFullPath), newFileName);

    setFlatFiles((files) => {
      const newFiles = { ...files };
      const fileData = newFiles[oldFullPath];
      delete newFiles[oldFullPath];

      newFiles[newFullPath] = { ...fileData, data: newFileName };

      for (const [key, value] of Object.entries(files)) {
        if (value.children.includes(oldFullPath)) {
          value.children = value.children.map((child) =>
            child === oldFullPath ? newFullPath : child
          );
        }
      }

      return newFiles;
    });

    setNodes((nodes) =>
      nodes.map((node) => {
        if (node.id === nodeId) {
          node.data = {
            ...node.data,
            fileName: newFileName,
            fullPath: newFullPath,
          };
        }
        return node;
      })
    );
  };

  const onSettingsChanged = (newSettings) => {
    //setSettings(newSettings);
    // also update settings node
    setNodes((nodes) =>
      nodes.map((node) => {
        if (node.type === 'settings') {
          node.data = { ...node.data, settings: newSettings };
        }
        return node;
      })
    );
  };

  const onSelectionChange = (nodeId, selection) => {
    if (!selection) {
      // setNodes((nodes) =>
      //   nodes.map((node) => {
      //     if (node.id === nodeId) {
      //       const newHandles = node.data.handles.filter(
      //         (handle) => handle.handleType !== 'selection'
      //       );
      //       node.data = { ...node.data, handles: newHandles };
      //     }
      //     return node;
      //   })
      // );
      return;
    }

    setNodes((nodes) =>
      nodes.map((node) => {
        if (node.id === nodeId) {
          const newHandles = node.data.handles.filter(
            (handle) => handle.handleType !== 'selection'
          );

          // const newSelection = {
          //   start: from,
          //   end: endLine,
          // };

          newHandles.push(createSelectionHandle(node, selection));
          node.data = { ...node.data, handles: newHandles };
          // if (node.data.selections) {
          //   node.data.selections.push(newSelection);
          // } else {
          //   node.data.selections = [newSelection];
          // }
        }
        return node;
      })
    );
  };

  const onClose = (nodeId) => {
    setEdges((edges) =>
      edges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId)
    );
    setNodes((nodes) => nodes.filter((node) => node.id !== nodeId));
  };

  const onFunctionTextChanged = (functionId, content) => {
    let foundfunc;
    setFunctions((functions) =>
      functions.map((func) => {
        if (func.id === functionId) {
          func.content = content;
          foundfunc = func;
        }
        return func;
      })
    );
    setNodes((nodes) =>
      nodes.map((node) => {
        if (node.data.functionId === functionId) {
          node.data = { ...node.data, content, functionName: foundfunc.name };
        }
        return node;
      })
    );
  };

  const onfunctionTitledChanged = (functionId, title) => {
    setFunctions((functions) =>
      functions.map((func) => {
        if (func.id === functionId) {
          func.name = title;
        }
        return func;
      })
    );
    setNodes((nodes) =>
      nodes.map((node) => {
        if (node.data.functionId === functionId) {
          node.data = { ...node.data, functionName: title };
        }
        return node;
      })
    );
  };

  const onCodeNodeTextChange = (moduleId, functionId, value) => {
    setModules((modules) => {
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

    setNodes((nodes) => {
      return nodes.map((node) => {
        if (node.data.functionId === functionId && node.type === 'code') {
          console.log('found node:', node);
          node.data = { ...node.data, content: value };
        }
        return node;
      });
    });
  };

  const toggleHideChildren = (moduleId) => {
    console.log('looking for nodes with module id:', moduleId);
    setNodes((nodes) => {
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

  const toggleHideEdges = (nodeId, hideEdges) => {
    setNodes((nodes) => {
      const childIds = findChildren(nodes, nodeId);

      setEdges((edges) => {
        const newEdges = edges.map((edge) => {
          if (
            childIds.includes(edge.source) ||
            childIds.includes(edge.target)
          ) {
            return { ...edge, hidden: hideEdges };
          }
          return edge;
        });
        return newEdges;
      });
      return nodes;
    });
  };

  const onModuleClose = (moduleId) => {
    setNodes((nodes) => {
      const nonModuleNodes = nodes.filter(
        (node) => node.data.moduleId !== moduleId
      );
      return nonModuleNodes;
    });
  };

  const findModuleEdges = (moduleNodes) => {
    const edges = [];
    moduleNodes.forEach((moduleNode) => {
      // this needs updating to not add every import, just if one is found at all
      // so multiple imports to the same file arent included
      moduleNode.data.imports.forEach((imp) => {
        //console.log('import path:', imp);
        const targetModule = moduleNodes.find((node) => {
          return (
            node.data.fullPath === imp.fullPath + '.js' ||
            node.data.fullPath === imp.fullPath + '.ts' ||
            node.data.fullPath === imp.fullPath + '.tsx' ||
            node.data.fullPath === imp.fullPath + '.jsx'
          );
        });
        if (targetModule) {
          const edge = {
            id: `${moduleNode.id}-${targetModule.id}`,
            source: moduleNode.id,
            target: targetModule.id,
          };
          console.log('found edge:', edge);
          edges.push(edge);
        }
      });
    });
    return edges;
  };

  const toggleChildren = (localFlatFiles, moduleId, showChildren) => {
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
  };

  const createMissingImport = (moduleId, importPath) => {
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
    };
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
      const newNodes = getNodesForFile(fullPath, '', newPosition, moduleId);
      return nodes.concat(newNodes);
    });
  };
  const nodeTypes = useMemo(
    () => ({
      editor: (props) => (
        <EditorNode
          onTextChange={onTextChange}
          onFileNameChange={onFileNameChange}
          onSelectionChange={onSelectionChange}
          onClose={onClose}
          {...props}
        />
      ),
      text: (props) => <TextNode {...props} />,
      markdown: (props) => <MarkdownNode {...props} />,
      code: (props) => (
        <CodeNode onTextChange={onCodeNodeTextChange} {...props} />
      ),
      module: (props) => (
        <ModuleNode
          toggleHideChildren={toggleHideChildren}
          toggleHideEdges={toggleHideEdges}
          onClose={onModuleClose}
          toggleChildren={toggleChildren}
          layoutChildren={layoutNodes}
          createMissingImport={createMissingImport}
          {...props}
        />
      ),
      pureFunctionNode: (props) => (
        <PureFunctionNode
          functions={functions}
          onTextChanged={onFunctionTextChanged}
          onTitleChanged={onfunctionTitledChanged}
          {...props}
        />
      ),
      image: ImageNode,
      preview: PreviewNode,
      group: GroupNode,
      settings: (props) => (
        <SettingsNode {...props} onSettingsChanged={onSettingsChanged} />
      ),
    }),
    []
  );

  const updateEdges = (nodeId, existingHandles, newHandles) => {
    const newEdges = getNewEdges(nodeId, existingHandles, newHandles);

    setEdges((edges) => {
      const existingEdges = edges.filter(
        (edge) => edge.source !== nodeId && edge.target !== nodeId
      );
      return existingEdges.concat(newEdges);
    });
  };

  const getMaxWidth = (lines) => {
    let maxWidth = 0;
    lines.forEach((line) => {
      maxWidth = Math.max(maxWidth, line.length);
    });
    return maxWidth;
  };

  const onTextChange = async (nodeId, value) => {
    setNodes((nodes) => {
      const node = nodes.find((node) => node.id === nodeId);
      const fullPath = node.data.fullPath;
      setFlatFiles((files) => {
        const newFiles = {
          ...files,
          [fullPath]: { ...files[fullPath], fileData: value },
        };
        return newFiles;
      });
      const lines = value.split('\n');
      const newHeight = 50 + lines.length * 15;
      const newWidth = 100 + getMaxWidth(lines) * 6;
      //const newHandles = getHandles(nodeId, node.data.fullPath, value);
      const newNodes = nodes.map((node) => {
        if (node.id === nodeId) {
          node.data = {
            ...node.data,
            handles: [],
            height: newHeight,
            width: newWidth,
          };
          node.style = {
            ...node.style,
            height: `${newHeight}px`,
            width: `${newWidth}px`,
          };
        }
        return node;
      });
      updateNodeInternals(nodeId);

      return newNodes;
    });
  };
  const nodeClassName = (node) => node.type;

  const onConnectStart = useCallback((_, { nodeId, handleId }) => {
    connectingNodeId.current = nodeId;
    connectingHandleId.current = handleId;
  }, []);

  const makeSafeFilename = (input) => {
    // Extract the first 8 characters
    let base = input.slice(0, 8);

    // Define a regex pattern for characters not allowed in filenames
    const unsafeChars = /[\/\?<>\\:\*\|\"=\s]/g;

    // Replace unsafe characters with an underscore
    let safeFilename = base.replace(unsafeChars, '_');

    return safeFilename;
  };

  const handleFunctionDrag = (fromNode, fromHandle, event) => {
    const targetIsPane = event.target.classList.contains('react-flow__pane');
    const groupNodeElement = event.target.closest('.react-flow__node-group');

    const currentText = flatFiles[fromNode.data.fullPath].fileData;
    const startLine = fromHandle?.loc?.start.line || fromHandle.startLine;
    const endLine = fromHandle?.loc?.end.line || fromHandle.endLine;
    const startColumn = fromHandle.startColumn || undefined;
    const endColumn = fromHandle.endColumn || undefined;
    const { updatedText, extractedChunk } = removeTextChunk(
      currentText,
      startLine,
      endLine,
      startColumn,
      endColumn
    );

    const currentDir = path.dirname(fromHandle.nodePath);
    const newFileName =
      fromHandle.handleType === 'function'
        ? fromHandle.name
        : makeSafeFilename(extractedChunk);
    const newFullPath = path.join(currentDir, `${newFileName}.js`);

    if (targetIsPane) {
      const newNode = {
        id: (nodes.length + 1).toString(),
        data: {
          fileName: `${newFileName}.js`,
          fullPath: newFullPath,
          value: extractedChunk,
          handles: [],
        },
        type: 'editor',
        position: screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        }),
        style: {
          width: '500px',
          height: '500px',
        },
      };

      const newFile = {
        index: newFullPath,
        children: [],
        data: `${newFileName}.js`,
        fileData: extractedChunk,
        isFolder: false,
      };

      setFlatFiles((files) => {
        const newFiles = {
          ...files,
          [newFullPath]: newFile,
        };
        return newFiles;
      });
      setNodes((nodes) => nodes.concat(newNode));
    } else if (!groupNodeElement && !targetIsPane) {
      //it landed on a real node
      const editorNodeElement = event.target.closest(
        '.react-flow__node-editor'
      );
      const targetNodeId = editorNodeElement.getAttribute('data-id');
      const targetNode = nodes.find((node) => node.id === targetNodeId);
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      const line = Math.floor((position.y - targetNode.position.y) / 16);

      const newText = insertTextChunk(
        flatFiles[targetNode.data.fullPath].fileData,
        extractedChunk,
        line
      );
      onTextChange(targetNode.id, newText);
    }

    onTextChange(fromNode.id, updatedText);
  };

  const handleSelectionDrag = (fromNode, fromHandle, event) => {
    const newPos = screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });
    // create a new Partial node - can it be an editor
    setNodes((nodes) => {
      nodes.map((node) => {
        if (node.id === fromNode.id) {
          // add a new selection
          node.data.selections = node.data.selections || [];
          node.data.selections = [
            ...node.data.selections,
            {
              startLine: fromHandle.startLine,
              endLine: fromHandle.endLine,
            },
          ];
        }
        node.data = { ...node.data };
        return node;
      });
      return nodes;
    });
    updateNodeInternals(fromNode.id);
  };
  const onConnectEnd = () => {};

  const onConnect = () => {};

  const getParentIntersections = (node, intersections) => {
    // find the smallest node that the current node is inside of

    const parentNodes = intersections.filter((search) => {
      return (
        node.positionAbsolute.x > search.positionAbsolute.x &&
        node.positionAbsolute.y > search.positionAbsolute.y &&
        node.positionAbsolute.x + node.width <
          search.positionAbsolute.x + search.width &&
        node.positionAbsolute.y + node.height <
          search.positionAbsolute.y + search.height
      );
    });
    if (!parentNodes) {
      return null;
    }
    const sorted = parentNodes.sort((a, b) => {
      //calculate the area of the intersection and sort by that
      const areaA = a.width * a.height;
      const areaB = b.width * b.height;
      return areaA - areaB;
    });
    return sorted[0];
  };

  const onNodeDragStop = (event, node) => {
    setDraggingNode(null);
    // const allIntersections = getIntersectingNodes(node, true);
    // console.log('allIntersections', allIntersections);
    // const immediateParent = getParentIntersections(node, allIntersections);

    // if (immediateParent && immediateParent.id !== node.parentId) {
    //   if (node.parentId === immediateParent.id) {
    //     return;
    //   }
    //   console.log('new node landed on function');
    //   setNodes((nodes) => {
    //     const newNodes = nodes
    //       .map((search) => {
    //         if (search.id === node.id) {
    //           search.parentId = immediateParent.id;
    //           search.position.x =
    //             node.positionAbsolute.x - immediateParent.positionAbsolute.x;
    //           search.position.y =
    //             node.positionAbsolute.y - immediateParent.positionAbsolute.y;
    //         }

    //         return search;
    //       })
    //       // sort nodes by if they have a parentId or not
    //       .sort((a, b) => {
    //         if (a.parentId && !b.parentId) {
    //           return 1;
    //         }
    //         if (!a.parentId && b.parentId) {
    //           return -1;
    //         }
    //         return 0;
    //       });

    //     return newNodes;
    //   });

    //   // its still inside its parent group
    // } else if (!immediateParent && node.parentId) {
    //   console.log('moved out of group');
    //   const oldGroupNode = nodes.find(
    //     (searchNode) => searchNode.id === node.parentId
    //   );

    //   setNodes((nodes) => {
    //     const newNodes = nodes.map((search) => {
    //       if (search.id === node.id) {
    //         search.parentId = null;
    //         search.position.x = node.position.x + oldGroupNode.position.x;
    //         search.position.y = node.position.y + oldGroupNode.position.y;
    //       }
    //       return search;
    //     });
    //     return newNodes;
    //   });
    // } else {
    //   console.log('moved on canvas');
    // }
  };

  const onFolderSelected = (folder) => {
    loadFileSystem(folder);
  };

  const onFileSelected = useCallback(
    async (event) => {
      if (event.shiftKey) {
        console.log('Shift key is held down!');
      } else {
        console.log('Shift key is not held.');
      }
      const fullPath = event.target.getAttribute('data-rct-item-id');
      const fileName = event.target.textContent;
      const relativePath = path.relative(rootPath, fullPath);
      const parsedPaths = relativePath.split(path.sep);
      const fileInfo = flatFiles[fullPath];

      const fileContents = fileInfo.fileData;
      const newPos = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNodes = getNodesForFile(fullPath, fileContents, newPos, null);
      console.log('newNodes', newNodes);
      setNodes((nodes) => nodes.concat(newNodes));
    },
    [screenToFlowPosition, rootPath, flatFiles]
  );

  const onFileSelectedSearchBar = (fullPath) => {
    const fileName = flatFiles[fullPath].data;
    const relativePath = path.relative(rootPath, fullPath);
    const parsedPaths = relativePath.split(path.sep);
    const fileInfo = flatFiles[fullPath];
    const fileContents = fileInfo.fileData;

    setNodes((nodes) => {
      let parentId = null;

      const nextNodeId = getNewNodeId();

      const isImage = /\.(gif|jpe?g|tiff?|png|webp|bmp)$/i.test(fileName);

      const newNode = {
        id: nextNodeId,
        data: {
          fullPath,
          fileName,
          handles: [],
        },
        type: isImage ? 'image' : 'editor',
        position: {
          x: 500,
          y: 500,
        },
        style: {
          width: '500px',
          height: '500px',
        },
        parentId,
      };

      const children = []; //createChildren(flatFiles, newNode);

      const newNodes = nodes.concat(newNode).concat(children);
      return newNodes;
    });
  };

  const createFunction = () => {
    const newFunction = {
      name: 'testfunchere',
      id: uuidv4(),
      content: 'meep()',
    };
    setFunctions((functions) => {
      return functions.concat(newFunction);
    });
    const newNode = {
      id: (nodes.length + 1).toString(),
      data: {
        functionId: newFunction.id,
        content: newFunction.content,
        functionName: newFunction.name,
      },
      type: 'pureFunctionNode',
      position: {
        x: 500,
        y: 500,
      },
      style: {
        width: '400px',
        height: '300px',
      },
    };
    setNodes((nodes) => {
      return nodes.concat(newNode);
    });
  };
  const createCodeNode = () => {
    const newNode = {
      id: (nodes.length + 1).toString(),
      data: {},
      type: 'code',
      position: {
        x: 200,
        y: 500,
      },
      style: {
        width: '200px',
        height: '200px',
      },
    };
    setNodes((nodes) => {
      return nodes.concat(newNode);
    });
  };

  const onNodeDragStart = (event, node) => {
    setDraggingNode(node);
  };

  const onSearchSelect = (selected) => {
    const newId = (nodes.length + 1).toString();
    const newNode = {
      id: newId,
      data: {
        functionId: selected.id,
        content: selected.content,
        functionName: 'TestFunction' + newId,
      },
      type: 'pureFunctionNode',
      position: {
        x: 500,
        y: 500,
      },
      style: {
        width: '400px',
        height: '300px',
      },
    };
    setNodes((nodes) => {
      return nodes.concat(newNode);
    });
  };

  const updateParentSize = (nodes, node) => {
    const parent = nodes.find((search) => search.id === node.parentId);
    const nx = node.positionAbsolute.x;
    const ny = node.positionAbsolute.y;
    const nw = node.width;
    const nh = node.height;

    const px = parent?.positionAbsolute?.x || parent?.position?.x || 0;
    const py = parent?.positionAbsolute?.y || parent?.position?.y || 0;
    const pw = parent.width;
    const ph = parent.height;

    if (nx < px + 50) {
      const diff = px + 50 - nx;
      parent.position.x = px - diff;
      parent.width = pw + diff;
      parent.style.width = `${pw + diff}px`;
    }

    if (ny < py + 50) {
      const diff = py + 50 - ny;
      parent.position.y = py - diff;
      parent.height = ph + diff;
      parent.style.height = `${ph + diff}px`;
    }

    if (nx + nw > px + pw - 50) {
      const diff = nx + nw - (px + pw - 50);
      parent.width = pw + diff;
      parent.style.width = `${pw + diff}px`;
    }

    if (ny + nh > py + ph - 50) {
      const diff = ny + nh - (py + ph - 50);
      parent.height = ph + diff;
      parent.style.height = `${ph + diff}px`;
    }

    if (parent.parentId) {
      updateParentSize(nodes, parent);
    }
  };

  const onNodeDrag = (event, node) => {
    // if (!node.parentId) {
    //   return;
    // }
    // setNodes((nodes) => {
    //   const newNodes = [...nodes];
    //   updateParentSize(newNodes, node);
    //   return newNodes;
    // });
  };

  const layoutNodes = (parentId) => {
    console.log('layout nodes ', parentId);
    setNodes((nodes) => {
      // need to get all the current modules
      // find their width and height
      // find their edges
      // pass to dagre
      //
      const dagreGraph = new dagre.graphlib.Graph().setDefaultEdgeLabel(
        () => ({})
      );
      dagreGraph.setGraph({ rankdir: 'LR' });
      const moduleNodes = nodes.filter((node) => node.type === 'module');
      const edges = findModuleEdges(moduleNodes);

      moduleNodes.forEach((moduleNode) => {
        if (parentId && moduleNode.id === parentId) {
          console.log('parent node y:', moduleNode.position.y);
          dagreGraph.setNode(moduleNode.id, {
            width: moduleNode.data.width + 40,
            height: moduleNode.data.height,
            x: moduleNode.position.x,
            y: moduleNode.position.y,
            fixed: true,
          });
          return;
        }

        dagreGraph.setNode(moduleNode.id, {
          width: moduleNode.data.width + 40,
          height: moduleNode.data.height,
        });
      });

      edges.forEach((edge) => {
        console.log('adding edge', edge);
        dagreGraph.setEdge(edge.source, edge.target);
      });
      dagre.layout(dagreGraph);

      const graphState = {
        graph: dagreGraph.graph(), // Global graph attributes
        nodes: dagreGraph.nodes().map((nodeId) => ({
          id: nodeId,
          data: dagreGraph.node(nodeId), // Node attributes like position, size
        })),
        edges: dagreGraph.edges().map((edgeObj) => ({
          source: edgeObj.v,
          target: edgeObj.w,
          data: dagreGraph.edge(edgeObj), // Edge attributes like weight, label
        })),
      };

      // Log the entire state for debugging
      console.log(JSON.stringify(graphState, null, 2));

      return nodes.map((node) => {
        const layout = dagreGraph.node(node.id);
        if (layout) {
          const newNode = {
            ...node,
            position: {
              x: layout.x - layout.width / 2,
              y: layout.y - layout.height / 2,
            },
          };
          return newNode;
        }
        return node;
      });
    });
  };

  return (
    <>
      <ReactFlow
        nodeTypes={nodeTypes}
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        defaultViewport={defaultViewport}
        minZoom={0.2}
        maxZoom={4}
        attributionPosition="bottom-left"
        onConnectEnd={onConnectEnd}
        onConnectStart={onConnectStart}
        onConnect={onConnect}
        connectionMode="loose"
        onNodeDragStop={onNodeDragStop}
        onNodeDragStart={onNodeDragStart}
        onNodeDrag={onNodeDrag}
      >
        <Background
          style={{
            background: layers[currentLayer].color,
          }}
        />

        <Panel position="top-left">
          <FolderSelectButton onFolderSelected={onFolderSelected} />
          <Button variant="contained" color="primary" onClick={createFunction}>
            New function
          </Button>
          {/* <Button variant="contained" color="primary" onClick={layoutNodes}>
            LayoutNodes
          </Button> */}

          <BasicTree flatFiles={flatFiles} onFileSelected={onFileSelected} />
        </Panel>
        <Panel position="top-right">
          <LayerManager />
        </Panel>
        <Panel position="top">
          <SnackbarProvider
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'center',
            }}
          />
          <SearchBar
            searchContent={functions}
            onSearchSelect={onSearchSelect}
          />
          <Tooltip
            id="saved-tooltip"
            place="bottom"
            content="Hello world! I'm a Tooltip"
          />
        </Panel>
        <MiniMap zoomable pannable nodeClassName={nodeClassName} />
        <Controls />
      </ReactFlow>
    </>
  );
};
