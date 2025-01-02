import React from 'react';
import { fileImportButtonStyle } from './styles';
import { useNodeManager } from '../../../../hooks/useNodeManager';
import { Handle } from '@xyflow/react';

import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

export const FileImportHandle = ({
  handle,
  data,
  top,
  onClick,
  showChildren,
}) => {
  const { toggleChildModule, togglePartialModule } = useNodeManager(
    (store) => ({
      toggleChildModule: store.toggleChildModule,
    })
  );

  const importButtons = handle.data.import.specifiers.map(
    (specifier, index) => {
      return (
        <button
          key={specifier.local + index}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            togglePartialModule(
              data.moduleId,
              handle.data.name,
              specifier.local.name
            );
          }}
          style={{
            ...fileImportButtonStyle,
            borderColor: 'blue',
            top: top + 25 + index * 20,
            right: handle.style.right,
          }}
        >
          {specifier.local?.name || specifier.imported?.name}
        </button>
      );
    }
  );

  return (
    <div>
      <Handle
        key={handle.key}
        type="source"
        position="right"
        id={handle.id}
        // We override the top with our computed offset:
        style={{ ...handle.style, top }}
      />
      <div
        style={{
          ...fileImportButtonStyle,
          top: top + 5,
          right: handle.style.right,
          backgroundColor: '#333', // Dark background for the div
          padding: '0px',
          borderRadius: '4px',
          display: 'flex',
          gap: '8px', // Space between buttons
          alignItems: 'center',
        }}
      >
        <button
          style={{
            backgroundColor: '#444', // Dark button background
            color: '#fff', // White text
            border: 'none',
            borderRadius: '2px',
            padding: '0px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
          onClick={() => {
            const depth = 1;
            onClick();
          }}
          key={handle.key + '_button'}
        >
          {handle.data.name}
        </button>
        <button
          style={{
            backgroundColor: '#444',
            color: '#fff',
            border: 'none',
            borderRadius: '2px',
            padding: '0px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={() => {
            console.log('handle click', handle);
            const depth = 1;
            toggleChildModule(data.moduleId, handle.data.fullPath, depth);
          }}
        >
          <ArrowForwardIcon style={{ color: '#fff', fontSize: '16px' }} />
        </button>
      </div>
      {showChildren[handle.key] ? importButtons : null}
    </div>
  );
};
