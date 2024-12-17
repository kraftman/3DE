import React from 'react';

import { Handle } from '@xyflow/react';
import { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';

import 'react-tooltip/dist/react-tooltip.css';
import { FunctionEditor } from '../../FunctionEditor';

loader.config({ monaco });

const codeNodeStyle = {
  width: '100%',
  height: '100%',
  paddingTop: '15px',
  borderRadius: '5px',
  backgroundColor: 'black',
  boxShadow: '0 0 10px rgba(0, 0, 0, 0.5)',
};

export const CodeNode = ({ id, data }) => {
  const newHandles = data.handles?.map((handle, index) => {
    return (
      <Handle
        key={handle.key}
        type={handle.type}
        position={handle.position}
        id={handle.id}
        style={{ ...handle.style }}
      >
        <div
          style={{ color: 'white', pointerEvents: 'none', fontSize: '10px' }}
        >
          {handle.data.name}
        </div>
      </Handle>
    );
  });

  return (
    <>
      <div style={{ ...codeNodeStyle }}>
        {newHandles}

        <FunctionEditor fullPath={data.fullPath} functionId={data.functionId} />
      </div>
    </>
  );
};
