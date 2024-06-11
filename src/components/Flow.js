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
import { GroupNode } from './GroupNode';
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

let edgeIdCount = 0;
const getEdgeId = () => `${edgeIdCount++}`;

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
      position: { x: 500, y: 100 },
    },
    {
      id: '2',
      data: {
        fileName: 'MyGroup',
        value: '',
        handles: [],
      },
      type: 'group',
      position: { x: 200, y: 100 },
    },
  ];
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

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
      group: GroupNode,
    }),
    []
  );

  const updateEdges = (nodeId, handles) => {
    //TODO: if imported from a package, create a virtual node, or dont create the edge?
    const newEdges = [];
    handles.forEach((handle) => {
      if (!handle.jsType === 'import') {
        return;
      }
      const targetNode = nodes.find(
        (node) => node.data.fileName === handle.fileName
      );
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
    setEdges((eds) => eds.concat(newEdges));
  };

  const getHandles = (value) => {
    //TODO: skip if imports and exports havent changed
    const exports = getExports(value);
    const imports = getImports(value);
    const handles = exports.map((exp) => ({
      id: 'export-' + exp.name,
      name: exp.name,
      type: 'source',
      jsType: 'export',
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
      jsType: 'import',
      fileName: imp.fileName,
      position: Position.Right,
      style: {
        left: 410,
        top: -5 + 16 * imp.line,
      },
    }));
    return handles.concat(importHandles);
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
  const onConnectEnd = useCallback(
    (event) => {
      const targetIsPane = event.target.classList.contains('react-flow__pane');

      if (targetIsPane) {
        // we need to remove the wrapper bounds, in order to get the correct position
        const fromNode = nodes.find(
          (node) => node.id === connectingNodeId.current
        );
        const fileName = fromNode.data.fileName;
        const fromHandle = fromNode.data.handles.find(
          (handle) => handle.id === connectingHandleId.current
        );
        const content = `import { ${fromHandle.name} } from '${fileName}';`;

        const id = (nodes.length + 1).toString();

        const newHandleId = 'import-' + fromHandle.name;

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
        };

        setNodes((nds) => nds.concat(newNode));
      }
    },
    [screenToFlowPosition, nodes, edges]
  );

  const onConnect = (connection) => {};

  const onNodeDragStop = (event, node, nodes) => {
    console.log('drag stop event', node);
    const intersections = getIntersectingNodes(node, false);
    console.log('intersections', intersections);
    const groupNode = intersections.find((n) => n.type === 'group');
    console.log('group node', groupNode);
    if (groupNode && node.parentId !== groupNode.id) {
      console.log('setting nodes');
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
        console.log('new nodes', newNodes);

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
