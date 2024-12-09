import { useStore } from '../contexts/useStore';
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

export const useFileManager = () => {
  const fileStore = useFileSystem();
  const store = useStore();

  const handleSave = () => {
    const fullPath = store.nodes.find((node) => node.id === store.focusNode.id)
      .data.fullPath;

    const extension = path.extname(fullPath);
    const jsFiles = ['.js', '.jsx', '.ts', '.tsx'];
    const isJsFile = jsFiles.includes(extension);

    const fileData = store.flatFiles[fullPath].fileData;
    const isValid = isValidCode(fileData);
    if (!isJsFile || !isValid) {
      enqueueSnackbar({
        message: 'Invalid code',
        options: {
          variant: 'error',
        },
      });
      return;
    }

    //TODO use the result as the new file contents, as it should be formatted
    fileStore.setFlatFiles((files) => {
      const newFiles = {
        ...files,
        [fullPath]: { ...files[fullPath], savedData: fileData },
      };
      return newFiles;
    });
  };

  const loadFileSystem = async (newRootPath) => {
    console.log('load folder tree: ', newRootPath);
    const { fullRootPath, folderTree } = await loadFolderTree(newRootPath);
    fileStore.setRootPath(fullRootPath);
    fileStore.setFolderData(folderTree);
    const flatFiles = flattenFileTree(folderTree);
    console.log('flatFiles', flatFiles);

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
    fileStore.setFlatFiles(flatFiles);

    return fullRootPath;
  };

  const ensureFolderExists = (flatFiles, folderPath) => {
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
  };

  const createFile = (fileInfo) => {
    fileStore.setFlatFiles((files) => {
      const newFiles = {
        ...files,
        [fileInfo.index]: fileInfo,
      };

      const folderPath = getFileFolder(fileInfo.index);
      ensureFolderExists(newFiles, folderPath);

      newFiles[folderPath].children.push(fileInfo.index);

      return newFiles;
    });
  };

  const renameFile = (fullPath, newFullPath) => {
    fileStore.setFlatFiles((files) => {
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
  };

  const onFileSelected = (newPos, fullPath) => {
    console.log('fileselected', fullPath);
    const fileInfo = fileStore.flatFiles[fullPath];

    const newNodes = getNodesForFile(fileInfo, newPos, null);
    console.log('newNodes', newNodes);
    store.setNodes((nodes) => nodes.concat(newNodes));
  };

  return {
    flatFiles: store.flatFiles,
    handleSave,
    loadFileSystem,
    renameFile,
    createFile,
    onFileSelected,
  };
};
