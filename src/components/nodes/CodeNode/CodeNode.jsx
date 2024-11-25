import React from 'react';
import { useRef } from 'react';
import { Handle } from 'reactflow';
import { loader } from '@monaco-editor/react';
import Editor from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { useDebouncedCallback } from 'use-debounce';

import 'react-tooltip/dist/react-tooltip.css';

loader.config({ monaco });

const codeNodeStyle = {
  width: '100%',
  height: '100%',
  paddingTop: '15px',
  borderRadius: '5px',
  backgroundColor: 'black',
  boxShadow: '0 0 10px rgba(0, 0, 0, 0.5)',
};

export const CodeNode = ({ id, functionId, moduleId, data, onTextChange }) => {
  const editorRef = useRef(null);
  const text = data.content || 'test string';

  //TODOO split apart saving and updating the saved data
  // so that debounce only applies to saving/formatting
  const debouncedOnChange = useDebouncedCallback((newText) => {
    onTextChange(id, newText);
  }, 1);

  const onChange = (newText) => {
    onTextChange(data.moduleId, data.functionId, newText);
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
