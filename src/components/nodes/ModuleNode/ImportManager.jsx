import React from 'react';
import { Handle } from '@xyflow/react';
import { findFileForImport } from '../../../utils/fileUtils';
import { useNodeManager } from '../../../hooks/useNodeManager';

//
// SHARED STYLES
//
const handleTextStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, 5px)',
  fontSize: '10px',
  pointerEvents: 'none',
  color: 'white',
  backgroundColor: 'black',
  border: '1px solid grey',
  padding: '2px 2px',
  boxSizing: 'border-box',
  borderRadius: '4px',
  whiteSpace: 'nowrap',
  textAlign: 'center',
};

// Base button style that all import-related button
const baseButtonStyle = {
  position: 'absolute',
  display: 'inline-flex',
  justifyContent: 'center',
  alignItems: 'center',
  fontSize: '10px',
  backgroundColor: 'black',
  padding: '2px 4px',
  boxSizing: 'border-box',
  borderRadius: '4px',
  textAlign: 'center',
  transform: 'translate(50%, 0)',
};

// Variants for different scenarios
const missingImportButtonStyle = {
  ...baseButtonStyle,
  color: 'red',
  border: '1px solid red',
};

const fileImportButtonStyle = {
  ...baseButtonStyle,
  color: 'white',
  border: '1px solid white',
};

const moduleImportButtonStyle = {
  ...baseButtonStyle,
  color: 'grey',
  border: '1px solid white',
};

//
// CHILD COMPONENTS
//
const CollapsedHandle = ({ handle }) => {
  return (
    <Handle
      key={handle.key}
      type="source"
      position="right"
      id={handle.id}
      style={{ ...handle.style, top: '10px' }}
    />
  );
};

const MissingImportHandle = ({ handle, data }) => {
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

/**
 * FileImportHandle, but expects a computed `top` from the parent
 * so other handles can be stacked below it.
 */
const FileImportHandle = ({ handle, data, top }) => {
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
            console.log('func imort clicked', specifier);
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
          {specifier.local.name}
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
      <button
        onClick={() => {
          const depth = 1;
          toggleChildModule(data.moduleId, handle.data.fullPath, depth);
        }}
        key={handle.key + '_button'}
        style={{
          ...fileImportButtonStyle,
          top: top + 5,
          right: handle.style.right,
        }}
      >
        {handle.data.name}
      </button>
      {importButtons}
    </div>
  );
};

const ModuleImportHandle = ({ handle, data }) => {
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

export const ImportManager = ({ flatFiles, data }) => {
  let currentTop = 100;

  const handleSpacing = 30;

  // Build up all your handles:
  const allHandles = data?.handles?.map((handle) => {
    if (handle.refType !== 'import') {
      // Non-import handles remain the same
      return (
        <Handle
          key={handle.key}
          type="source"
          position="right"
          id={handle.id}
          style={{ ...handle.style }}
        >
          <button style={handleTextStyle}>{handle.data.name}</button>
        </Handle>
      );
    }

    // If it is an import handle:
    if (Object.keys(flatFiles).length === 0) {
      return null;
    }

    if (data.isCollapsed) {
      // If the node is collapsed:
      return <CollapsedHandle key={handle.key} handle={handle} />;
    }

    if (handle.data.fullPath === false) {
      // It's a module import that isn't resolved to a file
      return (
        <ModuleImportHandle key={handle.key} handle={handle} data={data} />
      );
    }

    // If we found the file for the import:
    if (findFileForImport(flatFiles, handle.data.fullPath)) {
      const importCount = handle?.data?.import?.specifiers?.length || 1;
      const topForThisHandle = currentTop;

      // Increase currentTop by however tall you think this handle is:
      currentTop += importCount * handleSpacing;

      return (
        <FileImportHandle
          key={handle.key}
          handle={handle}
          data={data}
          top={topForThisHandle}
        />
      );
    }

    // Otherwise, it's a missing import handle:
    return <MissingImportHandle key={handle.key} handle={handle} data={data} />;
  });

  return <>{allHandles}</>;
};
