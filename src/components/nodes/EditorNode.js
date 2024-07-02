import React from 'react';
import { useCallback, useRef, useState, useEffect } from 'react';
import { Handle, Position, NodeToolbar } from 'reactflow';
import { loader } from '@monaco-editor/react';
import Editor from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { EDITOR } from '../../constants';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import { Pip } from '../Pip';
import { useDebouncedCallback } from 'use-debounce';
import { FileName } from '../FileName';

import { getDecorators, detectLanguage } from '../editorUtils';

import { useFileSystem } from '../../contexts/FileSystemContext';

import 'react-tooltip/dist/react-tooltip.css';

import { ThemeProvider, createTheme } from '@mui/material/styles';
loader.config({ monaco });

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
  const [verticalScroll, setVerticalScroll] = useState(0);

  const { flatFiles, rootPath, loadFileSystem } = useFileSystem();
  const text = flatFiles[data.fullPath]?.fileData;
  const savedText = flatFiles[data.fullPath]?.savedData;
  const fileName = flatFiles[data.fullPath]?.data;
  const isSaved = text === savedText;

  useEffect(() => {
    onTextChange(id, text);
  }, []);

  //TODOO split apart saving and updating the saved data
  // so that debounce only applies to saving/formatting
  const debouncedOnChange = useDebouncedCallback((newText) => {
    onTextChange(id, newText);
    addDecorators();
  }, 1);

  const onChange = (newText) => {
    //onTextChange(id, newText);
    debouncedOnChange(newText);
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
    editor.onDidScrollChange((e) => {
      setVerticalScroll(editor.getScrollTop());
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

  const renderedHandles = data?.handles?.map((handle) => {
    const newTop = handle.style.top - verticalScroll;
    if (newTop < 40 || newTop > data.height) {
      return null;
    }
    return (
      <Handle
        key={handle.id}
        type={handle.type}
        position={handle.position}
        id={handle.id}
        style={{ ...handle.style, top: newTop }}
      />
    );
  });

  const onNameUpdated = (newName) => {
    onFileNameChange(id, data.fullPath, newName);
  };

  return (
    <>
      {renderedHandles}
      <div className="text-updater-node">
        <FileName
          key={fileName}
          startValue={fileName}
          onFileNameChange={onNameUpdated}
        />
        <div className="pip-container">
          <Pip
            targetTooltip="saved-tooltip"
            tooltipContent={isSaved ? 'Saved' : 'Unsaved changes'}
            status={isSaved ? 'pass' : 'warn'}
          />

          <Pip
            onClick={() => onClose(id)}
            targetTooltip="saved-tooltip"
            tooltipContent={'close'}
            status="error"
          />

          {/* <Pip status="warn" />
          <Pip status="error" />
          <Pip status="pass" /> */}
        </div>

        <div className="editor-container">
          <Editor
            className="editor nodrag"
            onChange={onChange}
            height="90%"
            width="100%"
            defaultLanguage={detectLanguage(fileName)}
            automaticLayout="true"
            value={text}
            options={{
              fontSize: EDITOR.FONT_SIZE,
              lineNumbersMinChars: 2,
              automaticLayout: true,
              scrollBeyondLastLine: false,
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
