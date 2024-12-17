import React, { useState } from 'react';
import { FunctionEditor } from '../../FunctionEditor.old';
import { useFileSystem } from '../../../stores/useFileSystem';
import { FunctionBar } from '../../FunctionBar';

export const PureFunctionNode = ({ id, data }) => {
  const funcInfo = useFileSystem((state) => {
    const fileInfo = state.flatFiles[data.fullPath];
    if (!fileInfo) {
      return null;
    }
    return fileInfo.functions.find((func) => func.id === data.functionId);
  });

  const hasChildren = funcInfo?.nestedFunctions.length > 0;

  return (
    <>
      {/* {renderedHandles} */}
      <div className="text-updater-node" style={{ border: '2px solid black' }}>
        <FunctionBar funcInfo={funcInfo} />
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
