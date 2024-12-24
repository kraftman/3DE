import React, { useRef, useState, useMemo } from 'react';
import { Handle } from '@xyflow/react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { Pip } from '../../Pip';
import { ToggleButton } from '@mui/material';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import { loader } from '@monaco-editor/react';
import Editor from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { TopBar } from './TopBar';
import { EditableText } from '../../EditableText';
import { RootCode } from './RootCode';

import { useLayer } from '../../../hooks/useLayer';
import { useNodeManager } from '../../../hooks/useNodeManager';
import { useFileSystem } from '../../../stores/useFileSystem';
import * as recast from 'recast';

import { useShallow } from 'zustand/react/shallow';
import { FunctionEditor } from '../../FunctionEditor';
import { useLayout } from '../../../hooks/useLayout';
import { getFileNameFromPath } from '../../../utils/fileUtils';
import { ImportManager } from './ImportManager';

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

export const ModuleNode = React.memo(({ id, data }) => {
  const [settings, setSettings] = useState([]);
  const {
    onModuleClose,
    toggleShowChildModules,
    toggleHideEdges,
    onRootNodeTextChange,
  } = useLayer();
  const { toggleShowRawCode, toggleCollapseModule, renameModule } =
    useNodeManager();
  const editorRef = useRef(null);
  const flatFiles = useFileSystem(useShallow((state) => state.flatFiles));

  const [fileName, setFileName] = useState(data?.fullPath);
  const [fileNameError, setFileNameError] = useState(false);
  const { layoutNodes } = useLayout((state) => state.layoutNodes);

  const rootCodeAst = useFileSystem(
    useShallow((state) => {
      //console.log('getting root code for ', data?.fullPath);
      return state.flatFiles[data?.fullPath]?.rootCode;
    })
  );

  const fileInfo = useFileSystem((state) => {
    return state.flatFiles[data?.fullPath];
  });

  const hasMultipleFunctions = fileInfo && fileInfo.functions.length > 1;

  const firstChild = fileInfo && fileInfo.functions[0];
  const rootContent = useMemo(() => {
    const lines = [];
    if (rootCodeAst) {
      console.log('rootCodeAst in mod', rootCodeAst);
      const converted = Array.from(rootCodeAst);
      for (let rootCode of converted) {
        lines.push(
          recast.print(rootCode.path.node, { reuseWhitespace: true }).code
        );
      }
    }
    return lines.join('\n');
  }, [rootCodeAst]);

  console.log('re-rendering module node', data.moduleId);
  const toggleHideEdgesInternal = (event, newSettings) => {
    setSettings((oldSettings) => {
      toggleHideEdges(id, newSettings.showEdges);
      return newSettings;
    });
  };

  //test
  const toggleShowRawCodeInternal = () => {
    toggleShowRawCode(id);
  };

  const toggleChildrenInternal = (value, value2) => {
    toggleShowChildModules(id);
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
        sx={{
          minWidth: '30px', // Reduce button size
          height: '30px', // Reduce height
          padding: 0, // Remove extra padding
        }}
      >
        {data.isCollapsed ? (
          <ExpandLessIcon fontSize="inherit" /> // Use "inherit" to scale with button siz
        ) : (
          <ExpandMoreIcon fontSize="inherit" />
        )}
      </ToggleButton>
    );
  };

  const onFileNameChange = (value) => {
    // TODO use makeSafeFilename here to safely rename the file
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
        style={{ background: '#121212', padding: '2px', borderRadius: '8px' }}
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
            placeholder={getFileNameFromPath(fileName)}
            onChange={onFileNameChange}
            error={fileNameError}
          />

          <TopBar
            showRaw={data.showRaw}
            toggleShowRawCode={toggleShowRawCodeInternal}
            settings={settings}
            handleToggle={toggleHideEdgesInternal}
            toggleChildren={toggleChildrenInternal}
            showChildren={data.showChildren}
            isCollapsed={isCollapsed}
          />

          <ToggleExpand />
        </div>
        {!isCollapsed && (
          <>
            <RootCode
              content={rootContent}
              onChange={onRootCodeChangeInternal}
            />
            {!hasMultipleFunctions && firstChild && !data.showRaw && (
              <FunctionEditor
                fullPath={data.fullPath}
                functionId={firstChild.id}
              />
            )}

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
          </>
        )}
      </div>

      <Handle type="source" position={'left'} id={id + '-handle'} />
      <ImportManager data={data} flatFiles={flatFiles} />
    </ThemeProvider>
  );
});

ModuleNode.displayName = 'ModuleNode';
