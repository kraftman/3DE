import React, { useState, useRef, useEffect, useMemo } from 'react';
import Editor, { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { useFileSystem } from '../stores/useFileSystem';
import { useLayer } from '../hooks/useLayer';

import { FunctionBar } from './FunctionBar';

import { extractNonFunctionStatements } from '../utils/parser';

import { parseWithRecast } from '../utils/parseWithRecast';
import * as recast from 'recast';

import Prism from 'prismjs';
import 'prismjs/themes/prism-okaidia.css';
// Import languages you need
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-python';

loader.config({ monaco });

export const FunctionEditor = ({ fullPath, functionId }) => {
  const editorRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);

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

  const [text, setText] = useState('not  loaded');

  useEffect(() => {
    const functionContent = funcInfo
      ? extractNonFunctionStatements(funcInfo.node)
      : '';
    const parsed = recast.print(functionContent.body, {
      reuseWhitespace: true,
    }).code;
    setText(parsed);
  }, [fileInfo]);

  const onChange = (newText) => {
    setText(newText);
    const wrappedCode = `${
      funcInfo.async ? 'async ' : ''
    }function temp()  ${newText} `;
    console.log('wrapped code:', wrappedCode);
    // maybe this should be moved to iinside the onFunctonTextChange
    const parsed = parseWithRecast(wrappedCode);
    if (parsed) {
      const newBodyStatements = parsed.program.body[0].body;
      onFunctionTextChange(fullPath, functionId, newBodyStatements);
    }
  };

  const PlaceHolder = ({ code }) => {
    return (
      <pre style={{ fontSize: '13px' }}>
        <code className={`language-javascript`}>{code}</code>
      </pre>
    );
  };

  useEffect(() => {
    Prism.highlightAll();
  }, [text, isFocused]);

  return (
    <div
      className="editor-container"
      tabIndex={0} // Makes the div focusable
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
    >
      <FunctionBar fullPath={fullPath} funcInfo={funcInfo} />
      {isFocused ? (
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
      ) : (
        <PlaceHolder code={text} />
      )}
    </div>
  );
};
