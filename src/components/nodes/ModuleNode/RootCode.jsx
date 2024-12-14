import React, { useState, useRef } from 'react';

import { loader } from '@monaco-editor/react';
import Editor from '@monaco-editor/react';
import * as monaco from 'monaco-editor';

loader.config({ monaco });

export const RootCode = ({ content, onChange }) => {
  const editorRef = useRef(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const addListeners = (editor) => {
    // editor.onDidChangeModelContent((e) => {
    //   console.log(e);
    // });
  };

  return (
    <div>
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          cursor: 'pointer',
          padding: '10px 0',
          display: 'flex',
          alignItems: 'center',
          color: '#666', // Light grey text
          fontSize: '14px',
        }}
      >
        <span style={{ marginLeft: '10px', flex: 1 }}>Root code</span>
      </div>
      {isExpanded && (
        <div className="editor-container">
          <Editor
            className="editor nodrag"
            onChange={onChange}
            height="100px"
            width="100%"
            defaultLanguage={'javascript'}
            automaticLayout="true"
            value={content || ''}
            options={{
              fontSize: 10,
              lineNumbersMinChars: 2,
              automaticLayout: true,
              scrollBeyondLastLine: true,
              minimap: {
                enabled: false,
              },
              lineNumbers: 'off',
            }}
            theme="vs-dark"
            onMount={(editor) => {
              editorRef.current = editor;
              addListeners(editor);
            }}
          />
        </div>
      )}
    </div>
  );
};
