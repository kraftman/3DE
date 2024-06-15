import React from 'react';
import { memo } from 'react';
import { Handle, Position, NodeResizer } from 'reactflow';

const GroupNodeInternal = ({ data, selected }) => {
  return (
    <>
      <NodeResizer
        color="#ff0071"
        isVisible={selected}
        minWidth={100}
        minHeight={30}
      />
      <div style={{ padding: 10 }}>{data.label}</div>
    </>
  );
};

export const GroupNode = memo(GroupNodeInternal);
