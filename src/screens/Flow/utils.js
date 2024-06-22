import { initialSettingsState, tempInput } from './mocks';

import ReactFlow, {
  useNodesState,
  useEdgesState,
  MiniMap,
  Position,
  Controls,
  Background,
  useReactFlow,
  useUpdateNodeInternals,
} from 'reactflow';

export const createEditorNode = (nodeId) => {
  const newNode = {
    id: nodeId,
    data: {
      fileName: 'component.js',
      value: 'test string',
      handles: [],
    },
    type: 'editor',
    position: {
      x: Math.random() * window.innerWidth - 200,
      y: Math.random() * window.innerHeight - 400,
    },
  };
  return newNode;
};

let edgeIdCount = 0;
const getEdgeId = () => `${edgeIdCount++}`;

export const getNewEdges = (nodeId, existingHandles, newHandles) => {
  const exports = newHandles.filter((handle) => handle.handleType === 'export');
  const imports = newHandles.filter((handle) => handle.handleType === 'import');

  const newEdges = [];
  exports.forEach((exportHandle) => {
    existingHandles.forEach((existingHandle) => {
      const isMatching =
        existingHandle.handleType === 'import' &&
        existingHandle.name === exportHandle.name &&
        existingHandle.fileName === exportHandle.exportFileName;

      if (isMatching) {
        newEdges.push({
          id: getEdgeId(),
          source: existingHandle.nodeId,
          target: nodeId,
          targetHandle: exportHandle.id,
          sourceHandle: existingHandle.id,
        });
      }
    });
  });
  imports.forEach((importHandle) => {
    existingHandles.forEach((existingHandle) => {
      const isMatching =
        existingHandle.handleType === 'export' &&
        existingHandle.name === importHandle.name;
      existingHandle.exportFileName === importHandle.fileName;
      if (isMatching) {
        newEdges.push({
          id: getEdgeId(),
          source: nodeId,
          sourceHandle: importHandle.id,
          target: existingHandle.nodeId,
          targetHandle: existingHandle.id,
        });
      }
    });
  });
  return newEdges;
};

export const getInitialNodes = (initialSettingsState) => [
  {
    id: '1',
    data: {
      fileName: './MyComponent.js',
      value: tempInput,
      handles: [],
    },
    type: 'editor',
    position: { x: 800, y: 100 },
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
  {
    id: '3',
    data: {
      fileName: './MyComponent2.js',
      value: `import { myfunction } from './MyComponent.js';`,
      handles: [],
    },
    type: 'editor',
    position: { x: 100, y: 300 },
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

export const createSelectionHandle = (nodeId, selection) => {
  const startLine = selection.startLineNumber;
  const endLine = selection.endLineNumber;

  const handle = {
    id: `selection-${startLine}-${endLine}`,
    name: 'selection',
    handleType: 'selection',
    type: 'source',
    position: Position.Right,
    startLine,
    endLine,
    style: {
      left: 40 + selection.endColumn * 7,
      top: 16 * endLine,
      zIndex: 1000,
    },
  };

  return handle;
};
