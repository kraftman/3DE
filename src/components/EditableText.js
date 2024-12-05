import React, { useState } from 'react';
import { TextField, Tooltip } from '@mui/material';

export const EditableText = ({ onFinishEditing, text, onChange, error }) => {
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
                fontSize: '12px', // Smaller font size
                height: '30px', // Smaller height
                padding: '5px', // Smaller padding
                color: 'white',
                background: 'transparent',
              },
            }}
            style={{
              borderColor: error ? 'red' : undefined,
              width: '150px', // Adjust width to make it more compact
            }}
          />
        </Tooltip>
      ) : (
        <div
          style={{
            color: '#e0e0e0',
            cursor: 'pointer',
            fontSize: '12px',
          }}
          onDoubleClick={handleDoubleClick}
        >
          {text}
        </div>
      )}
    </div>
  );
};
