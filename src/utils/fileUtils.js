const extensions = ['/index.js', '/index.jsx', '.js', '.jsx', '.ts', '.tsx'];

export const findFileForImport = (flatFiles, importPath) => {
  for (const extension of extensions) {
    const fullPath = importPath + extension;
    //console.log('checking', fullPath);
    if (flatFiles[fullPath]) {
      return flatFiles[fullPath];
    }
  }
};

export const getFileNameFromPath = (fullPath) => {
  const parts = fullPath.split('/');
  return parts[parts.length - 1];
};

export const getFileExtension = (fullPath) => {
  const parts = fullPath.split('.');
  return parts[parts.length - 1];
};

export const isCodeFile = (fullPath) => {
  const extension = getFileExtension(fullPath);
  return ['js', 'jsx', 'ts', 'tsx'].includes(extension);
};

export const getFileFolder = (fullPath) => {
  const parts = fullPath.split('/');
  parts.pop();
  return parts.join('/');
};
