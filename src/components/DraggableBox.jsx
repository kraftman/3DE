import React, { memo, useEffect } from 'react';
import { useDrag } from 'react-dnd';
import { Box } from './Box';
import { ItemTypes } from './ItemTypes.js';
import * as monaco from 'monaco-editor';
import { loader } from '@monaco-editor/react';

loader.config({ monaco });

import Editor from '@monaco-editor/react';

function getStyles(left, top, isDragging) {
  const transform = `translate3d(${left}px, ${top}px, 0)`;
  return {
    position: 'absolute',
    transform,
    WebkitTransform: transform,
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
      <div style={{ padding: '10px' }}>
        <Editor
          height="90vh"
          defaultLanguage="javascript"
          defaultValue="// some comment"
        />
      </div>
    </div>
  );
});
