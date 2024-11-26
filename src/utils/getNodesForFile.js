const codeExtensions = ['js', 'jsx', 'ts', 'tsx', 'json'];
const imageExtensions = ['png', 'jpg', 'jpeg', 'gif', 'svg'];
import { parseCode } from './parser';
import { getModuleNodes } from './nodeUtils';
import { v4 as uuid } from 'uuid';

const createCodeNodes = (fileName, fileContents, newPos) => {
  const module = parseCode(fileContents);
  const moduleNodes = getModuleNodes(module);
  const { moduleNode, rootCode, children, edges: newEdges } = moduleNodes;
  moduleNode.position = newPos;

  const newNodes = [].concat(moduleNode).concat(rootCode).concat(children);
  return newNodes;
};

const createImageNode = (fullPath, newPos) => {
  return [
    {
      id: uuid(),
      type: 'image',
      data: {
        fullPath: fullPath,
      },
      style: {
        width: '100px',
        height: '100px',
      },
      position: newPos,
    },
  ];
};

export const getNodesForFile = (fullPath, fileContents, newPos) => {
  const extension = fullPath.split('.').pop();
  if (codeExtensions.includes(extension)) {
    return createCodeNodes(fullPath, fileContents, newPos);
  }
  if (imageExtensions.includes(extension)) {
    return createImageNode(fullPath, newPos);
  }
  return [];
};
