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

export const SearchBar = ({ searchContent, onSearchSelect }) => {
  const classes = useStyles();
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredContent, setFilteredContent] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchRef = useRef(null);

  const handleKeyDown = (e) => {
    if (e.ctrlKey && e.key === 't') {
      e.preventDefault();
      setSearchTerm('');
      setOpen(true);
    } else if (open) {
      if (e.key === 'ArrowDown') {
        setSelectedIndex(
          (prevIndex) => (prevIndex + 1) % filteredContent.length
        );
      } else if (e.key === 'ArrowUp') {
        setSelectedIndex((prevIndex) =>
          prevIndex === 0 ? filteredContent.length - 1 : prevIndex - 1
        );
      } else if (e.key === 'Enter') {
        //onFileSelected(filteredFiles[selectedIndex]);
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
  }, [open, filteredContent, selectedIndex]);

  useEffect(() => {
    if (open && searchRef.current) {
      searchRef.current.focus();
    }
  }, [open]);

  useEffect(() => {
    if (searchTerm) {
      console.log(searchContent);
      const results = searchContent.filter((item) =>
        item.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredContent(results);
      setSelectedIndex(0);
    } else {
      setFilteredContent([]);
    }
  }, [searchTerm, searchContent]);

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
          {filteredContent.length > 0 && (
            <List className={classes.list}>
              {filteredContent.map((item, index) => (
                <ListItem
                  key={item.id}
                  button
                  selected={index === selectedIndex}
                  onClick={() => {
                    onSearchSelect(item);
                    setOpen(false);
                  }}
                  className={classes.listItem}
                >
                  <ListItemText primary={item.content} />
                </ListItem>
              ))}
            </List>
          )}
        </Paper>
      )}
    </ThemeProvider>
  );
};
