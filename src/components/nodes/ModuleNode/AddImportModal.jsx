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
  IconButton,
  ListItemSecondaryAction,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { useFileSystem } from '../../../stores/useFileSystem';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      paper: '#121212',
      default: '#1e1e1e',
    },
    text: {
      primary: '#ffffff',
      secondary: '#b0b0b0',
    },
  },
});

export const AddImportModal = ({ open, onClose, initialImports }) => {
  const flatFiles = useFileSystem((state) => state.flatFiles);
  const rootPath = useFileSystem((state) => state.rootPath);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedExports, setSelectedExports] = useState([...initialImports]);

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleFileSelect = (file) => {
    setSelectedFile(file);
  };

  const isExportSelected = (myExport) => {
    return selectedExports.some(
      (selected) =>
        selected.name === myExport.name && selected.path === selectedFile?.index
    );
  };

  const handleExportToggle = (myExport) => {
    const isSelected = isExportSelected(myExport);

    if (isSelected) {
      // Remove the export
      setSelectedExports((prev) =>
        prev.filter(
          (exp) =>
            !(exp.name === myExport.name && exp.path === selectedFile.index)
        )
      );
    } else {
      // Add the export
      setSelectedExports((prev) => [
        ...prev,
        {
          ...myExport,
          path: selectedFile.index,
        },
      ]);
    }
  };

  const toRelativePath = (path) => path.replace(rootPath, '');

  const handleDeleteExport = (exportToDelete) => {
    setSelectedExports((prev) =>
      prev.filter(
        (exp) =>
          !(
            exp.name === exportToDelete.name && exp.path === exportToDelete.path
          )
      )
    );
  };

  // Group exports by file path
  const groupedExports = selectedExports.reduce((acc, exp) => {
    if (!acc[exp.path]) {
      acc[exp.path] = [];
    }
    acc[exp.path].push(exp);
    return acc;
  }, {});

  const PreviewSection = () => (
    <Box sx={{ mt: 2 }}>
      {Object.entries(groupedExports).map(([path, exports]) => (
        <Box key={path} sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ color: '#b0b0b0', mb: 1 }}>
            from &#39;{toRelativePath(path)}&#39;:
          </Typography>
          <Box sx={{ ml: 2 }}>
            {exports.map((exp) => (
              <Box
                key={exp.name}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  mb: 1,
                }}
              >
                <Typography
                  sx={{
                    color: '#569cd6',
                    fontFamily: 'monospace',
                    flexGrow: 1,
                  }}
                >
                  {exp.name}
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => handleDeleteExport(exp)}
                  sx={{
                    color: '#b0b0b0',
                    '&:hover': {
                      color: '#ff4444',
                    },
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            ))}
          </Box>
        </Box>
      ))}
    </Box>
  );

  const ListItems = Object.entries(flatFiles)
    .filter(
      ([key, value]) => value.exports?.length > 0 && key.includes(searchTerm)
    )
    .map(([key, value]) => {
      const relativePath = value.index.replace(rootPath, '');
      return (
        <ListItem button key={key} onClick={() => handleFileSelect(value)}>
          <ListItemText
            primary={relativePath}
            primaryTypographyProps={{ color: 'text.primary' }}
          />
        </ListItem>
      );
    });

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
                    onClick={() => handleExportToggle(myExport)}
                    sx={{
                      bgcolor: isExportSelected(myExport)
                        ? 'rgba(144, 202, 249, 0.08)'
                        : 'transparent',
                      '&:hover': {
                        bgcolor: isExportSelected(myExport)
                          ? 'rgba(144, 202, 249, 0.12)'
                          : undefined,
                      },
                    }}
                  >
                    <ListItemText
                      primary={myExport.name}
                      primaryTypographyProps={{ color: 'text.primary' }}
                    />
                    {isExportSelected(myExport) && (
                      <ListItemSecondaryAction>
                        <CheckCircleIcon
                          sx={{
                            color: '#90caf9',
                            fontSize: 20,
                          }}
                        />
                      </ListItemSecondaryAction>
                    )}
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
              bgcolor: '#2d2d2d',
              color: '#ffffff',
              borderRadius: 1,
              minHeight: '100px',
            }}
          >
            {selectedExports.length > 0 ? (
              <PreviewSection />
            ) : (
              <Typography variant="body2" color="text.secondary">
                No imports selected.
              </Typography>
            )}
          </Box>
          <Box
            sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}
          >
            <Button onClick={onClose} variant="outlined" color="secondary">
              Cancel
            </Button>
            <Button
              onClick={() => {
                onClose(selectedExports);
              }}
              variant="contained"
              color="primary"
              disabled={selectedExports.length === 0}
            >
              Add Import
            </Button>
          </Box>
        </Box>
      </Modal>
    </ThemeProvider>
  );
};
