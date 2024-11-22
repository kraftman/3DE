import React from 'react';
import { useRef } from 'react';
import { NodeResizer, Handle } from 'reactflow';
import { loader } from '@monaco-editor/react';
import Editor from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { Pip } from '../../Pip';
import { useDebouncedCallback } from 'use-debounce';

import * as recast from 'recast';

import 'react-tooltip/dist/react-tooltip.css';

loader.config({ monaco });

function findCallExpressions(ast) {
  const callExpressions = [];
  const ignoreList = ['console.log', 'console.error', 'console.warn'];

  // Use recast's `visit` function to traverse the AST
  recast.types.visit(ast, {
    visitCallExpression(path) {
      // Add the current CallExpression node to the results

      const node = path.node;
      let functionName = null;
      if (node.callee.type === 'Identifier') {
        functionName = node.callee.name; // e.g., `myFunction()`
      } else if (node.callee.type === 'MemberExpression') {
        // For member expressions like `console.log` or `Math.max`
        functionName = recast.print(node.callee).code;
      }

      if (!ignoreList.includes(functionName)) {
        console.log('functionName in callexp', functionName);
        callExpressions.push({ node: path.node, name: functionName });
      }

      // Continue traversing
      this.traverse(path);
    },
  });

  return callExpressions;
}

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

  let functionHandles = [];
  if (data.funcInfo) {
    const subtreeCode = recast.print(data.funcInfo.node).code;

    // Parse the source code into a new AST
    const newAst = recast.parse(subtreeCode);
    const functionCalls = findCallExpressions(newAst);
    functionHandles = functionCalls.map((call, index) => {
      const line = call.node.loc.start.line;

      const key = 'func:' + call.name + ':out' + index;

      return (
        <Handle
          key={key}
          type="source"
          position={'right'}
          id={key}
          style={{
            top: 14 * line,
          }}
        >
          <div style={{ color: 'white' }}>{call.name}</div>
        </Handle>
      );
    });
  }

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
      <div style={{ ...codeNodeStyle }}>
        {functionHandles}
        <Handle
          key={data.functionName + ':in'}
          type="source"
          position={'left'}
          id={data.functionName + ':in'}
          style={{
            top: 10,
            left: -10,
            color: 'blue',
          }}
        >
          <div style={{ color: 'white' }}>{data.functionName}</div>
        </Handle>
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
        {importHandles}
      </div>
    </>
  );
};
