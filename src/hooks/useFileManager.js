import { useStore } from '../contexts/useStore';
import { useCallback } from 'react';
import { loadFolderTree, loadFile } from '../electronHelpers';
import { flattenFileTree } from '../screens/Flow/utils';
import * as recast from 'recast';
import {
  isCodeFile,
  getFileNameFromPath,
  getFileFolder,
  enrichFileInfo,
} from '../utils/fileUtils';
import { useFileSystem } from '../stores/useFileSystem.js';
import { getNodesForFile } from '../utils/getNodesForFile.js';
import { useShallow } from 'zustand/react/shallow';
import { saveFile } from '../electronHelpers';
import { getInternalEdges } from '../utils/nodeUtils/nodeUtils.js';
import { layoutInternalNodes } from './useLayout.js';

export const useFileManager = () => {
  const { flatFiles, setFlatFiles, setRootPath, setFolderData } = useFileSystem(
    useShallow((state) => ({
      setFlatFiles: state.setFlatFiles,
      setRootPath: state.setRootPath,
      setFolderData: state.setFolderData,
      flatFiles: state.flatFiles,
    }))
  );
  const { setNodes, getNodes, setEdges } = useStore(
    useShallow((state) => ({
      setNodes: state.setNodes,
      getNodes: state.getNodes,
      setEdges: state.setEdges,
    }))
  );

  const handleSave = useCallback(() => {
    const selectedNode = getNodes().find((node) => node.selected);
    if (!selectedNode) {
      return;
    }

    // TODO: make sure its a code node here

    const fullPath = selectedNode.data.fullPath;
    console.log('saving', fullPath);
    const fileInfo = flatFiles[fullPath];
    console.log('fileInfo', fileInfo);
    const newRaw = recast.prettyPrint(fileInfo.fullAst).code;

    console.log('saving file', fullPath, newRaw);
    saveFile(fullPath, newRaw);
  }, [flatFiles]);

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
        fileInfo.fileData = await loadFile(fullPath);
        fileInfo.savedData = fileInfo.fileData;

        if (!isCodeFile(fullPath)) {
          continue;
        }

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
      const fileInfo = flatFiles[fullPath];

      const newNodes = getNodesForFile(fileInfo, newPos, null);
      const functionNodes = newNodes.filter(
        (node) => node.type === 'pureFunctionNode'
      );

      const moduleNode = newNodes.find((node) => node.type === 'module');
      const newEdges = getInternalEdges(fileInfo, functionNodes, moduleNode);

      layoutInternalNodes(newNodes, newEdges);
      setEdges((oldEdges) => oldEdges.concat(newEdges));
      setNodes((nodes) => nodes.concat(newNodes));
    },
    [flatFiles]
  );

  const addNewFile = useCallback(async (newFilePath) => {
    if (flatFiles[newFilePath]) {
      return;
    }

    const fileInfo = {
      index: newFilePath,
      children: [],
      data: getFileNameFromPath(newFilePath),
      isFolder: false,
      fileData: await loadFile(newFilePath),
    };

    fileInfo.savedData = fileInfo.fileData;
    console.log('new file info', fileInfo);
    if (!isCodeFile(newFilePath)) {
      enrichFileInfo(fileInfo);
    }
    createFile(fileInfo);
  }, []);

  const removeFile = useCallback((fullPath) => {
    setFlatFiles((oldFiles) => {
      const newFiles = { ...oldFiles };
      const file = newFiles[fullPath];
      if (!file) {
        return newFiles;
      }
      delete newFiles[fullPath];

      const folderPath = getFileFolder(fullPath);
      const folder = newFiles[folderPath];
      folder.children = folder.children.filter((child) => child !== fullPath);

      return newFiles;
    });
  }, []);

  return {
    flatFiles,
    handleSave,
    loadFileSystem,
    renameFile,
    createFile,
    onFileSelected,
    addNewFile,
    removeFile,
  };
};
