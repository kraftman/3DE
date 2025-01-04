import React, { useState, useRef, useEffect, useMemo } from 'react';
import Editor, { loader, DiffEditor } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { useFileSystem } from '../stores/useFileSystem';
import { debounce } from 'lodash';

import { FunctionBar } from './FunctionBar';
import { extractNonFunctionStatements } from '../utils/parser';
import { parseWithRecast } from '../utils/parseWithRecast';
import * as recast from 'recast';
import { ask } from '../utils/openrouter';
import { generateFunctionSignature } from '../utils/astUtils';

import Prism from 'prismjs';
import 'prism-themes/themes/prism-vsc-dark-plus.css';
import 'prismjs/components/prism-javascript';
import { useFunctionManager } from '../hooks/useFunctionManager';
import { getEditorSize } from './editorUtils';

loader.config({ monaco });

const prompt = `
 Analyze the following code snippet and suggest essential improvements that provide clear value, such as fixing bugs, improving performance, enhancing readability, or addressing security issues. Return your response in the following JSON format:

{
  "updatedCode": "<fully updated code, or the original code if no changes are needed>",
  "explanation": "<explanation of changes made, or a statement confirming no changes were necessary>"
}
Only provide essential improvements. Do not suggest superficial or stylistic changes unless they significantly impact code quality. Ensure the JSON is well-formatted and valid.  
Do not wrap the response in tags or comments or code blocks using backticks.
`;

export const FunctionEditor = ({ fullPath, functionId }) => {
  const editorRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);
  const [suggested, setSuggested] = useState(null);
  console.log('function editor re-rendering', functionId);

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

  const [text, setText] = useState(funcInfo.localBody);

  const { onFunctionTextChange, onFunctionSizeChange } = useFunctionManager(
    (store) => ({
      onFunctionTextChange: store.onFunctionTextChange,
      onFunctionSizeChange: store.onFunctionSizeChange,
    })
  );

  useEffect(() => {
    if (funcInfo) {
      const functionContent = extractNonFunctionStatements(funcInfo.node);
      const parsed = recast.print(functionContent.body, {
        reuseWhitespace: true,
      }).code;
      setText(parsed);
    }
  }, [fileInfo, funcInfo]);

  const debouncedUpdate = useMemo(
    () =>
      debounce((newText, fullPath, functionId, funcInfo, onFunctionSizeChange, onFunctionTextChange) => {
        const existingSize = funcInfo.contentSize;
        const newSize = getEditorSize(newText);
        if (existingSize.height !== newSize.height || existingSize.width !== newSize.width) {
          onFunctionSizeChange(fullPath, functionId, newSize);
        }
        const wrappedCode = `${funcInfo.async ? 'async ' : ''}function temp() ${newText} `;
        const parsed = parseWithRecast(wrappedCode);
        if (parsed) {
          const newBodyStatements = parsed.program.body[0].body;
          onFunctionTextChange(fullPath, functionId, newBodyStatements);
        }
      }, 300),
    []
  );

  const onChange = (newText) => {
    setText(newText);
    debouncedUpdate(newText, fullPath, functionId, funcInfo, onFunctionSizeChange, onFunctionTextChange);
  };

  const PlaceHolder = ({ code }) => {
    const placeholderRef = useRef(null);

    useEffect(() => {
      if (placeholderRef.current) {
        Prism.highlightElement(placeholderRef.current);
      }
    }, [code]);

    return (
      <pre
        className="language-javascript"
        style={{ fontSize: '12px', padding: '0px', paddingLeft: '20px' }}
      >
        <code ref={placeholderRef}>{code}</code>
      </pre>
    );
  };

  useEffect(() => {
    return () => {
      if (editorRef.current) {
        editorRef.current.dispose();
      }
    };
  }, []);

  const onAi = async () => {
    const sig = generateFunctionSignature(funcInfo);
    try {
      const answer = await ask(prompt + sig + text);
      const parsed = JSON.parse(answer);

      setSuggested(parsed.updatedCode);
    } catch (e) {
      console.error(e);
    }
  };

  // Handler for accepting the suggested changes
  const acceptSuggestion = () => {
    if (suggested) {
      onChange(suggested);
      setSuggested(null);
    }
  };

  return (
    <div
      className="editor-container"
      tabIndex={0} // Makes the div focusable
      onFocusCapture={() => setIsFocused(true)}
      onBlurCapture={() => setIsFocused(false)}
    >
      <FunctionBar fullPath={fullPath} funcInfo={funcInfo} onAi={onAi} />

      {suggested ? (
        // If there's a suggested code snippet, show DiffEditor
        <div style={{ height: '100%', width: '100%', position: 'relative' }}>
          <DiffEditor
            height="100%"
            width="100%"
            original={text}
            modified={suggested}
            language="javascript"
            theme="vs-dark"
            options={{
              fontSize: 10,
              lineNumbersMinChars: 2,
              renderSideBySide: true,
              minimap: { enabled: false },
            }}
          />
          <button
            onClick={acceptSuggestion}
            style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              zIndex: 9999,
            }}
          >
            Accept Suggestion
          </button>
        </div>
      ) : isFocused ? (
        // If focused and no suggestions, show normal Editor
        <Editor
          className="editor nodrag"
          onChange={onChange}
          height="100%"
          width="100%"
          defaultLanguage="javascript"
          value={text}
          options={{
            fontSize: 10,
            lineNumbersMinChars: 2,
            automaticLayout: true,
            scrollBeyondLastLine: false,
            minimap: { enabled: false },
            lineNumbers: 'off',
          }}
          theme="vs-dark"
          onMount={(editor) => {
            editorRef.current = editor;
          }}
        />
      ) : (
        // If unfocused and no suggestions, show the placeholder
        <PlaceHolder code={text} />
      )}
    </div>
  );
};
