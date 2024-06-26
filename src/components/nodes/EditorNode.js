import React from 'react';
import { useCallback, useRef, useState, useEffect } from 'react';
import { Handle, Position, NodeToolbar } from 'reactflow';
import { loader } from '@monaco-editor/react';
import Editor from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';

import { getDecorators } from '../editorUtils';

import { useFileSystem } from '../../contexts/FileSystemContext';

import { ThemeProvider, createTheme } from '@mui/material/styles';
loader.config({ monaco });

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

export const EditorNode = ({
  id,
  data,
  onTextChange,
  onFileNameChange,
  onSelectionChange,
  onClose,
}) => {
  const editorRef = useRef(null);
  const [decorations, setDecorations] = useState([]);

  const { flatFiles, rootPath, loadFileSystem } = useFileSystem();
  const text = flatFiles[data.fullPath]?.fileData;

  const onChange = (newText) => {
    onTextChange(id, newText);
    addDecorators();
  };

  const checkIfTextIsSelected = () => {
    const editor = editorRef.current;
    const selection = editor.getSelection();
    if (selection.isEmpty()) {
      onSelectionChange(id, null);
    } else {
      onSelectionChange(id, selection);
    }
  };

  const addListeners = () => {
    const editor = editorRef.current;
    editor.onDidChangeCursorSelection((e) => {
      checkIfTextIsSelected();
    });
  };

  const addDecorators = () => {
    const editor = editorRef.current;
    const model = editor.getModel();
    const text = model.getValue();

    const newDecorations = getDecorators(text);

    const newDecorationIds = editor.deltaDecorations(
      decorations,
      newDecorations
    );
    setDecorations(newDecorationIds);
  };

  const renderedHandles = data?.handles?.map((handle) => (
    <Handle
      key={handle.id}
      type={handle.type}
      position={handle.position}
      id={handle.id}
      style={handle.style}
    />
  ));

  return (
    <>
      {renderedHandles}
      <div className="text-updater-node">
        <ThemeProvider theme={darkTheme}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <TextField
              size="small"
              variant="outlined"
              value={data.fileName}
              onChange={(event) => onFileNameChange(id, event.target.value)}
            />
            <IconButton aria-label="delete" onClick={() => onClose(id)}>
              <CloseIcon />
            </IconButton>
          </div>
        </ThemeProvider>
        <div className="editor-container">
          <Editor
            className="editor nodrag"
            onChange={onChange}
            height="100%"
            width="100%"
            defaultLanguage="javascript"
            automaticLayout="true"
            value={text}
            options={{
              fontSize: 8,
              lineNumbersMinChars: 2,
              minimap: {
                enabled: false,
              },
            }}
            theme="vs-dark"
            onMount={(editor) => {
              editorRef.current = editor;
              addDecorators();
              addListeners();
            }}
          />
        </div>
      </div>
    </>
  );
};
