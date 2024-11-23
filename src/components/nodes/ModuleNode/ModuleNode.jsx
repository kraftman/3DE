import React, { useRef } from 'react';
import { NodeResizer, Handle } from 'reactflow';
import { createTheme, ThemeProvider } from '@mui/material/styles';

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
  return (
    <ThemeProvider theme={darkTheme}>
      <NodeResizer
        minWidth={300}
        minHeight={300}
        style={{ background: 'none' }}
      />

      <div
        className="text-updater-node"
        style={{ background: '#121212', padding: '16px', borderRadius: '8px' }}
      ></div>
      {importHandles}
    </ThemeProvider>
  );
};
