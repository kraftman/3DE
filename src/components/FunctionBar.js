import React, { useState } from 'react';
import { EditableText } from './EditableText';
import { useLayer } from '../hooks/useLayer';
import { IconButton } from '@mui/material';
import Box from '@mui/material/Box';
import SettingsIcon from '@mui/icons-material/Settings';
import './FunctionBar.css'; // Import the CSS file
import { FunctionEditor } from './FunctionEditor/FunctionEditor';

import Modal from '@mui/material/Modal';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
};

export const FunctionBar = ({ funcInfo }) => {
  const [open, setOpen] = React.useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  console.log('FunctionBar:', funcInfo);

  const [functionName, setFunctionName] = useState(funcInfo?.name || '');

  const handleSettingsClick = () => {
    console.log('Settings clicked for:', funcInfo);
    // Add your settings logic here
  };

  const FunctionArgs = funcInfo.parameters.map((param) => (
    <div className="editable-container" key={param}>
      <span>{param}</span>
    </div>
  ));

  return (
    <div className="function-bar">
      <div className="editable-container">
        <span>{functionName}</span>
      </div>
      <div className="args-container">{FunctionArgs}</div>
      <button onClick={handleOpen} className="settings-button">
        <SettingsIcon fontSize="small" />
      </button>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <FunctionEditor initialFuncInfo={funcInfo} />
        </Box>
      </Modal>
    </div>
  );
};
