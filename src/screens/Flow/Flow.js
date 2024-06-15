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
import { EditorNode } from '../../components/nodes/EditorNode';
import { PreviewNode } from '../../components/nodes/PreviewNode';
import { GroupNode } from '../../components/nodes/GroupNode';
import { SettingsNode } from '../../components/nodes/SettingsNode/SettingsNode';
import './updatenode.css';
import { initialSettingsState, tempInput } from './mocks';

import { getExports, getImports } from '../../components/editorUtils';

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
    console.log('new edges', newEdges);
    setEdges(newEdges);
  };

  const getImportColor = (fileName) => {
    const isLocal =
      fileName.startsWith('./') ||
      fileName.startsWith('../') ||
      fileName.startsWith('/');
    if (isLocal) {
      for (const node of nodes) {
        if (fileName.includes(node.data.fileName)) {
          return '#03ad1a';
        }
      }
      return '#b30f00';
    }
    if (settings.packageJson.dependencies[fileName]) {
      return '#4287f5';
    }
    return '#b30f00';
  };

  const getHandles = (value) => {
    //TODO: skip if imports and exports havent changed
    const exports = getExports(value);
    const imports = getImports(value);
    const handles = exports.map((exp) => ({
      id: 'export-' + exp.name,
      name: exp.name,
      type: 'source',
      handleType: 'export',
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
      handleType: 'import',
      fileName: imp.fileName,
      position: Position.Right,
      style: {
        left: 410,
        top: -5 + 16 * imp.line,
        background: getImportColor(imp.fileName),
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
      const groupNodeElement = event.target.closest('.react-flow__node-group');

      let parentId = null;
      if (groupNodeElement) {
        parentId = groupNodeElement.getAttribute('data-id'); // Adjust this selector based on your actual implementation
      }
      if (!targetIsPane && !groupNodeElement) {
        return;
      }

      const fromNode = nodes.find(
        (node) => node.id === connectingNodeId.current
      );
      const fileName = fromNode.data.fileName;
      const fromHandle = fromNode.data.handles.find(
        (handle) => handle.id === connectingHandleId.current
      );
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
      console.log(nodes);
      console.log(node.parentId, oldGroupNode);
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
