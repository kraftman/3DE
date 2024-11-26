const codeExtensions = ['js', 'jsx', 'ts', 'tsx'];
const imageExtensions = ['png', 'jpg', 'jpeg', 'gif', 'svg'];
import { parseCode } from './parser';
import { getModuleNodes } from './nodeUtils';
import { v4 as uuid } from 'uuid';

const createCodeNodes = (fullPath, fileContents, newPos) => {
  const module = parseCode(fileContents);
  const moduleNodes = getModuleNodes(module);
  const { moduleNode, rootCode, children, edges: newEdges } = moduleNodes;
  moduleNode.position = newPos;
  moduleNode.data.fullPath = fullPath;

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

const createTextNode = (fullPath, fileContents, newPos) => {
  return [
    {
      id: uuid(),
      type: 'text',
      data: {
        fullPath: fullPath,
        content: fileContents,
      },
      position: newPos,
      style: {
        width: '300px',
        height: '300px',
      },
    },
  ];
};

const createMarkdownNode = (fullPath, fileContents, newPos) => {
  return [
    {
      id: uuid(),
      type: 'markdown',
      data: {
        fullPath: fullPath,
        content: fileContents,
      },
      position: newPos,
      style: {
        width: '300px',
        height: '300px',
      },
    },
  ];
};

export const getNodesForFile = (fullPath, fileContents, newPos) => {
  const extension = fullPath.split('.').pop();
  console.log('extension', extension);
  if (codeExtensions.includes(extension)) {
    return createCodeNodes(fullPath, fileContents, newPos);
  }
  if (imageExtensions.includes(extension)) {
    return createImageNode(fullPath, newPos);
  }
  if (extension === 'md') {
    return createMarkdownNode(fullPath, fileContents, newPos);
  }
  return createTextNode(fullPath, fileContents, newPos);
};
