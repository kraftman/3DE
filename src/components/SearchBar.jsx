import React, { useState, useEffect, useRef } from 'react';
import { TextField, Paper, List, ListItem, ListItemText } from '@mui/material';

const SearchBar = ({ flatFiles, onFileSelected }) => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredFiles, setFilteredFiles] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchRef = useRef(null);

  const handleKeyDown = (e) => {
    if (e.ctrlKey && e.key === 't') {
      e.preventDefault();
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
    <>
      {open && (
        <Paper
          style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1300 }}
        >
          <TextField
            fullWidth
            inputRef={searchRef}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search files..."
          />
          {filteredFiles.length > 0 && (
            <List>
              {filteredFiles.map((file, index) => (
                <ListItem
                  key={file}
                  button
                  selected={index === selectedIndex}
                  onClick={() => {
                    onFileSelected(file);
                    setOpen(false);
                  }}
                >
                  <ListItemText primary={file} />
                </ListItem>
              ))}
            </List>
          )}
        </Paper>
      )}
    </>
  );
};

export default SearchBar;
