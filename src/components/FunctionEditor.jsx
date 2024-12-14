import React, { useState, useRef, useEffect, useMemo } from 'react';
import Editor, { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { useFileSystem } from '../stores/useFileSystem';
import { useLayer } from '../hooks/useLayer';

import { extractNonFunctionStatements } from '../utils/parser';

import { parseWithRecast } from '../utils/parseWithRecast';
import * as recast from 'recast';

loader.config({ monaco });

export const FunctionEditor = ({ fullPath, functionId }) => {
  const editorRef = useRef(null);

  const fileInfo = useFileSystem((state) => {
    const fileInfo = state.flatFiles[fullPath];
    if (!fileInfo) {
      return null;
    }
    return fileInfo;
  });

  const funcInfo = useMemo(
    () => fileInfo?.functions.find((func) => func.id === functionId),
    [fileInfo]
  );

  const { onFunctionTextChange } = useLayer((store) => ({
    onFunctionTextChange: store.onFunctionTextChange,
  }));

  const [text, setText] = useState(funcInfo?.code || '');

  useEffect(() => {
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
    // maybe this should be moved to iinside the onFunctionTextChange
    const parsed = parseWithRecast(wrappedCode);
    if (parsed) {
      const newBodyStatements = parsed.program.body[0].body.body;
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
