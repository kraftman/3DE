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
import { useFileSystem } from '../stores/useFileSystem';
import { SearchToggle } from './SearchBar/SearchToggle';
import * as recast from 'recast';

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

export const SearchBar = ({ onSearchSelect }) => {
  const classes = useStyles();
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredContent, setFilteredContent] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchContent, setSearchContent] = useState([]);
  const [functionContent, setFunctionContent] = useState([]);
  const [fileContent, setFileContent] = useState([]);
  const [codebaseContent, setCodebaseContent] = useState([]);
  const searchRef = useRef(null);

  const [searchMode, setSearchMode] = useState('filenames');

  const flatFiles = useFileSystem((state) => state.flatFiles);

  useEffect(() => {
    if (searchMode === 'filenames') {
      setSearchContent(fileContent);
    } else if (searchMode === 'functions') {
      setSearchContent(functionContent);
    } else {
      setSearchContent(codebaseContent);
    }
  }, [searchMode, fileContent, functionContent, codebaseContent]);

  useEffect(() => {
    const newFunctions = [];
    const newFileNames = [];
    const newCodebase = [];
    for (const key in flatFiles) {
      const file = flatFiles[key];
      newFileNames.push({
        key: key,
        id: key,
        fullPath: key,
        content: key,
      });
      newCodebase.push({
        key: key,
        id: key,
        fullPath: key,
        content: recast.print(file.fullAst).code,
      });

      if (file.functions) {
        file.functions.forEach((func) => {
          newFunctions.push({
            key: key + func.id + func.name,
            id: func.id,
            fullPath: key,
            content: func.name,
          });
        });
      }
    }
    setFileContent(newFileNames);
    setCodebaseContent(newCodebase);
    setFunctionContent(newFunctions);
  }, [flatFiles]);

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
          <SearchToggle searchMode={searchMode} setSearchMode={setSearchMode} />
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
                  key={item.key}
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
