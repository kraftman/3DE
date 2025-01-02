import React from 'react';
import { useNodeManager } from '../../../../hooks/useNodeManager';
import { moduleImportButtonStyle } from './styles';
import { Handle } from '@xyflow/react';

export const ModuleImportHandle = ({ handle, data }) => {
  const { toggleChildModule } = useNodeManager((store) => ({
    toggleChildModule: store.toggleChildModule,
  }));

  return (
    <div key={handle.key}>
      <Handle
        key={handle.key}
        type="source"
        position="right"
        id={handle.id}
        style={{ ...handle.style }}
      />
      <button
        disabled
        onClick={() => {
          console.log('handle click', handle);
          const depth = 1;
          toggleChildModule(data.moduleId, handle.data.fullPath, depth);
        }}
        key={handle.key + '_button'}
        style={{
          ...moduleImportButtonStyle,
          top: handle.style.top + 5,
          right: handle.style.right,
        }}
      >
        {handle.data.name}
      </button>
    </div>
  );
};
