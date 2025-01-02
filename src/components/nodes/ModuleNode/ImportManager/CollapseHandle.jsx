import React from 'react';
import { Handle } from '@xyflow/react';

export const CollapsedHandle = ({ handle }) => {
  return (
    <Handle
      key={handle.key}
      type="source"
      position="right"
      id={handle.id}
      style={{ ...handle.style, top: '10px' }}
    />
  );
};
