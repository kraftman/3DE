import path from 'path-browserify';
import { getNodesForFile } from './getNodesForFile';

export const getChildNodes = (nodes, moduleId, localFlatFiles) => {
  const moduleNode = nodes.find(
    (node) => node.type === 'module' && node.id === moduleId
  );
  const thisPath = moduleNode.data.fullPath;
  const childrelativePaths = moduleNode.data.imports
    .filter((imp) => imp.importType === 'local')
    .map((imp) => {
      return imp.moduleSpecifier;
    });

  const childResolvedPaths = childrelativePaths.map((relPath) => {
    return path.resolve(path.dirname(thisPath), relPath);
  });
  const resolvedFiles = childResolvedPaths
    .map((relPath) => {
      const found =
        localFlatFiles[relPath + '.js'] ||
        localFlatFiles[relPath + '.ts'] ||
        localFlatFiles[relPath + '.tsx'] ||
        localFlatFiles[relPath + '.jsx'];
      if (!found) {
        console.error('could not find  file:', relPath);
      }
      return found;
    })
    .filter((file) => file);
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
