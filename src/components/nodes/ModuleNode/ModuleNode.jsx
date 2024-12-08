import React, { useRef, useState } from 'react';
import { Handle } from '@xyflow/react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { Pip } from '../../Pip';
import { ToggleButton } from '@mui/material';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import { loader } from '@monaco-editor/react';
import Editor from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { findFileForImport } from '../../../utils/fileUtils';
import { TopBar } from './TopBar';
import { EditableText } from '../../EditableText';
import { RootCode } from './RootCode';

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
import { useNodeManager } from '../../../hooks/useNodeManager';
import { useFileManager } from '../../../hooks/useFileManager';

export const ModuleNode = ({ id }) => {
  //const data = props.data;

  const [settings, setSettings] = useState([]);
  const {
    onModuleClose,
    layoutNodes,
    toggleChildren,
    toggleHideEdges,
    onRootNodeTextChange,
  } = useLayer();
  const {
    getNodeById,
    toggleShowRawCode,
    createMissingImport,
    toggleCollapseModule,
    toggleChildModule,
    renameModule,
  } = useNodeManager();
  const { flatFiles } = useFileManager();
  const editorRef = useRef(null);

  const node = getNodeById(id);
  const [fileName, setFileName] = useState(node?.data?.fullPath);

  const [fileNameError, setFileNameError] = useState(false);

  // ===================================================================
  // ===== ALL HOOKS NEED TO BE ABOVE THIS LINE ========================
  // ===================================================================

  if (!node) {
    console.error('could not find node with id', id);
    return null;
  }

  const data = node.data;

  // Toggle button state
  const toggleHideEdgesInternal = (event, newSettings) => {
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
      const isExternal = handle.data.fullPath === false;
      return (
        <div key={handle.key}>
          <Handle
            key={handle.key}
            type="source"
            position={'right'}
            id={handle.id}
            style={{ ...handle.style }}
          ></Handle>
          <button
            disabled={isExternal}
            onClick={() => {
              console.log('handle clic k', handle);
              toggleChildModule(data.moduleId, handle.data.fullPath);
            }}
            key={handle.key + 'button'}
            style={{
              position: 'absolute',
              display: 'inline-flex', // Ensures it wraps around its content
              justifyContent: 'center', // Centers content horizontally
              alignItems: 'center', // Centers content vertically
              color: isExternal ? 'grey' : 'white',
              fontSize: '10px',
              backgroundColor: 'black',
              border: '1px solid white',
              padding: '2px 4px', // Add padding for spacing around the text
              boxSizing: 'border-box',
              borderRadius: '4px',
              textAlign: 'center',
              top: handle.style.top + 5,
              right: handle.style.right,
              transform: 'translate(50%, 0)', // Center the text horizontally
            }}
          >
            {handle.data.name}
          </button>
        </div>
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
        <button style={handleTextStyle}>{handle.data.name}</button>
      </Handle>
    );
  });

  const toggleShowRawCodeInternal = () => {
    toggleShowRawCode(data.moduleId);
  };

  const toggleChildrenInternal = (value, value2) => {
    toggleChildren(flatFiles, data.moduleId, data.showChildren);
  };

  const layoutChildrenInternal = () => {
    console.log('layout children with ', data.moduleId);
    layoutNodes(data.moduleId);
  };

  const toggleExpandModuleInternal = () => {
    toggleCollapseModule(data.moduleId, data.isCollapsed);
  };

  const isCollapsed = data.isCollapsed;

  const ToggleExpand = () => {
    return (
      <ToggleButton
        value="check"
        aria-label="justified"
        selected={data.isCollapsed}
        onChange={toggleExpandModuleInternal}
      >
        {data.isCollapsed ? (
          <ExpandLessIcon fontSize="small" />
        ) : (
          <ExpandMoreIcon fontSize="small" />
        )}
      </ToggleButton>
    );
  };

  const onFileNameChange = (value) => {
    if (flatFiles[value]) {
      setFileNameError('file exists');
    } else {
      setFileNameError(false);
    }

    setFileName(value);
  };

  const onFinishEditing = () => {
    if (fileNameError) {
      setFileName(data.fullPath);
      return;
    }
    renameModule(data.moduleId, fileName);
  };

  const onRootCodeChangeInternal = (newCode) => {
    onRootNodeTextChange(data.fullPath, newCode);
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
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <EditableText
            onFinishEditing={onFinishEditing}
            text={fileName}
            onChange={onFileNameChange}
            error={fileNameError}
          />
          {!isCollapsed && (
            <TopBar
              showRaw={data.showRaw}
              toggleShowRawCode={toggleShowRawCodeInternal}
              settings={settings}
              handleToggle={toggleHideEdgesInternal}
              toggleChildren={toggleChildrenInternal}
              showChildren={data.showChildren}
              layoutChildren={layoutChildrenInternal}
            />
          )}
          <ToggleExpand />
        </div>
        <RootCode content={data.rootCode} onChange={onRootCodeChangeInternal} />

        {data.showRaw && !isCollapsed && (
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
