import React, { memo, useState, useEffect, useRef } from 'react';
import { useDrag } from 'react-dnd';
import { Box } from './Box';
import { ItemTypes } from './ItemTypes.js';
import { loader } from '@monaco-editor/react';
import Editor from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { parse } from 'acorn';
import estraverse from 'estraverse';
import Button from '@mui/material/Button';
const { ResizableBox } = require('react-resizable');
loader.config({ monaco });

const getExports = (code) => {
  const ast = parse(code, { sourceType: 'module' });
  const exports = [];
  estraverse.traverse(ast, {
    enter: (node) => {
      if (node.type === 'ExportNamedDeclaration') {
        if (node.declaration) {
          if (node.declaration.type === 'FunctionDeclaration') {
            exports.push(node.declaration.id.name);
          } else if (node.declaration.type === 'VariableDeclaration') {
            node.declaration.declarations.forEach((declaration) => {
              exports.push(declaration.id.name);
            });
          } else if (node.declaration.type === 'ClassDeclaration') {
            exports.push(node.declaration.id.name);
          }
        } else if (node.specifiers) {
          node.specifiers.forEach((specifier) => {
            exports.push(specifier.exported.name);
          });
        }
      } else if (node.type === 'ExportDefaultDeclaration') {
        if (node.declaration.type === 'Identifier') {
          exports.push(node.declaration.name);
        } else {
          exports.push('default');
        }
      }
    },
  });
  return exports;
};

function getStyles(left, top, isDragging, passing) {
  const transform = `translate3d(${left}px, ${top}px, 0)`;
  return {
    position: 'absolute',
    transform,
    WebkitTransform: transform,
    padding: '10px',
    backgroundColor: '#1E1E1E',
    color: '#E0E0E0',
    borderRadius: '10px',
    border: '1px solid #2A2A2A',
    // IE fallback: hide the real node using CSS when dragging
    // because IE will ignore our custom "empty image" drag preview.
  };
}

export const DraggableBox = memo(function DraggableBox(props) {
  const {
    id,
    value,
    left,
    top,
    onShowTest,
    onTextChange,
    onTest,
    type,
    passing,
  } = props;
  const editorRef = useRef(null);
  const [{ isDragging }, drag, preview] = useDrag(
    () => ({
      type: ItemTypes.BOX,
      item: { id, left, top },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }),
    [id, left, top]
  );

  const [details, setDetails] = useState('');

  const onChange = (value) => {
    // try {
    //   const exports = getExports(value);
    //   console.log('exports:', exports);
    //   const details = `Exports: ${exports.join(', ')}`;
    //   setDetails(details);
    // } catch (e) {}
    onTextChange(id, value);
  };

  const [showDetails, setShowDetails] = useState(false);

  const changeDetails = () => {
    setShowDetails(!showDetails);

    console.log('showDetails:', showDetails);
  };

  const changeTests = () => {
    setShowTests(!showTests);
    console.log('==== showing test for parent', id);
    onShowTest(id);
    console.log('showTests:', showTests);
  };

  const [showTests, setShowTests] = useState(false);

  return (
    <div style={getStyles(left, top, isDragging, passing)} role="DraggableBox">
      {/* Draggable handle */}
      <div
        ref={drag}
        style={{
          width: '100%',
          height: '10px',
          cursor: 'move',
          backgroundColor: passing ? '#004d00' : '#4d0000',
        }}
      />
      <Button
        variant={showDetails ? 'contained' : 'outlined'}
        color="primary"
        onClick={changeDetails}
      >
        Details
      </Button>

      {(type === 'test' && (
        <Button
          variant={showTests ? 'contained' : 'outlined'}
          color="primary"
          onClick={() => onTest(id)}
        >
          Run test
        </Button>
      )) || (
        <Button
          variant={showTests ? 'contained' : 'outlined'}
          color="primary"
          onClick={changeTests}
        >
          Tests
        </Button>
      )}

      {/* Non-draggable content */}
      <div>
        {!showDetails ? (
          <Editor
            onChange={onChange}
            height="500px"
            width="400px"
            defaultLanguage="javascript"
            automaticLayout="true"
            value={value}
            theme="vs-dark" // Assuming you are using Monaco Editor
          />
        ) : null}
        {showDetails ? (
          <div>
            Details:
            {details}
          </div>
        ) : null}
      </div>
    </div>
  );
});
