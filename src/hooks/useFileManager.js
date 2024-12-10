import { useStore } from '../contexts/useStore';
import { useCallback } from 'react';
import { isValidCode } from '../screens/Flow/utils.js';
import path from 'path-browserify';
import { enqueueSnackbar } from 'notistack';
import { loadFolderTree, loadFile } from '../electronHelpers';
import { flattenFileTree } from '../screens/Flow/utils';
import {
  isCodeFile,
  getFileNameFromPath,
  getFileFolder,
  enrichFileInfo,
} from '../utils/fileUtils';
import { useFileSystem } from '../stores/useFileSystem.js';
import { getNodesForFile } from '../utils/getNodesForFile.js';
import { useShallow } from 'zustand/react/shallow';

export const useFileManager = () => {
  const { flatFiles, setFlatFiles, setRootPath, setFolderData } = useFileSystem(
    useShallow((state) => ({
      setFlatFiles: state.setFlatFiles,
      setRootPath: state.setRootPath,
      setFolderData: state.setFolderData,
      flatFiles: state.flatFiles,
    }))
  );
  const { setNodes } = useStore(
    useShallow((state) => ({
      setNodes: state.setNodes,
    }))
  );

  // const handleSave = () => {
  //   const fullPath = store.nodes.find((node) => node.id === store.focusNode.id)
  //     .data.fullPath;

  //   const extension = path.extname(fullPath);
  //   const jsFiles = ['.js', '.jsx', '.ts', '.tsx'];
  //   const isJsFile = jsFiles.includes(extension);

  //   const fileData = store.flatFiles[fullPath].fileData;
  //   const isValid = isValidCode(fileData);
  //   if (!isJsFile || !isValid) {
  //     enqueueSnackbar({
  //       message: 'Invalid code',
  //       options: {
  //         variant: 'error',
  //       },
  //     });
  //     return;
  //   }

  //   //TODO use the result as the new file contents, as it should be formatted
  //   setFlatFiles((files) => {
  //     const newFiles = {
  //       ...files,
  //       [fullPath]: { ...files[fullPath], savedData: fileData },
  //     };
  //     return newFiles;
  //   });
  // };

  const loadFileSystem = useCallback(async (newRootPath) => {
    const { fullRootPath, folderTree } = await loadFolderTree(newRootPath);
    setRootPath(fullRootPath);
    setFolderData(folderTree);
    const flatFiles = flattenFileTree(folderTree);

    for (const [fullPath, fileInfo] of Object.entries(flatFiles)) {
      try {
        if (fileInfo.isFolder) {
          continue;
        }
        if (!isCodeFile(fullPath)) {
          continue;
        }

        fileInfo.fileData = await loadFile(fullPath);
        fileInfo.savedData = fileInfo.fileData;

        enrichFileInfo(fileInfo);
      } catch (error) {
        console.error('error loading file', fullPath, error);
      }
    }
    setFlatFiles(flatFiles);

    return fullRootPath;
  }, []);

  const ensureFolderExists = useCallback((flatFiles, folderPath) => {
    if (!flatFiles[folderPath]) {
      const parentFolderPath = getFileFolder(folderPath);
      if (parentFolderPath !== folderPath) {
        ensureFolderExists(parentFolderPath); // Ensure parent exists first
        // Add this folder to its parent's children
        flatFiles[parentFolderPath].children.push(folderPath);
      }
      flatFiles[folderPath] = {
        index: folderPath,
        children: [],
        data: getFileNameFromPath(folderPath),
        isFolder: true,
      };
    }
  }, []);

  const createFile = useCallback((fileInfo) => {
    setFlatFiles((files) => {
      const newFiles = {
        ...files,
        [fileInfo.index]: fileInfo,
      };

      const folderPath = getFileFolder(fileInfo.index);
      ensureFolderExists(newFiles, folderPath);

      newFiles[folderPath].children.push(fileInfo.index);

      return newFiles;
    });
  }, []);

  const renameFile = useCallback((fullPath, newFullPath) => {
    setFlatFiles((files) => {
      const newFiles = { ...files };
      const file = newFiles[fullPath];

      file.index = newFullPath;
      file.data = getFileNameFromPath(newFullPath);
      delete newFiles[fullPath];
      newFiles[newFullPath] = file;

      const oldFolderPath = getFileFolder(fullPath);
      const newFolderPath = getFileFolder(newFullPath);

      const oldFolder = newFiles[oldFolderPath];
      oldFolder.children = oldFolder.children.filter(
        (child) => child !== fullPath
      );

      // Recursively ensure parent folders exist and update their children

      // Ensure the new folder hierarchy exists
      ensureFolderExists(newFiles, newFolderPath);

      // Add the file to the new folder
      newFiles[newFolderPath].children.push(newFullPath);

      return newFiles;
    });
  }, []);

  const onFileSelected = useCallback(
    (newPos, fullPath) => {
      console.log('fileselected', fullPath);
      const fileInfo = flatFiles[fullPath];

      const newNodes = getNodesForFile(fileInfo, newPos, null);
      console.log('newNodes', newNodes);
      setNodes((nodes) => nodes.concat(newNodes));
    },
    [flatFiles]
  );

  return {
    flatFiles,
    //handleSave,
    loadFileSystem,
    renameFile,
    createFile,
    onFileSelected,
  };
};
