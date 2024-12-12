import React, { useMemo, useState, useEffect } from 'react';
import { useRef } from 'react';
import { Handle } from '@xyflow/react';
import { loader } from '@monaco-editor/react';
import Editor from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { useDebouncedCallback } from 'use-debounce';

import 'react-tooltip/dist/react-tooltip.css';

import { useLayer } from '../../../hooks/useLayer';
import { useNodeManager } from '../../../hooks/useNodeManager';
import { useStore } from '../../../contexts/useStore';
import { extractNonFunctionStatements } from '../../../utils/parser';
import { parseWithRecast } from '../../../utils/parseWithRecast';
import { useFileSystem } from '../../../stores/useFileSystem';

loader.config({ monaco });

const codeNodeStyle = {
  width: '100%',
  height: '100%',
  paddingTop: '15px',
  borderRadius: '5px',
  backgroundColor: 'black',
  boxShadow: '0 0 10px rgba(0, 0, 0, 0.5)',
};

export const CodeNode = ({ id, data }) => {
  const editorRef = useRef(null);

  const { onCodeNodeTextChange } = useLayer();

  const fileInfo = useFileSystem((state) => {
    return state.flatFiles[data.fullPath];
  });

  const funcInfo = fileInfo.functions.find(
    (func) => func.id === data.functionId
  );

  const [text, setText] = useState('');

  useEffect(() => {
    //console.log('getting new values for function content');
    const functionContent = funcInfo
      ? extractNonFunctionStatements(funcInfo.node)
      : '';
    setText(functionContent);
  }, [fileInfo]);

  const onChange = (newText) => {
    setText(newText);
    const wrappedCode = `${
      funcInfo.async ? 'async ' : ''
    }function temp() { ${newText} }`;
    const parsed = parseWithRecast(wrappedCode);
    if (parsed) {
      const newBodyStatements = parsed.program.body[0].body.body;
      console.log('new body statements', newBodyStatements);
      onCodeNodeTextChange(data.fullPath, data.functionId, newBodyStatements);
    }
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
