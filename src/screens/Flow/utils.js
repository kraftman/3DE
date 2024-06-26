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

let nodeIdCount = 0;

export const getNewNodeId = () => `${nodeIdCount++}`;

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
      const namesMatch = existingHandle.name === exportHandle.name;
      const pathsMatch = exportHandle.nodePath.includes(
        existingHandle.importPath
      );
      // console.log('existingHandle:', existingHandle);
      // console.log('exportHandle:', exportHandle);
      // console.log('pathsMatch:', pathsMatch);

      // console.log('namesMatch:', namesMatch);
      const isMatching =
        existingHandle.handleType === 'import' && namesMatch && pathsMatch;

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
      const namesMatch = existingHandle.name === importHandle.name;
      const pathsMatch = existingHandle.nodePath.includes(
        importHandle.importPath
      );
      console.log('existingHandle:', existingHandle);
      console.log('importHandle:', importHandle);
      console.log('pathsMatch:', pathsMatch);

      console.log('namesMatch:', namesMatch);
      const isMatching =
        existingHandle.handleType === 'import' && namesMatch && pathsMatch;

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

export const stringToDarkTransparentColor = (str) => {
  // Hash the input string
  let hash = 0;
  console.log('str:', str);
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Convert hash to a color
  let color = '#';
  for (let i = 0; i < 3; i++) {
    let value = (hash >> (i * 8)) & 0xff;
    // Ensure the value is dark (less than 128 to be dark)
    value = Math.min(value, 127);
    // Convert to hex and pad if necessary
    color += ('00' + value.toString(16)).substr(-2);
  }

  // Add transparency
  let alpha = Math.floor(0.5 * 255).toString(16); // 50% transparency
  color += alpha;

  return color;
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

const sortDirectory = (flat, parentKey) => {
  const children = flat[parentKey].children;
  const folders = children.filter((child) => flat[child].isFolder);
  const others = children.filter((child) => !flat[child].isFolder);
  folders.sort();
  others.sort();

  const sortedChildren = folders.concat(others);

  flat[parentKey].children = sortedChildren;
};

const flattenStructure = (flat, nestedStructure, parentKey) => {
  nestedStructure.forEach((child) => {
    flat[parentKey].children.push(child.path);
    flat[child.path] = {
      index: child.path,
      children: [],
      data: child.name,
      isFolder: child.isDirectory,
    };
    if (child.isDirectory) {
      flattenStructure(flat, child.contents, child.path);
    }
  });
  sortDirectory(flat, parentKey);

  return flat;
};

export const flattenFileTree = (folderData) => {
  const wrapped = { name: 'root', contents: folderData };
  const flat = {
    root: {
      index: 'root',
      children: [],
      data: 'Root item',
      isFolder: true,
    },
  };

  flattenStructure(flat, wrapped.contents, 'root');

  return flat;
};
