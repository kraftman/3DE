import React, { useRef, useState } from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';

import { loader } from '@monaco-editor/react';
import Editor from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { TitleBar } from './TitleBar';
import Markdown from 'react-markdown';

loader.config({ monaco });

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

export const MarkdownNode = ({ data }) => {
  const editorRef = useRef(null);

  const [view, setView] = useState('raw');

  const handleViewChange = (event, newView) => {
    if (newView !== null) {
      setView(newView);
    }
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <div
        className="text-updater-node"
        style={{ background: '#121212', padding: '16px', borderRadius: '8px' }}
      >
        <TitleBar view={view} handleViewChange={handleViewChange} />
        <div className="editor-container">
          {['raw', 'both'].includes(view) ? (
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
          ) : null}
          {['both', 'formatted'].includes(view) ? (
            <Markdown>{data.content}</Markdown>
          ) : null}
        </div>
      </div>
    </ThemeProvider>
  );
};
