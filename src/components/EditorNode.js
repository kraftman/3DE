import React from 'react';
import { useCallback } from 'react';
import { Handle, Position, NodeToolbar } from 'reactflow';
import { loader } from '@monaco-editor/react';
import Editor from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
loader.config({ monaco });

const handleStyle = { left: 10 };

export const EditorNode = ({ data, onTextChange }) => {
  const onChange = (value) => {
    onTextChange(data.id, value);
  };

  return (
    <>
      <Handle type="target" position={Position.Top} />
      <div className="text-updater-node">
        <NodeToolbar
          className="node-toolbar"
          isVisible={true}
          position={{ x: 0, y: 0 }}
        >
          <button>📝</button>
          <button>✅</button>
        </NodeToolbar>
        <Editor
          className="nodrag"
          onChange={onChange}
          height="100%"
          width="100%"
          defaultLanguage="javascript"
          automaticLayout="true"
          value={data.value}
          options={{
            fontSize: 12,
            lineNumbersMinChars: 2,
            minimap: {
              enabled: false, // Disable the minimap
            },
          }}
          theme="vs-dark" // Assuming you are using Monaco Editor
        />
      </div>
      <Handle type="source" position={Position.Bottom} id="a" />
    </>
  );
};
