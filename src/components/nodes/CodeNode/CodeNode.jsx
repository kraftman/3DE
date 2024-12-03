import React from 'react';
import { useRef } from 'react';
import { Handle } from '@xyflow/react';
import { loader } from '@monaco-editor/react';
import Editor from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { useDebouncedCallback } from 'use-debounce';

import 'react-tooltip/dist/react-tooltip.css';

import { useLayer } from '../../../hooks/useLayer';
import { useNodeManager } from '../../../hooks/useNodeManager';

loader.config({ monaco });

const codeNodeStyle = {
  width: '100%',
  height: '100%',
  paddingTop: '15px',
  borderRadius: '5px',
  backgroundColor: 'black',
  boxShadow: '0 0 10px rgba(0, 0, 0, 0.5)',
};

export const CodeNode = ({ id }) => {
  const editorRef = useRef(null);

  const debouncedOnChange = useDebouncedCallback((newText) => {
    onCodeNodeTextChange(id, newText);
  }, 1);

  const { onCodeNodeTextChange } = useLayer();
  const { getNodeById } = useNodeManager();

  const node = getNodeById(id);
  if (!node) {
    console.error('could not find node with id', id);
    return null;
  }

  const data = node.data;

  const text = data.content || '<no root content> ';

  const onChange = (newText) => {
    onCodeNodeTextChange(data.moduleId, data.functionId, newText);
    //debouncedOnChange(newText);
  };

  const newHandles = data.handles?.map((handle, index) => {
    return (
      <Handle
        key={handle.key}
        type={handle.type}
        position={handle.position}
        id={handle.id}
        style={{ ...handle.style }}
      >
        <div
          style={{ color: 'white', pointerEvents: 'none', fontSize: '10px' }}
        >
          {handle.data.name}
        </div>
      </Handle>
    );
  });

  return (
    <>
      <div style={{ ...codeNodeStyle }}>
        {newHandles}

        <div className="editor-container">
          <Editor
            className="editor nodrag"
            onChange={onChange}
            height="100%"
            width="100%"
            defaultLanguage={'javascript'}
            automaticLayout="true"
            value={text}
            options={{
              fontSize: 10,
              lineNumbersMinChars: 2,
              automaticLayout: true,
              scrollBeyondLastLine: false,
              minimap: {
                enabled: false,
              },
              lineNumbers: 'off',
            }}
            theme="vs-dark"
            onMount={(editor) => {
              editorRef.current = editor;
            }}
          />
        </div>
      </div>
    </>
  );
};
