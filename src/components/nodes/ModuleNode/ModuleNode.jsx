import React, { useRef } from 'react';
import { NodeResizer, Handle } from '@xyflow/react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { Pip } from '../../Pip';

import { loader } from '@monaco-editor/react';
import Editor from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import CodeIcon from '@mui/icons-material/Code';
import CommitIcon from '@mui/icons-material/Commit';
import ReadMoreIcon from '@mui/icons-material/ReadMore';

import { useState } from 'react';
import { IconButton, ToggleButton, ToggleButtonGroup } from '@mui/material';
import PolylineIcon from '@mui/icons-material/Polyline';

import { useFileSystem } from '../../../contexts/FileSystemContext';

import { TopBar } from './TopBar';

loader.config({ monaco });

const handleTextStyle = {
  position: 'relative',
  transform: 'translate(10px, -10px)',
  fontSize: '12px',
  pointerEvents: 'none',
  color: 'white',
  display: 'inline-block', // Ensures the width matches the text content
  border: '1px solid white', // Adds the border
  padding: '2px 4px', // Adds padding to make the border look better
  boxSizing: 'border-box', // Ensures padding doesn't increase the element size
  borderRadius: '4px',
};

const handleWrapper = {};

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

export const ModuleNode = (props) => {
  const data = props.data;

  const [settings, setSettings] = useState([]);
  const { flatFiles, rootPath, loadFileSystem } = useFileSystem();

  // Toggle button state
  const handleToggle = (event, newSettings) => {
    setSettings((oldSettings) => {
      props.toggleHideEdges(props.id, newSettings.showEdges);

      return newSettings;
    });
  };

  const editorRef = useRef(null);
  const importHandles = data.handles.map((handle, index) => {
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
    props.toggleHideChildren(props.data.moduleId);
  };

  const toggleChildren = (value, value2) => {
    props.toggleChildren(
      flatFiles,
      props.data.moduleId,
      props.data.showChildren
    );
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <div
        className="text-updater-node"
        style={{ background: '#121212', padding: '16px', borderRadius: '8px' }}
      >
        <div className="pip-container">
          <Pip
            onClick={() => props.onClose(data.moduleId)}
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
          toggleChildren={toggleChildren}
          showChildren={data.showChildren}
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
      {importHandles}
    </ThemeProvider>
  );
};
