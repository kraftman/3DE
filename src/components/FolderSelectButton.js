import React from 'react';
import Button from '@mui/material/Button';

const FolderSelectorButton = ({ onFolderSelected }) => {
  const handleButtonClick = () => {
    window.electronAPI.sendToMain('select-folder', 'nothign');
  };

  window.electronAPI.receiveFromMain('select-folder', (response) => {
    onFolderSelected(response);
  });

  return (
    <Button variant="contained" color="primary" onClick={handleButtonClick}>
      Select Folder
    </Button>
  );
};

export default FolderSelectorButton;
