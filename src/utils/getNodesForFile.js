const codeExtensions = ['js', 'jsx', 'ts', 'tsx'];
const imageExtensions = ['png', 'jpg', 'jpeg', 'gif', 'svg'];
import { getModuleNodes } from './nodeUtils';
import { v4 as uuid } from 'uuid';

const createCodeNodes = (fileInfo, newPos, parentId) => {
  const moduleNodes = getModuleNodes(fileInfo);
  const { moduleNode, rootCode, children } = moduleNodes;
  moduleNode.position = newPos;

  moduleNode.parentId = parentId;

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

export const getNodesForFile = (fileInfo, newPos, parentId) => {
  const fullPath = fileInfo.index;
  const fileContents = fileInfo.fileData;
  const extension = fullPath.split('.').pop();
  if (codeExtensions.includes(extension)) {
    const codeNodes = createCodeNodes(fileInfo, newPos, parentId);
    //codeNodes.moduleNode.parentId = parentId;
    return codeNodes;
  }
  if (imageExtensions.includes(extension)) {
    const imageNode = createImageNode(fullPath, newPos);
    imageNode.parentId = parentId;
    return imageNode;
  }
  if (extension === 'md') {
    const markDownNode = createMarkdownNode(fullPath, fileContents, newPos);
    markDownNode.parentId = parentId;
    return markDownNode;
  }
  const textNode = createTextNode(fullPath, fileContents, newPos);
  textNode.parentId = parentId;
  return textNode;
};
