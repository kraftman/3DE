import React, { useRef } from 'react';
import { NodeResizer } from 'reactflow';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import Editor from '@monaco-editor/react';
import { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { EditableText } from '../../EditableText';

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

export const ModuleNode = ({ data }) => {
  const editorRef = useRef(null);
  console.log('data content', data.content);
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
      >
        {/* <div className="editor-container">
          <Editor
            className="editor nodrag"
            height="100%"
            width="100%"
            defaultLanguage={'javascript'}
            automaticLayout="true"
            value={data.content}
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
        </div> */}
      </div>
    </ThemeProvider>
  );
};
