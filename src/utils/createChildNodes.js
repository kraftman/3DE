import path from 'path-browserify';
import { getNodesForFile } from './getNodesForFile';
import { findFileForImport } from './fileUtils';

export const getChildFiles = (flatFiles, fileInfo) => {
  const thisPath = fileInfo.index;

  const childrelativePaths = fileInfo.imports
    .filter((imp) => imp.importType === 'local')
    .map((imp) => {
      return imp.moduleSpecifier;
    });

  const childResolvedPaths = childrelativePaths.map((relPath) => {
    return path.resolve(path.dirname(thisPath), relPath);
  });

  const pathsWithExtension = childResolvedPaths
    .map((fullPath) => findFileForImport(flatFiles, fullPath))
    .filter((file) => file);

  return pathsWithExtension;
};

export const createChildNodes = (
  flatFiles,
  nodes,
  moduleNode,
  childPath,
  maxDepth,
  depth = 0
) => {
  const fileInfo = flatFiles[moduleNode.data.fullPath];
  let childFiles = getChildFiles(flatFiles, fileInfo);
  if (childPath) {
    const file = findFileForImport(flatFiles, childPath);
    childFiles = [file];
  }

  let offset = 0;
  depth = depth + 1;

  const newNodes = [];
  childFiles.forEach((file) => {
    const existingNode = nodes.find(
      (node) =>
        node.data.fullPath === file.index &&
        node.data.parentId === moduleNode.id
    );
    if (existingNode) {
      console.log('skipping module because it already exists');
      return;
    }
    const newPos = {
      x: moduleNode.position.x + moduleNode.data.width + 100,
      y: 0 + offset,
    };
    offset += 200;
    const myNodes = getNodesForFile(file, newPos, moduleNode.id);
    newNodes.push(...myNodes);
  });
  // need a toggle here in case we dont want to return children
  if (depth >= maxDepth) {
    return newNodes;
  }
  const newModules = newNodes.filter((node) => node.type === 'module');
  for (const newModule of newModules) {
    const childNodes = createChildNodes(
      flatFiles,
      nodes,
      newModule,
      undefined,
      maxDepth,
      depth
    );
    newNodes.push(...childNodes);
  }
  return newNodes;
};
