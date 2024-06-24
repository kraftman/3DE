import React from 'react';
import Button from '@mui/material/Button';
import { selectFolder, loadFolderTree } from '../electronHelpers';

const FolderSelectorButton = ({ onFolderSelected }) => {
  const handleButtonClick = async () => {
    const folder = await selectFolder();
    const tree = await loadFolderTree(folder);
    onFolderSelected(tree);
  };

  return (
    <Button variant="contained" color="primary" onClick={handleButtonClick}>
      Select Folder
    </Button>
  );
};

export default FolderSelectorButton;
