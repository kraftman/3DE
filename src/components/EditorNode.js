import React from 'react';
import { useCallback, useRef, useState } from 'react';
import { Handle, Position, NodeToolbar } from 'reactflow';
import { loader } from '@monaco-editor/react';
import Editor from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import TextField from '@mui/material/TextField';
loader.config({ monaco });

import { getImports, getExports } from './editorUtils';

export const EditorNode = ({
  id,
  data,
  onTextChange,
  onChangeHandles,
  onFileNameChange,
}) => {
  const editorRef = useRef(null);
  const [decorations, setDecorations] = useState([]);

  const onChange = (value) => {
    onTextChange(id, value);
    addDecorators();

    //TODO move to parent
    const exports = getExports(value);
    const imports = getImports(value);
    //console.log('exports', exports);
    const handles = exports.map((exp) => ({
      id: 'export-' + exp.name,
      type: 'source',
      position: Position.Left,
      name: exp.name,
      style: {
        left: -5,
        top: -5 + 16 * exp.line,
      },
    }));

    const importHandles = imports.map((imp) => ({
      id: 'import-' + imp.name,
      type: 'source',
      position: Position.Right,
      style: {
        left: 330,
        top: -5 + 16 * imp.line,
      },
    }));
    onChangeHandles(id, handles.concat(importHandles));
    //updateNodeInternals(id);
  };

  const addDecorators = () => {
    const editor = editorRef.current;
    const model = editor.getModel();

    const matches = [];
    const regex = /\:string\b/g;
    const text = model.getValue();
    let match;

    while ((match = regex.exec(text)) !== null) {
      const startLineNumber = text.substring(0, match.index).split('\n').length;
      const startColumn = match.index - text.lastIndexOf('\n', match.index - 1);
      const endLineNumber = text
        .substring(0, regex.lastIndex)
        .split('\n').length;
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

    const newDecorationIds = editor.deltaDecorations(
      decorations,
      newDecorations
    );
    setDecorations(newDecorationIds);
  };

  const renderedHandles = data?.handles?.map((handle) => (
    <Handle
      key={handle.id}
      type={handle.type}
      position={handle.position}
      id={handle.id}
      style={handle.style}
    />
  ));

  return (
    <>
      {renderedHandles}
      <div className="text-updater-node">
        <NodeToolbar
          className="node-toolbar"
          isVisible={true}
          position={{ x: 0, y: 0 }}
        >
          <TextField
            variant="outlined"
            value={data.fileName}
            onChange={(event) => onFileNameChange(id, event.target.value)}
          />
          <button>📝</button>
          <button>✅</button>
        </NodeToolbar>
        <Editor
          className="nodrag"
          onChange={onChange}
          height="100%"
          width="100%"
          defaultLanguage="javascript"
          automaticLayout="true"
          value={data.value}
          options={{
            fontSize: 12,
            lineNumbersMinChars: 2,
            minimap: {
              enabled: false,
            },
          }}
          theme="vs-dark"
          onMount={(editor) => {
            editorRef.current = editor;
            addDecorators();
          }}
        />
      </div>
    </>
  );
};
