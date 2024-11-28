import React from 'react';
import Button from '@mui/material/Button';
import { selectFolder, loadFolderTree } from '../electronHelpers';

export const FolderSelectButton = ({ onFolderSelected }) => {
  const handleButtonClick = async () => {
    const folder = await selectFolder();
    onFolderSelected(folder);
  };

  return (
    <Button variant="contained" color="primary" onClick={handleButtonClick}>
      Select Folder
    </Button>
  );
};
