import React, { useState } from 'react';

export const EditableText = ({ text, onChange }) => {
  const [isEditing, setIsEditing] = useState(false);

  const handleDoubleClick = () => {
    setIsEditing(true);
  };

  const handleChange = (e) => {
    onChange(e.target.value);
  };

  const handleBlur = () => {
    setIsEditing(false);
  };

  return (
    <div>
      {isEditing ? (
        <input
          type="text"
          value={text}
          onChange={handleChange}
          onBlur={handleBlur}
          autoFocus
          style={{
            color: 'white',
            background: 'transparent',
            border: 'none',
            outline: 'none',
          }}
        />
      ) : (
        <div
          className="function-node-header-text"
          style={{ color: '#e0e0e0', cursor: 'pointer', fontSize: '12px' }}
          onDoubleClick={handleDoubleClick}
        >
          {text}
        </div>
      )}
    </div>
  );
};
