import React, { useState } from 'react';
import { EditableText } from '../../EditableText';
import { useLayer } from '../../../hooks/useLayer';
import { FunctionEditor } from '../../FunctionEditor';
import { useFileSystem } from '../../../stores/useFileSystem';

export const PureFunctionNode = ({ id, data }) => {
  const { onfunctionTitledChanged } = useLayer();

  const [functionName, setFunctionName] = useState(data?.functionName || '');

  const funcInfo = useFileSystem((state) => {
    const fileInfo = state.flatFiles[data.fullPath];
    if (!fileInfo) {
      return null;
    }
    return fileInfo.functions.find((func) => func.id === data.functionId);
  });

  const onTitleChange = (value) => {
    setFunctionName(value);
  };

  const onfunctionTitledChangedInternal = () => {
    onfunctionTitledChanged(data.functionId, functionName);
  };

  const hasChildren = funcInfo?.nestedFunctions.length > 0;

  return (
    <>
      {/* {renderedHandles} */}
      <div className="text-updater-node" style={{ border: '2px solid black' }}>
        <EditableText
          text={functionName}
          onChange={onTitleChange}
          onFinishEditing={onfunctionTitledChangedInternal}
        />
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
