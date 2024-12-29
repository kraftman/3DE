import React, { useState } from 'react';
import {
  Modal,
  Box,
  Typography,
  TextField,
  List,
  ListItem,
  ListItemText,
  Button,
  Divider,
} from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { useFileSystem } from '../../../stores/useFileSystem';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      paper: '#121212', // Darker background for modal
      default: '#1e1e1e', // Slightly lighter background for contrast
    },
    text: {
      primary: '#ffffff', // White text for high contrast
      secondary: '#b0b0b0', // Light grey for secondary text
    },
  },
});

export const AddImportModal = ({ open, onClose }) => {
  const flatFiles = useFileSystem((state) => state.flatFiles);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [selectedExports, setSelectedExports] = useState([]);

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleFileSelect = (file) => {
    console.log('file selected', file);
    setSelectedFile(file);
  };

  const handleExportSelect = (myExport) => {
    console.log('export selected', myExport);
    console.log('selected file index', selectedFile.index);

    setSelectedExports((prev) => [
      ...prev,
      {
        ...myExport,
        path: selectedFile.index,
      },
    ]);
  };

  const ExportPreview = ({ export: myExport }) => {
    if (!myExport) {
      return '';
    }
    return (
      <>
        <span
          style={{ color: '#569cd6' }}
        >{`${myExport.name} from ${myExport.path}`}</span>
      </>
    );
  };

  const ExportPreviews = selectedExports.map((myExport) => (
    <ExportPreview key={myExport.name} export={myExport} />
  ));

  const ListItems = [];

  for (const [key, value] of Object.entries(flatFiles)) {
    if (!value.exports || value.exports.length === 0) {
      continue;
    }
    if (key.includes(searchTerm)) {
      ListItems.push(
        <ListItem button key={key} onClick={() => handleFileSelect(value)}>
          <ListItemText
            primary={key}
            primaryTypographyProps={{ color: 'text.primary' }} // Ensures text is white
          />
        </ListItem>
      );
    }
  }

  return (
    <ThemeProvider theme={darkTheme}>
      <Modal open={open} onClose={onClose}>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 1000,
            bgcolor: 'background.paper',
            boxShadow: 24,
            p: 4,
            borderRadius: 2,
          }}
        >
          <Typography
            variant="h6"
            component="h2"
            gutterBottom
            color="text.primary"
          >
            Add New Import
          </Typography>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search for files or exports"
            value={searchTerm}
            onChange={handleSearch}
            sx={{ mb: 2 }}
          />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Box sx={{ width: '50%', maxHeight: 300, overflowY: 'auto' }}>
              <Typography variant="subtitle1" color="text.primary">
                Files
              </Typography>
              <List>{ListItems}</List>
            </Box>
            <Box sx={{ width: '50%', maxHeight: 300, overflowY: 'auto' }}>
              <Typography variant="subtitle1" color="text.primary">
                Exports
              </Typography>
              <List>
                {selectedFile?.exports.map((myExport) => (
                  <ListItem
                    button
                    key={myExport.name}
                    onClick={() => handleExportSelect(myExport)}
                  >
                    <ListItemText
                      primary={myExport.name}
                      primaryTypographyProps={{ color: 'text.primary' }}
                    />
                  </ListItem>
                )) || (
                  <Typography variant="body2" color="text.secondary">
                    Select a file to view exports.
                  </Typography>
                )}
              </List>
            </Box>
          </Box>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle1" color="text.primary">
            Preview
          </Typography>
          <Box
            sx={{
              p: 2,
              bgcolor: '#2d2d2d', // Higher contrast for preview box
              color: '#ffffff', // White text for preview
              borderRadius: 1,
              fontFamily: 'monospace',
            }}
          >
            {ExportPreviews}
          </Box>
          <Box
            sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}
          >
            <Button onClick={onClose} variant="outlined" color="secondary">
              Cancel
            </Button>
            <Button
              onClick={() => {
                onClose(preview);
              }}
              variant="contained"
              color="primary"
              disabled={!preview}
            >
              Add Import
            </Button>
          </Box>
        </Box>
      </Modal>
    </ThemeProvider>
  );
};
