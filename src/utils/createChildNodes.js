import path from 'path-browserify';
import { getNodesForFile } from './getNodesForFile';
import { findFileForImport } from './fileUtils';

const getChildPaths = (flatFiles, fileInfo) => {
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

export const createChildNodes = (nodes, moduleId, localFlatFiles, fileInfo) => {
  const moduleNode = nodes.find(
    (node) => node.type === 'module' && node.id === moduleId
  );

  const resolvedFiles = getChildPaths(localFlatFiles, fileInfo);
  console.log('got child paths', resolvedFiles);
  let offset = 0;

  resolvedFiles.forEach((file) => {
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
    nodes = nodes.concat(myNodes);
    myNodes.forEach((node) => {
      if (node.type === 'module') {
        //const children = getChildNodes(nodes, node.id, localFlatFiles);
        //nodes = nodes.concat(children);
      }
    });
  });

  // need to get the imports
  // filter them by local files not modules
  // load the files
  // create modules for them
  return nodes;
};
