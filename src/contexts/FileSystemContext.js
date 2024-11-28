import React, { createContext, useState, useContext, useCallback } from 'react';
import { loadFolderTree, loadFile } from '../electronHelpers';
import { flattenFileTree } from '../screens/Flow/utils';

export const FileSystemContext = createContext();

export const useFileSystem = () => useContext(FileSystemContext);

export const FileSystemProvider = ({ children }) => {
  const [folderData, setFolderData] = useState([]);
  const [flatFiles, setFlatFiles] = useState({});
  const [rootPath, setRootPath] = useState('');

  const loadFileSystem = async (newRootPath) => {
    const { fullRootPath, folderTree } = await loadFolderTree(newRootPath);
    setRootPath(fullRootPath);
    setFolderData(folderTree);
    const flatFiles = flattenFileTree(folderTree);

    for (const [fullPath, fileInfo] of Object.entries(flatFiles)) {
      try {
        if (fileInfo.isFolder) {
          continue;
        }
        fileInfo.fileData = await loadFile(fullPath);
        fileInfo.savedData = fileInfo.fileData;
      } catch (error) {
        console.error('error loading file', fullPath, error);
      }
    }
    setFlatFiles(flatFiles);
    return fullRootPath;
  };

  return (
    <FileSystemContext.Provider
      value={{ folderData, flatFiles, rootPath, loadFileSystem, setFlatFiles }}
    >
      {children}
    </FileSystemContext.Provider>
  );
};
