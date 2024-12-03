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
} from '@xyflow/react';

import * as ts from 'typescript';

import { getHandles } from '../../components/editorUtils';
let nodeIdCount = 0;

export const getNewNodeId = () => `${nodeIdCount++}`;

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

const makeSafeFilename = (input) => {
  // Extract the first 8 characters
  let base = input.slice(0, 8);

  // Define a regex pattern for characters not allowed in filenames
  const unsafeChars = /[\/\?<>\\:\*\|\"=\s]/g;

  // Replace unsafe characters with an underscore
  let safeFilename = base.replace(unsafeChars, '_');

  return safeFilename;
};

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

const findMatch = (fullPath, partialPath) => {
  const possibleExtensions = ['.js', '.jsx', '.ts', '.tsx', '.json'];
  for (const extension of possibleExtensions) {
    if (fullPath.includes(partialPath + extension)) {
      return true;
    }
  }
  if (fullPath === partialPath) {
    return true;
  }
  return false;
};

export const getNewEdges = (nodeId, existingHandles, newHandles) => {
  const exports = newHandles.filter((handle) => handle.handleType === 'export');
  const imports = newHandles.filter((handle) => handle.handleType === 'import');

  const newEdges = [];
  exports.forEach((exportHandle) => {
    existingHandles.forEach((existingHandle) => {
      const namesMatch = existingHandle.name === exportHandle.name;

      const pathsMatch = findMatch(
        exportHandle.nodePath,
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
      const pathsMatch = findMatch(
        existingHandle.nodePath,
        importHandle.importPath
      );
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

export const isValidCode = (code) => {
  const sourceFile = ts.createSourceFile(
    'tempFile.ts',
    code,
    ts.ScriptTarget.Latest,
    true
  );
  if (sourceFile.parseDiagnostics.length > 0) {
    return false;
  }
  return true;
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
];

export const createSelectionHandle = (node, selection) => {
  const startLine = selection.startLineNumber;
  const endLine = selection.endLineNumber;
  const startColumn = selection.startColumn;
  const endColumn = selection.endColumn;

  const handle = {
    id: `selection-${startLine}-${endLine}`,
    name: 'selection',
    handleType: 'selection',
    type: 'source',
    position: Position.Right,
    nodePath: node.data.fullPath,
    fileName: node.data.fileName,
    loc: {
      start: {
        line: startLine,
        column: startColumn,
      },
      end: {
        line: endLine,
        column: endColumn,
      },
    },
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

const findFile = (flatFiles, fullPath) => {
  for (const [key, value] of Object.entries(flatFiles)) {
    if (key.includes(fullPath)) {
      console.log('found file:', value);
      return [key, value];
    }
  }
};

export const createChildren = (flatFiles, parentNode) => {
  const importHandles = getHandles(
    parentNode.id,
    parentNode.data.fullPath,
    parentNode.data.value
  ).filter((handle) => handle.handleType === 'import');

  const localImports = importHandles.filter((handle) => {
    const fileInfo = findFile(flatFiles, handle.importPath);
    return fileInfo;
  });

  const children = localImports.map((handle, index) => {
    const nextNodeId = getNewNodeId();
    const [fullPath, fileInfo] = findFile(flatFiles, handle.importPath);
    console.log('fileinfo: ', fileInfo);
    if (!fileInfo) {
      return null;
    }
    const fileContents = fileInfo.fileData;

    return {
      id: nextNodeId,
      data: {
        fullPath: fullPath,
        fileName: fileInfo.data,
        value: fileContents,
        handles: [],
      },
      type: 'editor',
      position: {
        x: 550,
        y: -(((index + 1) * 650) / 2) + index * 650,
      },
      style: {
        width: '500px',
        height: `400px`,
      },
      parentId: parentNode.id,
    };
  });
  return children.filter((child) => child !== null);
};
