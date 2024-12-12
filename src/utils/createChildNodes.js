import path from 'path-browserify';
import { getNodesForFile } from './getNodesForFile';
import { findFileForImport } from './fileUtils';

export const getChildFiles = (flatFiles, fileInfo) => {
  const thisPath = fileInfo.index;

  console.log('cecing imports', fileInfo.imports);
  const childrelativePaths = fileInfo.imports
    .filter((imp) => imp.importType === 'local')
    .map((imp) => {
      return imp.moduleSpecifier;
    });

  console.log('got child relative paths', childrelativePaths);

  const childResolvedPaths = childrelativePaths.map((relPath) => {
    return path.resolve(path.dirname(thisPath), relPath);
  });
  console.log('got child resolved paths', childResolvedPaths);

  const pathsWithExtension = childResolvedPaths
    .map((fullPath) => findFileForImport(flatFiles, fullPath))
    .filter((file) => file);
  console.log('got paths with extension', pathsWithExtension);

  return pathsWithExtension;
};

export const createChildNodes = (nodes, moduleId, childFiles) => {
  const moduleNode = nodes.find(
    (node) => node.type === 'module' && node.id === moduleId
  );

  let offset = 0;

  const newNodes = [];
  childFiles.forEach((file) => {
    const existingNode = nodes.find(
      (node) => node.data.fullPath === file.index && node.parentId === moduleId
    );
    if (existingNode) {
      console.log('skipping module because it already exists');
      return;
    }
    const newPos = {
      x: moduleNode.position.x + 500,
      y: 0 + offset,
    };
    offset += 200;
    const myNodes = getNodesForFile(file, newPos, moduleId);
    newNodes.push(...myNodes);
  });

  return newNodes;
};
