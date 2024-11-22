import React from 'react';
import { useRef } from 'react';
import { NodeResizer, Handle } from 'reactflow';
import { loader } from '@monaco-editor/react';
import Editor from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { Pip } from '../../Pip';
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

export const CodeNode = ({ id, data, onTextChange }) => {
  const editorRef = useRef(null);
  const text = data.content || 'test string';

  //TODOO split apart saving and updating the saved data
  // so that debounce only applies to saving/formatting
  const debouncedOnChange = useDebouncedCallback((newText) => {
    onTextChange(id, newText);
  }, 1);

  const onChange = (newText) => {
    //onTextChange(id, newText);
    debouncedOnChange(newText);
  };

  const importDefinitons = data.codeNode?.body?.filter((node) => {
    return node.type === 'ImportDeclaration';
  });

  const importHandles = importDefinitons?.map((node) => {
    const line = node.loc.start.line;
    let name = '';
    if (node.specifiers) {
      name =
        node.specifiers[0]?.local.name || node.specifiers[0]?.imported.name;
    }
    console.log('import name:', name);
    console.log(`==== node id: ${id} handle: ${name}:in`);
    return (
      <Handle
        key={name + ':in'}
        type="source"
        position={'left'}
        id={name + ':in'}
        style={{
          top: 10 + 14 * line,
        }}
      ></Handle>
    );
  });

  return (
    <>
      {importHandles}
      <div style={{ ...codeNodeStyle }}>
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
