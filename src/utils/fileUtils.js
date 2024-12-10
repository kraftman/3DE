const extensions = ['/index.js', '/index.jsx', '.js', '.jsx', '.ts', '.tsx'];
import { parseCode } from './parser';

export const findFileForImport = (flatFiles, importPath) => {
  if (flatFiles[importPath]) {
    return flatFiles[importPath];
  }
  for (const extension of extensions) {
    const fullPath = importPath + extension;
    //console.log('checking', fullPath);
    if (flatFiles[fullPath]) {
      return flatFiles[fullPath];
    }
  }
};

export const enrichFileInfo = (fileInfo) => {
  const moduleCode = parseCode(fileInfo.fileData);
  const { imports, exports, flatFunctions, rootLevelCode } = moduleCode;
  fileInfo.imports = imports;
  fileInfo.exports = exports;
  fileInfo.functions = flatFunctions;
  fileInfo.rootCode = rootLevelCode;
  fileInfo.fullAst = moduleCode.ast;
};

export const importWithoutExtension = (fullPath) => {
  for (const extension of extensions) {
    if (fullPath.endsWith(extension)) {
      return fullPath.slice(0, -extension.length);
    }
  }
  return fullPath;
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
