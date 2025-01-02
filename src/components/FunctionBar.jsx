import React, { useState } from 'react';
import { useLayer } from '../hooks/useLayer';
import './FunctionBar.css'; // Import the CSS file
import { EditableText } from './EditableText';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';

import { generateFunctionSignature } from '../utils/astUtils';
import { parseWithRecast } from '../utils/parseWithRecast';

export const FunctionBar = ({ fullPath, funcInfo }) => {
  const { onFunctionSignatureChange, onFunctionDelete } = useLayer((store) => ({
    onFunctionSignatureChange: store.onFunctionSignatureChange,
    onFunctionDelete: store.onFunctionDelete,
  }));

  const functionSignature = funcInfo ? generateFunctionSignature(funcInfo) : '';
  const [text, setText] = useState(functionSignature);

  React.useEffect(() => {
    setText(functionSignature);
  }, [functionSignature]);

  const onFinish = () => {
    const ast = parseWithRecast('function ' + text + ' {}');
    if (ast) {
      return onFunctionSignatureChange(fullPath, funcInfo.id, ast);
    }
    console.error('Failed to parse function signature for text:', text);
  };

  const onChange = (newText) => {
    setText(newText);
  };

  const handleDelete = () => {
    onFunctionDelete(fullPath, funcInfo.id);
  };

  return (
    <div className="function-bar">
      <div className="editable-container">
        <EditableText
          text={text}
          onChange={onChange}
          onFinishEditing={onFinish}
        />
        <IconButton size="small" onClick={handleDelete}>
          <DeleteIcon fontSize="small" />
        </IconButton>
      </div>
    </div>
  );
};
