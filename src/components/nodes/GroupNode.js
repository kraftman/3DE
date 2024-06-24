import React from 'react';
import { memo } from 'react';
import { Handle, Position, NodeResizer } from 'reactflow';

const GroupNodeInternal = ({ data, selected }) => {
  return (
    <>
      <NodeResizer
        isVisible={selected}
        minWidth={400}
        minHeight={400}
        style={{ background: 'none' }}
      />
      <div
        style={{
          padding: 10,
        }}
      >
        {data.label}
      </div>
    </>
  );
};

export const GroupNode = memo(GroupNodeInternal);
