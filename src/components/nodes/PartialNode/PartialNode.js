import React, { useState } from 'react';
import { Handle } from '@xyflow/react';
import { FunctionEditor } from '../../FunctionEditor';

export const PartialNode = ({ id, data }) => {
  return (
    <>
      <div className="text-updater-node" style={{ border: '2px solid black' }}>
        <FunctionEditor fullPath={data.fullPath} functionId={data.functionId} />

        <Handle type="source" position={'left'} id={id + '-handle'} />
      </div>
    </>
  );
};
