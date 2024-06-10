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
  Position,
  Background,
  useReactFlow,
  useUpdateNodeInternals,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { EditorNode } from './EditorNode';
import { PreviewNode } from './PreviewNode';
import './updatenode.css';

import { getExports, getImports } from './editorUtils';

const initialEdges = [];
const defaultViewport = { x: 0, y: 0, zoom: 1.5 };

const tempInput = `
import React from 'react';
export const myfunction = () => {
  return 'hello world';
}

export const myfunction2 = () => {
  return 'hello world';
}

`;

export const Flow = () => {
  const initialNodes = [
    {
      id: '1',
      data: {
        fileName: 'MyComponent.js',
        value: tempInput,
        handles: [],
      },
      type: 'editor',
      position: { x: 100, y: 100 },
    },
    // {
    //   id: '1',
    //   data: { id: '1', label: '-', value: 'test string' },
    //   type: 'preview',
    //   position: { x: 100, y: 100 },
    // },
  ];
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const updateNodeInternals = useUpdateNodeInternals();
  const connectingNodeId = useRef(null);
  const connectingHandleId = useRef(null);
  const { screenToFlowPosition } = useReactFlow();

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

  const nodeTypes = useMemo(
    () => ({
      editor: (props) => (
        <EditorNode
          onTextChange={onTextChange}
          onFileNameChange={onFileNameChange}
          {...props}
        />
      ),
      preview: PreviewNode,
    }),
    []
  );

  function onTextChange(nodeId, value) {
    const exports = getExports(value);
    const imports = getImports(value);
    //console.log('exports', exports);
    const handles = exports.map((exp) => ({
      id: 'export-' + exp.name,
      name: exp.name,
      type: 'source',
      position: Position.Left,
      style: {
        left: -5,
        top: -5 + 16 * exp.line,
      },
    }));

    const importHandles = imports.map((imp) => ({
      id: 'import-' + imp.name,
      name: imp.name,
      type: 'source',
      position: Position.Right,
      style: {
        left: 410,
        top: -5 + 16 * imp.line,
      },
    }));

    //onChangeHandles(id, handles.concat(importHandles));

    setNodes((nodes) =>
      nodes.map((node) => {
        if (node.id === nodeId) {
          node.data = {
            ...node.data,
            value,
            handles: handles.concat(importHandles),
          };
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
    console.log('===== handleId', handleId);
    connectingNodeId.current = nodeId;
    connectingHandleId.current = handleId;
  }, []);
  const onConnectEnd = useCallback(
    (event) => {
      const targetIsPane = event.target.classList.contains('react-flow__pane');

      if (targetIsPane) {
        console.log('=== target is pane');
        // we need to remove the wrapper bounds, in order to get the correct position
        const fromNode = nodes.find(
          (node) => node.id === connectingNodeId.current
        );
        const fileName = fromNode.data.fileName;
        const fromHandle = fromNode.data.handles.find(
          (handle) => handle.id === connectingHandleId.current
        );
        const content = `import ${fromHandle.name} from '${fileName}';`;

        const id = (nodes.length + 1).toString();

        const newHandleId = 'import-' + fromHandle.name;

        const handles = [
          {
            id: newHandleId,
            name: fromHandle.name,
            type: 'source',
            position: Position.Right,
            style: {
              left: 430,
              top: -5 + 16 * 1,
            },
          },
        ];
        const newNode = {
          id,
          position: screenToFlowPosition({
            x: event.clientX,
            y: event.clientY,
          }),

          data: { fileName: `newFile-${id}.js`, value: content, handles },
          type: 'editor',
          origin: [0.5, 0.0],
        };

        setNodes((nds) => nds.concat(newNode));
        const newEdge = {
          id: 'edge' + id,
          source: connectingNodeId.current,
          target: id,
          sourceHandle: connectingHandleId.current,
          targetHandle: newHandleId,
        };
        setEdges((eds) => eds.concat(newEdge));
      }
    },
    [screenToFlowPosition, nodes, edges]
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
        connectionMode="loose"
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
