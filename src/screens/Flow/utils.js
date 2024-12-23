import { Position } from '@xyflow/react';

import * as ts from 'typescript';

let nodeIdCount = 0;

export const getNewNodeId = () => `${nodeIdCount++}`;

const makeSafeFilename = (input) => {
  // Extract the first 8 characters
  let base = input.slice(0, 8);

  // Define a regex pattern for characters not allowed in filenames
  const unsafeChars = /[\/\?<>\\:\*\|\"=\s]/g;

  // Replace unsafe characters with an underscore
  let safeFilename = base.replace(unsafeChars, '_');

  return safeFilename;
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
