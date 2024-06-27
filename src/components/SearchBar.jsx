import React, { useState, useEffect, useRef } from 'react';
import {
  TextField,
  Paper,
  List,
  ListItem,
  ListItemText,
  createTheme,
  ThemeProvider,
} from '@mui/material';
import { makeStyles } from '@mui/styles';

const useStyles = makeStyles((theme) => ({
  searchContainer: {
    position: 'fixed',
    top: '10%',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 1300,
    width: '50%',
    maxWidth: '600px',
    backgroundColor: '#1e1e1e',
    color: '#ffffff',
  },
  searchInput: {
    '& .MuiInputBase-input': {
      padding: '8px 12px',
      color: '#ffffff',
    },
  },
  list: {
    maxHeight: '300px',
    overflowY: 'auto',
  },
  listItem: {
    '&.Mui-selected': {
      backgroundColor: '#333333',
    },
    '&:hover': {
      backgroundColor: '#444444',
    },
  },
}));

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

export const SearchBar = ({ flatFiles, onFileSelected }) => {
  const classes = useStyles();
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredFiles, setFilteredFiles] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchRef = useRef(null);

  const handleKeyDown = (e) => {
    if (e.ctrlKey && e.key === 't') {
      e.preventDefault();
      setSearchTerm('');
      setOpen(true);
    } else if (open) {
      if (e.key === 'ArrowDown') {
        setSelectedIndex((prevIndex) => (prevIndex + 1) % filteredFiles.length);
      } else if (e.key === 'ArrowUp') {
        setSelectedIndex((prevIndex) =>
          prevIndex === 0 ? filteredFiles.length - 1 : prevIndex - 1
        );
      } else if (e.key === 'Enter') {
        onFileSelected(filteredFiles[selectedIndex]);
        setOpen(false);
      } else if (e.key === 'Escape') {
        setOpen(false);
      }
    }
  };

  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      handleKeyDown(e);
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [open, filteredFiles, selectedIndex]);

  useEffect(() => {
    if (open && searchRef.current) {
      searchRef.current.focus();
    }
  }, [open]);

  useEffect(() => {
    if (searchTerm) {
      const results = Object.keys(flatFiles).filter((file) =>
        file.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredFiles(results);
      setSelectedIndex(0);
    } else {
      setFilteredFiles([]);
    }
  }, [searchTerm, flatFiles]);

  return (
    <ThemeProvider theme={darkTheme}>
      {open && (
        <Paper className={classes.searchContainer}>
          <TextField
            fullWidth
            inputRef={searchRef}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search files..."
            className={classes.searchInput}
            variant="outlined"
            size="small"
          />
          {filteredFiles.length > 0 && (
            <List className={classes.list}>
              {filteredFiles.map((file, index) => (
                <ListItem
                  key={file}
                  button
                  selected={index === selectedIndex}
                  onClick={() => {
                    onFileSelected(file);
                    setOpen(false);
                  }}
                  className={classes.listItem}
                >
                  <ListItemText primary={file} />
                </ListItem>
              ))}
            </List>
          )}
        </Paper>
      )}
    </ThemeProvider>
  );
};
