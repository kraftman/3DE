import React, { useRef, useState } from 'react';
import { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { EditableText } from '../../EditableText';
import { useLayer } from '../../../hooks/useLayer';
import { useNodeManager } from '../../../hooks/useNodeManager';

loader.config({ monaco });

export const PureFunctionNode = ({ id }) => {
  const editorRef = useRef(null);

  const { onfunctionTitledChanged } = useLayer();
  const { getNodeById } = useNodeManager();

  const node = getNodeById(id);

  const [functionName, setFunctionName] = useState(
    node?.data?.functionName || ''
  );
  if (!node) {
    console.error('could not find node with id', id);
    return null;
  }

  const data = node.data;

  const text = data.content || '<no root content> ';

  const onTitleChange = (value) => {
    // this needs to eventually check for name conflicts and prevent them
    //onfunctionTitledChanged(data.functionId, value);
    //onFinishEditing()
    setFunctionName(value);
  };

  const onfunctionTitledChangedInternal = () => {
    onfunctionTitledChanged(data.functionId, functionName);
  };

  return (
    <>
      {/* {renderedHandles} */}
      <div className="text-updater-node" style={{ border: '2px solid black' }}>
        <EditableText
          text={functionName}
          onChange={onTitleChange}
          onFinishEditing={onfunctionTitledChangedInternal}
        />
        {/* <div className="editor-container">
          <Editor
            className="editor nodrag"
            onChange={onChange}
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
    </>
  );
};
