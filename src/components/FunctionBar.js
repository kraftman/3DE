import React, { useState } from 'react';
import { useLayer } from '../hooks/useLayer';
import './FunctionBar.css'; // Import the CSS file
import { EditableText } from './EditableText';

import { generateFunctionSignature } from '../utils/astUtils';
import { parseWithRecast } from '../utils/parseWithRecast';

export const FunctionBar = ({ fullPath, funcInfo }) => {
  const { onFunctionSignatureChange } = useLayer((store) => ({
    onFunctionSignatureChange: store.onFunctionSignatureChange,
  }));

  const functionSignature = generateFunctionSignature(funcInfo);
  const [text, setText] = useState(functionSignature);

  const onFinish = () => {
    console.log('parsing text', text);
    const ast = parseWithRecast('function ' + text + ' {}');
    if (ast) {
      return onFunctionSignatureChange(fullPath, funcInfo.id, ast);
    }
    console.error('Failed to parse function signature for text:', text);
  };

  const onChange = (newText) => {
    setText(newText);
  };

  return (
    <div className="function-bar">
      <div className="editable-container">
        <EditableText
          text={text}
          onChange={onChange}
          onFinishEditing={onFinish}
        />
      </div>
    </div>
  );
};
