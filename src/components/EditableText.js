import React, { useState } from 'react';
import { TextField, Tooltip } from '@mui/material';

export const EditableText = ({
  onFinishEditing,
  text,
  onChange,
  error,
  placeholder,
}) => {
  const [isEditing, setIsEditing] = useState(false);

  const handleDoubleClick = () => {
    setIsEditing(true);
  };

  const handleChange = (e) => {
    onChange(e.target.value);
  };

  const handleBlur = () => {
    setIsEditing(false);
    onFinishEditing();
  };

  return (
    <div>
      {isEditing ? (
        <Tooltip title={error || ''} open={Boolean(error)} arrow>
          <TextField
            value={text}
            onChange={handleChange}
            onBlur={handleBlur}
            autoFocus
            variant="outlined"
            size="small"
            error={Boolean(error)}
            InputProps={{
              style: {
                fontSize: '12px', 
                height: '30px', 
                color: 'white',
                background: 'transparent',
                width: `${text.length}ch`
              },
            }}
            style={{
              borderColor: error ? 'red' : undefined,
            }}
          />
        </Tooltip>
      ) : (
        <div style={{ fontSize: '12px', height: '30px', display: 'flex', alignItems: 'center', color: 'white' }} onDoubleClick={handleDoubleClick}>
          {placeholder || text}
        </div>
      )}
    </div>
  );
};
