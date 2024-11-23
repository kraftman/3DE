import React, { useRef, useState, useMemo } from 'react';
import { NodeResizer, Handle } from 'reactflow';
import Editor from '@monaco-editor/react';
import { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { findFunctions } from './findFunctions';
import { EditableText } from '../../EditableText';

loader.config({ monaco });

const handleTextStyle = {
  position: 'relative',
  width: '200px',
  transform: 'translate(10px, 40%)',
  fontSize: '12px',
  pointerEvents: 'none',
  color: 'white',
};

export const PureFunctionNode = ({
  data,
  selected,
  onTextChanged,
  onTitleChanged,
}) => {
  const editorRef = useRef(null);

  const text = data.content;

  const onChange = (value) => {
    onTextChanged(data.functionId, value);
  };

  const onTitleChangeInternal = (value) => {
    onTitleChanged(data.functionId, value);
  };

  return (
    <>
      {/* {renderedHandles} */}
      <div className="text-updater-node" style={{ border: '2px solid black' }}>
        <EditableText
          text={data.functionName}
          onChange={onTitleChangeInternal}
        />
        {/* <div className="editor-container">
          <Editor
            className="editor nodrag"
            onChange={onChange}
            height="100%"
            width="100%"
            defaultLanguage={'javascript'}
            automaticLayout="true"
            value={data.content}
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
        </div> */}
      </div>
    </>
  );
};
