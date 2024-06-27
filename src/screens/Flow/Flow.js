import React, {
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
  useContext,
} from 'react';
import ReactFlow, {
  useNodesState,
  useEdgesState,
  MiniMap,
  Panel,
  Controls,
  Background,
  useReactFlow,
  useUpdateNodeInternals,
  applyEdgeChanges,
  applyNodeChanges,
} from 'reactflow';

import 'reactflow/dist/style.css';
import { EditorNode } from '../../components/nodes/EditorNode';
import { PreviewNode } from '../../components/nodes/PreviewNode';
import { GroupNode } from '../../components/nodes/GroupNode';
import { SettingsNode } from '../../components/nodes/SettingsNode/SettingsNode';

import FolderSelectButton from '../../components/FolderSelectButton';
import { BasicTree } from '../../components/FolderTree';
import './updatenode.css';
import path from 'path-browserify';

import { useLayer } from './useLayer';

import { loadFolderTree, loadFile } from '../../electronHelpers';

import { LayerManager } from '../../components/LayerManager';

import {
  getHandles,
  removeTextChunk,
  insertTextChunk,
} from '../../components/editorUtils';

import {
  createSelectionHandle,
  getNewEdges,
  getNewNodeId,
  stringToDarkTransparentColor,
  createChildren,
} from './utils';
import { initialSettingsState } from './mocks';
import { useFileSystem } from '../../contexts/FileSystemContext';

const defaultViewport = { x: 0, y: 0, zoom: 1.5 };

