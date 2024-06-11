import React from 'react';
import { memo } from 'react';
import { Handle, Position, NodeResizer } from 'reactflow';

const GroupNodeInternal = ({ data }) => {
  return (
    <>
      <NodeResizer minWidth={100} minHeight={30} />
      <Handle type="target" position={Position.Left} />
      <div style={{ padding: 10 }}>{data.label}</div>
      <Handle type="source" position={Position.Right} />
    </>
  );
};

export const GroupNode = memo(GroupNodeInternal);
