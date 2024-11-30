import React, { useRef } from 'react';
import { NodeResizer, Handle } from '@xyflow/react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { Pip } from '../../Pip';

import { loader } from '@monaco-editor/react';
import Editor from '@monaco-editor/react';
import * as monaco from 'monaco-editor';

import { useState } from 'react';

import { useFileSystem } from '../../../contexts/FileSystemContext';

import { findFileForImport } from '../../../utils/fileUtils';

import { TopBar } from './TopBar';

import { useStore } from '../../../contexts/useStore';

loader.config({ monaco });

const handleTextStyle = {
  position: 'absolute', // Absolute positioning to center the text on the handle
  top: '50%', // Center vertically
  left: '50%', // Center horizontally
  transform: 'translate(-50%, 5px)', // Align the text perfectly at the center
  fontSize: '10px',
  pointerEvents: 'none', // Prevent the text from interfering with interactions
  color: 'white',
  backgroundColor: 'black',
  border: '1px solid grey', // Adds the border
  padding: '2px 2px', // Adds padding to make the border look better
  boxSizing: 'border-box', // Ensures padding doesn't increase the element size
  borderRadius: '4px',
  whiteSpace: 'nowrap', // Prevents text wrapping
  textAlign: 'center', // Centers text within the box
};

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
    text: {
      primary: '#ffffff',
      secondary: '#aaaaaa',
    },
  },
  typography: {
    fontFamily: 'Roboto, sans-serif',
  },
});

import { useLayer } from '../../../hooks/useLayer';

export const ModuleNode = ({
  id,

  layoutChildren,
  toggleHideEdges,
  createMissingImport,
  toggleChildren,
}) => {
  //const data = props.data;

  const [settings, setSettings] = useState([]);
  const { flatFiles, rootPath, loadFileSystem } = useFileSystem();
  const { getNodeById, toggleHideImmediateChildren, onModuleClose } =
    useLayer();
  const editorRef = useRef(null);

  const node = getNodeById(id);
  if (!node) {
    console.error('could not find node with id', id);
    return null;
  }

  const data = node.data;

  // Toggle button state
  const handleToggle = (event, newSettings) => {
    setSettings((oldSettings) => {
      toggleHideEdges(id, newSettings.showEdges);
      return newSettings;
    });
  };

  const getImportHandles = (handle) => {
    if (Object.keys(flatFiles).length === 0) {
      return null;
    }

    if (
      handle.data.fullPath === false ||
      findFileForImport(flatFiles, handle.data.fullPath)
    ) {
      return (
        <Handle
          key={handle.key}
          type="source"
          position={'right'}
          id={handle.id}
          style={{ ...handle.style }}
        >
          <div style={handleTextStyle}>{handle.data.name}</div>
        </Handle>
      );
    }

    return (
      <button
        onClick={() => {
          createMissingImport(data.moduleId, handle.data.fullPath);
        }}
        key={handle.key}
        style={{
          position: 'absolute',
          display: 'inline-flex', // Ensures it wraps around its content
          justifyContent: 'center', // Centers content horizontally
          alignItems: 'center', // Centers content vertically
          color: 'red',
          fontSize: '10px',
          backgroundColor: 'black',
          border: '1px solid red',
          padding: '2px 4px', // Add padding for spacing around the text
          boxSizing: 'border-box',
          borderRadius: '4px',
          textAlign: 'center',
          top: handle.style.top,
          right: handle.style.right,
          transform: 'translate(50%, 0)', // Center the text horizontally
        }}
      >
        {handle.data.name}
      </button>
    );
  };

  const allHandles = data?.handles.map((handle, index) => {
    if (handle.refType === 'import') {
      return getImportHandles(handle);
    }

    return (
      <Handle
        key={handle.key}
        type="source"
        position={'right'}
        id={handle.id}
        style={{ ...handle.style }}
      >
        <div style={handleTextStyle}>{handle.data.name}</div>
      </Handle>
    );
  });

  const toggleHidden = () => {
    toggleHideImmediateChildren(data.moduleId);
  };

  const toggleChildrenInternal = (value, value2) => {
    toggleChildren(flatFiles, data.moduleId, data.showChildren);
  };

  const layoutChildrenInternal = () => {
    console.log('layout children with ', data.moduleId);
    layoutChildren(data.moduleId);
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <div
        className="text-updater-node"
        style={{ background: '#121212', padding: '16px', borderRadius: '8px' }}
      >
        <div className="pip-container">
          <Pip
            onClick={() => onModuleClose(data.moduleId)}
            targetTooltip="saved-tooltip"
            tooltipContent={'close'}
            status="error"
          />
        </div>
        <TopBar
          showRaw={data.showRaw}
          toggleHidden={toggleHidden}
          settings={settings}
          handleToggle={handleToggle}
          toggleChildren={toggleChildrenInternal}
          showChildren={data.showChildren}
          layoutChildren={layoutChildrenInternal}
        />
        {data.showRaw && (
          <div className="editor-container">
            <Editor
              className="editor nodrag"
              height="100%"
              width="100%"
              defaultLanguage={'javascript'}
              automaticLayout="true"
              value={data.raw}
              options={{
                fontSize: 10,
                lineNumbersMinChars: 2,
                automaticLayout: true,
                scrollBeyondLastLine: false,
                minimap: {
                  enabled: false,
                },
                lineNumbers: 'off',
              }}
              theme="vs-dark"
              onMount={(editor) => {
                editorRef.current = editor;
              }}
            />
          </div>
        )}
      </div>
      <Handle type="source" position={'left'} id={id + '-handle'} />
      {allHandles}
    </ThemeProvider>
  );
};
