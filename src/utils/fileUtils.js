const extensions = ['/index.js', '/index.jsx', '.js', '.jsx', '.ts', '.tsx'];

export const findFileForImport = (flatFiles, importPath) => {
  for (const extension of extensions) {
    const fullPath = importPath + extension;
    console.log(importPath, fullPath);
    if (flatFiles[fullPath]) {
      return flatFiles[fullPath];
    }
  }
};
