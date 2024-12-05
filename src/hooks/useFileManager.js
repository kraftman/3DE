import { useStore } from '../contexts/useStore';
import { isValidCode } from '../screens/Flow/utils.js';
import path from 'path-browserify';
import { enqueueSnackbar } from 'notistack';
import { loadFolderTree, loadFile } from '../electronHelpers';
import { flattenFileTree } from '../screens/Flow/utils';
import { parseCode } from '../utils/parser';
import {
  isCodeFile,
  getFileNameFromPath,
  getFileFolder,
} from '../utils/fileUtils';

export const useFileManager = () => {
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
    store.setFlatFiles((files) => {
      const newFiles = {
        ...files,
        [fullPath]: { ...files[fullPath], savedData: fileData },
      };
      return newFiles;
    });
  };

  const loadFileSystem = async (newRootPath) => {
    const { fullRootPath, folderTree } = await loadFolderTree(newRootPath);
    store.setRootPath(fullRootPath);
    store.setFolderData(folderTree);
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
        const moduleCode = parseCode(fileInfo.fileData);
        const { imports, exports, flatFunctions, rootLevelCode } = moduleCode;
        fileInfo.imports = imports;
        fileInfo.exports = exports;
        fileInfo.functions = flatFunctions;
        fileInfo.rootCode = rootLevelCode;

        fileInfo.savedData = fileInfo.fileData;
      } catch (error) {
        console.error('error loading file', fullPath, error);
      }
    }
    store.setFlatFiles(flatFiles);

    return fullRootPath;
  };

  const renameFile = (fullPath, newFullPath) => {
    store.setFlatFiles((files) => {
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
      const ensureFolderExists = (folderPath) => {
        if (!newFiles[folderPath]) {
          const parentFolderPath = getFileFolder(folderPath);
          if (parentFolderPath !== folderPath) {
            ensureFolderExists(parentFolderPath); // Ensure parent exists first
            // Add this folder to its parent's children
            newFiles[parentFolderPath].children.push(folderPath);
          }
          newFiles[folderPath] = {
            index: folderPath,
            children: [],
            data: getFileNameFromPath(folderPath),
            isFolder: true,
          };
        }
      };

      // Ensure the new folder hierarchy exists
      ensureFolderExists(newFolderPath);

      // Add the file to the new folder
      newFiles[newFolderPath].children.push(newFullPath);

      return newFiles;
    });
  };

  return {
    flatFiles: store.flatFiles,
    handleSave,
    loadFileSystem,
    renameFile,
  };
};
