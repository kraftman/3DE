import React, {
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
} from 'react';
import ReactFlow, {
  useNodesState,
  useEdgesState,
  MiniMap,
  Controls,
  Background,
  useReactFlow,
  useUpdateNodeInternals,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { EditorNode } from '../../components/nodes/EditorNode';
import { PreviewNode } from '../../components/nodes/PreviewNode';
import { GroupNode } from '../../components/nodes/GroupNode';
import { SettingsNode } from '../../components/nodes/SettingsNode/SettingsNode';
import './updatenode.css';
import { initialSettingsState, tempInput } from './mocks';

import {
  getHandles,
  removeTextChunk,
  insertTextChunk,
} from '../../components/editorUtils';

const initialEdges = [];
const defaultViewport = { x: 0, y: 0, zoom: 1.5 };

let edgeIdCount = 0;
const getEdgeId = () => `${edgeIdCount++}`;

export const Flow = () => {
  const initialNodes = [
    {
      id: '1',
      data: {
        fileName: './MyComponent.js',
        value: tempInput,
        handles: [],
      },
      type: 'editor',
      position: { x: 500, y: 100 },
    },
    {
      id: '2',
      data: {
        fileName: 'Settings.js',
        value: '',
        handles: [],
        settings: initialSettingsState,
      },
      type: 'group',
      position: { x: 200, y: 100 },
    },
    // {
    //   id: '2',
    //   data: {
    //     fileName: 'Settings.js',
    //     value: '',
    //     handles: [],
    //     settings: initialSettingsState,
    //   },
    //   type: 'settings',
    //   position: { x: 200, y: 100 },
    // },
  ];
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [settings, setSettings] = useState(initialSettingsState);

  const updateNodeInternals = useUpdateNodeInternals();
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
    console.log('selection changed', selection);
    // create selection handle
    const startLine = selection.startLineNumber;
    const endLine = selection.endLineNumber;
  };

  const nodeTypes = useMemo(
    () => ({
      editor: (props) => (
        <EditorNode
          onTextChange={onTextChange}
          onFileNameChange={onFileNameChange}
          onSelectionChange={onSelectionChange}
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

  const updateEdges = (nodeId, handles) => {
    //TODO: if imported from a package, create a virtual node, or dont create the edge?
    const newEdges = [];
    handles.forEach((handle) => {
      if (!handle.handleType === 'import') {
        return;
      }
      const targetNode = nodes.find(
        (node) => node.data.fileName === handle.fileName
      );
      console.log('target node', targetNode);
      if (targetNode) {
        const newEdge = {
          id: getEdgeId(),
          source: nodeId,
          target: targetNode.id,
          sourceHandle: 'import-' + handle.name,
          targetHandle: 'export-' + handle.name,
        };
        newEdges.push(newEdge);
      }
    });
    setEdges(newEdges);
  };

  function onTextChange(nodeId, value) {
    const newHandles = getHandles(value);
    updateEdges(nodeId, newHandles);

    setNodes((nodes) =>
      nodes.map((node) => {
        if (node.id === nodeId) {
          node.data = {
            ...node.data,
            value,
          };
          if (newHandles.length > 0) {
            node.data.handles = newHandles;
          }
        }

        return node;
      })
    );
    updateNodeInternals(nodeId);
  }
  const nodeClassName = (node) => node.type;

  const createNode = () => {
    const newNode = {
      id: (nodes.length + 1).toString(),
      data: {
        label: 'Node ' + (nodes.length + 1),
        value: 'test string',
        handles: [],
      },
      type: 'editor',
      position: {
        x: Math.random() * window.innerWidth - 200,
        y: Math.random() * window.innerHeight - 400,
      },
    };

    setNodes((nodes) => nodes.concat(newNode));
  };

  const onConnectStart = useCallback((_, { nodeId, handleId }) => {
    connectingNodeId.current = nodeId;
    connectingHandleId.current = handleId;
  }, []);

  const handleFunctionDrag = (fromNode, fromHandle, event) => {
    //TODO:
    // create the new node with the removed text
    // update it to be exported
    // add an import to the existing node
    // if the function was exported, update the reference to the new node

    const targetIsPane = event.target.classList.contains('react-flow__pane');
    const groupNodeElement = event.target.closest('.react-flow__node-group');
    console.log('targetIsPane', targetIsPane);
    console.log('groupNodeElement', groupNodeElement);

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
      console.log('landed on real node');
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
      console.log('mouse position', position);
      console.log('node position', targetNode.position);
      const line = Math.floor((position.y - targetNode.position.y) / 16);
      console.log('inserting text at line', line);

      const newText = insertTextChunk(
        targetNode.data.value,
        extractedChunk,
        line
      );
      console.log('new text', newText);
      onTextChange(targetNode.id, newText);
    }

    onTextChange(fromNode.id, updatedText);
    // setNodes((nodes) => {
    //   return nodes.map((node) => {
    //     if (node.id === fromNode.id) {
    //       node.data.value = newCode;
    //     }
    //     return node;
    //   });
    // });
    // updateNodeInternals(fromNode.id)
  };
  const onConnectEnd = useCallback(
    (event) => {
      const targetIsPane = event.target.classList.contains('react-flow__pane');
      const groupNodeElement = event.target.closest('.react-flow__node-group');

      let parentId = null;
      if (groupNodeElement) {
        parentId = groupNodeElement.getAttribute('data-id'); // Adjust this selector based on your actual implementation
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
    const intersections = getIntersectingNodes(node, false);
    const groupNode = intersections.find((n) => n.type === 'group');
    if (groupNode && node.parentId !== groupNode.id) {
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
    } else if (!groupNode && node.parentId) {
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
    }
  };

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
        <div className="updatenode__controls">
          <button onClick={createNode}> ➕ Add Node</button>
        </div>
        <MiniMap zoomable pannable nodeClassName={nodeClassName} />
        <Controls />
        <Background />
      </ReactFlow>
    </>
  );
};
