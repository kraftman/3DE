import React, { useState, useRef, useEffect } from 'react';
import Editor, { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { useFileSystem } from '../stores/useFileSystem';
import { useLayer } from '../hooks/useLayer';

import { extractNonFunctionStatements } from '../utils/parser';

import { parseWithRecast } from '../utils/parseWithRecast';

loader.config({ monaco });

export const FunctionEditor = ({ fullPath, functionId }) => {
  const editorRef = useRef(null);

  const funcInfo = useFileSystem((state) => {
    const fileInfo = state.flatFiles[fullPath];
    if (!fileInfo) {
      return null;
    }
    return fileInfo.functions.find((func) => func.id === functionId);
  });

  const { onFunctionTextChange } = useLayer((store) => ({
    onFunctionTextChange: store.onFunctionTextChange,
  }));

  const [text, setText] = useState(funcInfo?.code || '');

  useEffect(() => {
    //console.log('getting new values for function content');
    const functionContent = funcInfo
      ? extractNonFunctionStatements(funcInfo.node)
      : '';
    setText(functionContent);
  }, [funcInfo]);

  const onChange = (newText) => {
    setText(newText);
    const wrappedCode = `${
      funcInfo.async ? 'async ' : ''
    }function temp() { ${newText} }`;
    // maybe this should be moved to iinside the onFunctionTextChange
    const parsed = parseWithRecast(wrappedCode);
    if (parsed) {
      const newBodyStatements = parsed.program.body[0].body.body;
      console.log('new body statements', newBodyStatements);
      onFunctionTextChange(fullPath, functionId, newBodyStatements);
    }
    //debouncedOnChange(newText);
  };

  return (
    <div className="editor-container">
      <Editor
        className="editor nodrag"
        onChange={onChange}
        height="100%"
        width="100%"
        defaultLanguage={'javascript'}
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
  );
};
