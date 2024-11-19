import React from 'react';
import { NodeResizer } from 'reactflow';

export const FunctionNode = () => {
  return (
    <>
      <NodeResizer
        minWidth={300}
        minHeight={300}
        style={{ background: 'none' }}
      />
      <div className="text-updater-node">
        <div className="function-node-header">
          <div className="function-node-header-text" style={{ color: 'white' }}>
            Function Name
          </div>
        </div>
        <div className="function-node-body">
          <div className="function-node-body-text">Function Body</div>
        </div>
      </div>
    </>
  );
};
