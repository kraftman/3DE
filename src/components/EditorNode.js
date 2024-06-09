import React from 'react';
import { useCallback, useRef, useState } from 'react';
import { Handle, Position, NodeToolbar } from 'reactflow';
import { loader } from '@monaco-editor/react';
import Editor from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
loader.config({ monaco });

const handleStyle = { left: 10 };

export const EditorNode = ({ data, onTextChange }) => {
  const editorRef = useRef(null);
  const [decorations, setDecorations] = useState([]);

  const onChange = (value) => {
    onTextChange(data.id, value);
    addDecorators();
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

  return (
    <>
      <Handle type="target" position={Position.Top} />
      <div className="text-updater-node">
        <NodeToolbar
          className="node-toolbar"
          isVisible={true}
          position={{ x: 0, y: 0 }}
        >
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
      <Handle type="source" position={Position.Bottom} id="a" />
    </>
  );
};
