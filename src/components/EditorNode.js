import React from 'react';
import { useCallback, useRef, useState } from 'react';
import {
  Handle,
  Position,
  NodeToolbar,
  useUpdateNodeInternals,
} from 'reactflow';
import { loader } from '@monaco-editor/react';
import Editor from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { parse } from 'acorn';
import estraverse from 'estraverse';
import TextField from '@mui/material/TextField';
loader.config({ monaco });

const getImports = (code) => {
  try {
    const ast = parse(code, { sourceType: 'module', locations: true });
    const imports = [];
    estraverse.traverse(ast, {
      enter: (node) => {
        if (node.type === 'ImportDeclaration') {
          console.log('ImportDeclaration', node);
          const values = { line: node.loc.start.line, name: node.source.value };
          console.log('values', values);
          imports.push(values);
        }
      },
    });
    return imports;
  } catch (e) {
    console.log('bad syntax', e);
    return [];
  }
};

const getExports = (code) => {
  try {
    const ast = parse(code, { sourceType: 'module', locations: true });
    const exports = [];
    estraverse.traverse(ast, {
      enter: (node) => {
        if (node.type === 'ExportNamedDeclaration') {
          //console.log('ExportNamedDeclaration', node);
          const identifier = node.declaration.declarations.find(
            (d) => d.id.type === 'Identifier'
          );
          //console.log('identifier', identifier);
          const name = identifier.id.name;
          const line = node.loc.start.line;
          exports.push({ name, line });
        } else if (node.type === 'ExportDefaultDeclaration') {
          if (node.declaration.type === 'Identifier') {
            exports.push({
              name: node.declaration.name,
              line: node.loc.start.line,
            });
          } else {
            exports.push({ name: 'default', line: node.loc.start.line });
          }
        }
      },
    });
    return exports;
  } catch (e) {
    console.log('bad syntax', e);
    return [];
  }
};

export const EditorNode = ({
  id,
  data,
  onTextChange,
  onChangeHandles,
  onFileNameChange,
}) => {
  const editorRef = useRef(null);
  const [decorations, setDecorations] = useState([]);
  const updateNodeInternals = useUpdateNodeInternals();

  const onChange = (value) => {
    onTextChange(id, value);
    addDecorators();
    const exports = getExports(value);
    const imports = getImports(value);
    //console.log('exports', exports);
    const handles = exports.map((exp) => ({
      key: exp.name,
      type: 'source',
      position: Position.Top,
      id: exp.name,
      style: {
        left: -5,
        top: -5 + 16 * exp.line,
      },
    }));
    // <Handle
    //   key={exp.name}
    //   type="source"
    //   position={Position.Top}
    //   id={exp.name}
    //   style={{
    //     left: -5,
    //     top: -5 + 16 * exp.line,
    //   }}
    // />
    const importHandles = imports.map((imp) => ({
      key: imp.name,
      type: 'target',
      position: Position.Top,
      id: imp.name,
      style: {
        left: 330,
        top: -5 + 16 * imp.line,
      },
    }));
    // <Handle
    //   key={imp.name}
    //   type="target"
    //   position={Position.Top}
    //   id={imp.name}
    //   style={{
    //     left: 330,
    //     top: -5 + 16 * imp.line,
    //   }}
    // />
    console.log('==== id', id);
    console.log('handles', handles.concat(importHandles));
    onChangeHandles(id, handles.concat(importHandles));
    //updateNodeInternals(id);
  };

  const addDecorators = () => {
    const editor = editorRef.current;
    const model = editor.getModel();

    const matches = [];
    const regex = /\:string\b/g;
    const text = model.getValue();
    let match;

    while ((match = regex.exec(text)) !== null) {
      const startLineNumber = text.substring(0, match.index).split('\n').length;
      const startColumn = match.index - text.lastIndexOf('\n', match.index - 1);
      const endLineNumber = text
        .substring(0, regex.lastIndex)
        .split('\n').length;
      const endColumn =
        regex.lastIndex - text.lastIndexOf('\n', regex.lastIndex - 1);
      matches.push({
        range: new monaco.Range(
          startLineNumber,
          startColumn,
          endLineNumber,
          endColumn
        ),
        options: {
          beforeContentClassName: 'before-class',
          afterContentClassName: 'after-class',
          inlineClassName: 'match-class',
        },
      });
    }

    const newDecorations = matches.map((match) => ({
      range: match.range,
      options: match.options,
    }));

    const newDecorationIds = editor.deltaDecorations(
      decorations,
      newDecorations
    );
    setDecorations(newDecorationIds);
  };

  const renderedHandles = data?.handles?.map((handle) => (
    <Handle
      key={handle.id}
      type={handle.type}
      position={handle.position}
      id={handle.id}
      style={handle.style}
    />
  ));

  return (
    <>
      {renderedHandles}
      <div className="text-updater-node">
        <NodeToolbar
          className="node-toolbar"
          isVisible={true}
          position={{ x: 0, y: 0 }}
        >
          <TextField
            variant="outlined"
            value={data.fileName}
            onChange={onFileNameChange}
          />
          <button>📝</button>
          <button>✅</button>
        </NodeToolbar>
        <Editor
          className="nodrag"
          onChange={onChange}
          height="100%"
          width="100%"
          defaultLanguage="javascript"
          automaticLayout="true"
          value={data.value}
          options={{
            fontSize: 12,
            lineNumbersMinChars: 2,
            minimap: {
              enabled: false,
            },
          }}
          theme="vs-dark"
          onMount={(editor) => {
            editorRef.current = editor;
            addDecorators();
          }}
        />
      </div>
    </>
  );
};
