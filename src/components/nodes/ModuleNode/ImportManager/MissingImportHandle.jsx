import React from 'react';
import { useNodeManager } from '../../../../hooks/useNodeManager';
import { missingImportButtonStyle } from './styles';

export const MissingImportHandle = ({ handle, data }) => {
  const { createMissingImport } = useNodeManager((store) => ({
    createMissingImport: store.createMissingImport,
  }));

  return (
    <button
      onClick={() => {
        createMissingImport(data.moduleId, handle.data.fullPath);
      }}
      key={handle.key}
      style={{
        ...missingImportButtonStyle,
        top: handle.style.top,
        right: handle.style.right,
      }}
    >
      {handle.data.name}
    </button>
  );
};
