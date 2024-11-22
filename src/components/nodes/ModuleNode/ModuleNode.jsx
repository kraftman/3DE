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
  console.log('mmodule props', props);
  const data = props.data;
  const editorRef = useRef(null);
  console.log('data content', data.content);

  const importHandles = data.imports.map((imp, index) => {
    return (
      <div key={imp.name} style={handleWrapper}>
        <Handle
          key={imp.name + ':out'}
          type="source"
          position={'right'}
          id={imp.name + ':out'}
          style={{
            top: 100 + 30 * index,
            right: -100,
          }}
        >
          <div style={handleTextStyle}>{imp.name}</div>
        </Handle>
      </div>
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
