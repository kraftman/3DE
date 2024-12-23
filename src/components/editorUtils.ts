import * as monaco from 'monaco-editor';
import { Position } from '@xyflow/react';

import { EDITOR } from '../constants';

import path from 'path-browserify';

import * as ts from 'typescript';

//const project = await createProject({ useInMemoryFileSystem: true });

const fsMap = {
  js: 'javascript',
  py: 'python',
  java: 'java',
  html: 'html',
  css: 'css',
  json: 'json',
  xml: 'xml',
  yaml: 'yaml',
  ts: 'typescript',
  tsx: 'typescript',
};
export const detectLanguage = (fileName) => {
  if (!fileName) {
    return 'plaintext';
  }
  const ext = fileName.split('.').pop();

  if (fsMap[ext]) {
    return fsMap[ext];
  }
  return 'plaintext';
};

const getMaxWidth = (lines) => {
  let maxWidth = 0;
  lines.forEach((line) => {
    maxWidth = Math.max(maxWidth, line.length);
  });
  return maxWidth;
};

export const getEditorSize = (code) => {
  const lines = code.split('\n');
  const newHeight = 50 + lines.length * 15;
  const newWidth = 100 + getMaxWidth(lines) * 6;
  return { height: newHeight, width: newWidth };
};

export const getDecorators = (text) => {
  const matches = [];
  const regex = /:string\b/g;

  let match;

  while ((match = regex.exec(text)) !== null) {
    const startLineNumber = text.substring(0, match.index).split('\n').length;
    const startColumn = match.index - text.lastIndexOf('\n', match.index - 1);
    const endLineNumber = text.substring(0, regex.lastIndex).split('\n').length;
    const endColumn =
      regex.lastIndex - text.lastIndexOf('\n', regex.lastIndex - 1);
    matches.push({
      range: new monaco.Range(
        startLineNumber,
        startColumn,
        endLineNumber,
        endColumn
      ),
      options: {
        beforeContentClassName: 'before-class',
        afterContentClassName: 'after-class',
        inlineClassName: 'match-class',
      },
    });
  }

  const newDecorations = matches.map((match) => ({
    range: match.range,
    options: match.options,
  }));
  return newDecorations;
};