export const Flow = () => {
  const { setLayer, layers, setNodes, setEdges, nodes, edges, currentLayer } =
    useLayer();

  const [settings, setSettings] = useState(initialSettingsState);
  const [handles, setHandles] = useState([]);
  const updateNodeInternals = useUpdateNodeInternals();

  const { flatFiles, rootPath, loadFileSystem, setFlatFiles } = useFileSystem();

  useEffect(() => {
    loadFileSystem('/home/chris/marvel-app');
  }, []);

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

  const onFileNameChange = (nodeId, fileName) => {
    setNodes((nodes) =>
      nodes.map((node) => {
        if (node.id === nodeId) {
          node.data = { ...node.data, fileName };
        }
        return node;
      })
    );
  };

  const onSettingsChanged = (newSettings) => {
    setSettings(newSettings);
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
      setNodes((nodes) =>
        nodes.map((node) => {
          if (node.id === nodeId) {
            const newHandles = node.data.handles.filter(
              (handle) => handle.handleType !== 'selection'
            );
            node.data = { ...node.data, handles: newHandles };
          }
          return node;
        })
      );
      return;
    }

    setNodes((nodes) =>
      nodes.map((node) => {
        if (node.id === nodeId) {
          const newHandles = node.data.handles.filter(
            (handle) => handle.handleType !== 'selection'
          );
          newHandles.push(createSelectionHandle(nodeId, selection));
          node.data = { ...node.data, handles: newHandles };
        }
        return node;
      })
    );
  };

  const onClose = (nodeId) => {
    console.log('closing node', nodeId);
    setEdges((edges) =>
      edges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId)
    );
    setNodes((nodes) => nodes.filter((node) => node.id !== nodeId));
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

  const onTextChange = (nodeId, value) => {
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
      const newHandles = getHandles(nodeId, node.data.fullPath, value);
      const newNodes = nodes.map((node) => {
        if (node.id === nodeId) {
          node.data = {
            ...node.data,
            handles: newHandles,
          };
        }
        return node;
      });
      updateNodeInternals(nodeId);
      setHandles((handles) => {
        const existingHandles = handles.filter(
          (handle) => handle.nodeId !== nodeId
        );
        const mergedHandles = existingHandles.concat(newHandles);
        updateEdges(nodeId, existingHandles, newHandles);
        return mergedHandles;
      });
      return newNodes;
    });
  };
  const nodeClassName = (node) => node.type;

  const onConnectStart = useCallback((_, { nodeId, handleId }) => {
    connectingNodeId.current = nodeId;
    connectingHandleId.current = handleId;
  }, []);

  const handleSelectionDrag = (fromNode, fromHandle, event) => {};

  const handleFunctionDrag = (fromNode, fromHandle, event) => {
    const targetIsPane = event.target.classList.contains('react-flow__pane');
    const groupNodeElement = event.target.closest('.react-flow__node-group');

    const currentText = fromNode.data.value;
    const startLine = fromHandle.loc.start.line;
    const endLine = fromHandle.loc.end.line;
    const { updatedText, extractedChunk } = removeTextChunk(
      currentText,
      startLine,
      endLine
    );

    if (targetIsPane) {
      const newNode = {
        id: (nodes.length + 1).toString(),
        data: {
          fileName: `./${fromHandle.name}.js`,
          value: 'export ' + extractedChunk,
          handles: [],
        },
        type: 'editor',
        position: screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        }),
      };
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
        targetNode.data.value,
        extractedChunk,
        line
      );
      onTextChange(targetNode.id, newText);
    }

    onTextChange(fromNode.id, updatedText);
  };
  const onConnectEnd = useCallback(
    (event) => {
      const targetIsPane = event.target.classList.contains('react-flow__pane');
      const groupNodeElement = event.target.closest('.react-flow__node-group');

      let parentId = null;
      if (groupNodeElement) {
        parentId = groupNodeElement.getAttribute('data-id');
      }
      const fromNode = nodes.find(
        (node) => node.id === connectingNodeId.current
      );
      const fromHandle = fromNode?.data?.handles.find(
        (handle) => handle.id === connectingHandleId.current
      );
      if (fromHandle?.handleType === 'function') {
        return handleFunctionDrag(fromNode, fromHandle, event);
      }
      if (fromHandle?.handleType === 'selection') {
        return handleSelectionDrag(fromNode, fromHandle, event);
      }
      if (!targetIsPane && !groupNodeElement) {
        return;
      }

      const fileName = fromNode.data.fileName;

      const content = `import { ${fromHandle.name} } from '${fileName}';`;

      const id = (nodes.length + 1).toString();

      const handles = [];
      const newNode = {
        id,
        position: screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        }),

        data: { fileName: `newFile-${id}.js`, value: content, handles },
        type: 'editor',
        origin: [0.5, 0.0],
        parentId: parentId || fromNode.parentId,
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [screenToFlowPosition, nodes, edges]
  );

  const onConnect = (connection) => {};

  const onNodeDragStop = (event, node) => {
    const intersections = getIntersectingNodes(node, true);
    const groupNode = intersections.find((n) => n.type === 'group');

    //if it landed on a group it isnt a child of
    if (groupNode && node.parentId !== groupNode.id) {
      console.log('new node landed on group');
      setNodes((nodes) => {
        const newNodes = nodes
          .map((search) => {
            if (search.id === node.id) {
              search.parentId = groupNode.id;
              search.position.x = node.position.x - groupNode.position.x;
              search.position.y = node.position.y - groupNode.position.y;
            }
            return search;
          })
          // sort nodes by if they have a parentId or not
          .sort((a, b) => {
            if (a.parentId && !b.parentId) {
              return 1;
            }
            if (!a.parentId && b.parentId) {
              return -1;
            }
            return 0;
          });

        return newNodes;
      });

      // its still inside its parent group
    } else if (groupNode && node.parentId === groupNode.id) {
      const groupRight = parseInt(groupNode.style.width, 10);
      const nodeRight = node.position.x + parseInt(node.style.width, 10);
      if (nodeRight > groupRight) {
        setNodes((nodes) => {
          const newNodes = nodes.map((search) => {
            if (search.id === groupNode.id) {
              return {
                ...search,
                style: {
                  ...search.style,
                  width: nodeRight + 100,
                },
              };
            } else {
              return search;
            }
          });
          return newNodes;
        });
        updateNodeInternals(groupNode.id);
      }
    } else if (!groupNode && node.parentId) {
      console.log('moved out of group');
      const oldGroupNode = nodes.find(
        (searchNode) => searchNode.id === node.parentId
      );

      setNodes((nodes) => {
        const newNodes = nodes.map((search) => {
          if (search.id === node.id) {
            search.parentId = null;
            search.position.x = node.position.x + oldGroupNode.position.x;
            search.position.y = node.position.y + oldGroupNode.position.y;
          }
          return search;
        });
        return newNodes;
      });
    } else {
      console.log('shouldnt get here');
    }
  };

  const onFolderSelected = (folder) => {
    loadFileSystem(folder);
  };

  const onFileSelected = useCallback(
    async (event) => {
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

      console.log('clientxy', event.clientX, event.clientY);
      console.log('newpos', newPos);

      setNodes((nodes) => {
        console.log('parsedPaths', parsedPaths);
        const existingGroup = nodes.find(
          (node) =>
            node.type === 'group' &&
            node.data.folder === parsedPaths[0] &&
            !node.parentId
        );
        let parentId = null;
        const lines = fileContents.split('\n');
        const editorHeight = 300;
        // if (!existingGroup) {
        //   // create a new group node
        //   // recursively create group nodes for each folder in the path
        //   // create a new editor node for the file
        //   const newColor = stringToDarkTransparentColor(relativePath);
        //   const newGroupNode = {
        //     id: getNewNodeId(),
        //     data: {
        //       folder: parsedPaths[0],
        //       label: parsedPaths[0],
        //     },
        //     type: 'group',
        //     position: newPos,
        //     style: {
        //       background: newColor,
        //       width: '600px',
        //       height: `${editorHeight + 50}px`,
        //     },
        //   };
        //   nodes = nodes.concat(newGroupNode);
        //   parentId = newGroupNode.id;
        // }

        const nextNodeId = getNewNodeId();

        const newNode = {
          id: nextNodeId,
          data: {
            fullPath,
            fileName,
            value: fileContents,
            handles: [],
          },
          type: 'editor',
          position: {
            x: parentId ? 10 : newPos.x,
            y: parentId ? 10 : newPos.y,
          },
          style: {
            width: '500px',
            height: `${editorHeight}px`,
          },
          parentId,
        };

        const children = createChildren(flatFiles, newNode);

        const newNodes = nodes.concat(newNode).concat(children);
        console.log('newNodes', newNodes);
        return newNodes;
      });
    },
    [screenToFlowPosition, rootPath, flatFiles]
  );

  return (
    <>
      <ReactFlow
        nodeTypes={nodeTypes}
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        defaultViewport={defaultViewport}
        minZoom={0.2}
        maxZoom={4}
        attributionPosition="bottom-left"
        onConnectEnd={onConnectEnd}
        onConnectStart={onConnectStart}
        onConnect={onConnect}
        connectionMode="loose"
        onNodeDragStop={onNodeDragStop}
      >
        <Background
          style={{
            background: layers[currentLayer].color,
          }}
        />
        <Panel position="top-left">
          <div>Current Layer: {currentLayer}</div>
          <FolderSelectButton onFolderSelected={onFolderSelected} />
          <BasicTree flatFiles={flatFiles} onFileSelected={onFileSelected} />
        </Panel>
        <Panel position="top-right">
          <LayerManager />
        </Panel>
        <MiniMap zoomable pannable nodeClassName={nodeClassName} />
        <Controls />
      </ReactFlow>
    </>
  );
};
