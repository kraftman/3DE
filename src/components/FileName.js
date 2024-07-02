import React, { useState } from 'react';
export const FileName = ({ onFileNameChange, startValue }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(startValue);

  const handleSpanClick = () => {
    setIsEditing(true);
  };

  const handleInputChange = (e) => {
    setValue(e.target.value);
  };

  const handleConfirm = () => {
    setIsEditing(false);
    onFileNameChange(value);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleConfirm();
    }
  };

  return (
    <div>
      {isEditing ? (
        <div className="editable-container">
          <input
            type="text"
            value={value}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            autoFocus
            className="editable-input"
            spellCheck="false"
          />
          <button onClick={handleConfirm} className="editable-button">
            ✓
          </button>
        </div>
      ) : (
        <span onClick={handleSpanClick} className="editable-span">
          {value}
        </span>
      )}
    </div>
  );
};
