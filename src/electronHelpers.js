// electronHelpers.js

const invokeMain = async (channel, ...args) => {
  const result = window.electronAPI.invokeMain(channel, ...args);

  return result;
};

export const loadFile = (fileId) => invokeMain('load-file', fileId);

export const saveFile = (filePath, fileData) =>
  invokeMain('save-file', { filePath, fileData });

export const loadFolderTree = (folderId) =>
  invokeMain('load-folder-tree', folderId);

export const selectFolder = () => invokeMain('select-folder');
