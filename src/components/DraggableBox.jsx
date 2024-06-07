import React, { memo, useEffect } from 'react';
import { useDrag } from 'react-dnd';
import { Box } from './Box';
import { ItemTypes } from './ItemTypes.js';
import { loader } from '@monaco-editor/react';
import Editor from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
loader.config({ monaco });

function getStyles(left, top, isDragging) {
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
  const { id, title, left, top } = props;
  const [{ isDragging }, drag, preview] = useDrag(
    () => ({
      type: ItemTypes.BOX,
      item: { id, left, top, title },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }),
    [id, left, top, title]
  );

  return (
    <div style={getStyles(left, top, isDragging)} role="DraggableBox">
      {/* Draggable handle */}
      <div
        ref={drag}
        style={{
          width: '100%',
          height: '10px',
          cursor: 'move',
          backgroundColor: 'gray',
        }}
      />

      {/* Non-draggable content */}
      <div>
        <Editor
          height="40vh"
          width="40vw"
          defaultLanguage="javascript"
          defaultValue="// some comment"
          theme="vs-dark" // Assuming you are using Monaco Editor
        />
      </div>
    </div>
  );
});
