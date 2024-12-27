import React, { useState } from 'react';
import { FunctionEditor } from '../../FunctionEditor';
import { useFileSystem } from '../../../stores/useFileSystem';

export const PureFunctionNode = ({ id, data }) => {
  const fileInfo = useFileSystem((state) => {
    const fileInfo = state.flatFiles[data.fullPath];
    if (!fileInfo) {
      return null;
    }
    return fileInfo;
  });
  const funcInfo = fileInfo.functions.find(
    (func) => func.id === data.functionId
  );

  const hasChildren = funcInfo?.nestedFunctions.length > 0;

  return (
    <>
      <div className="text-updater-node" style={{ border: '2px solid black' }}>
        {!hasChildren && (
          <FunctionEditor
            fullPath={data.fullPath}
            functionId={data.functionId}
          />
        )}
      </div>
    </>
  );
};
