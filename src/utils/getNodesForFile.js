const codeExtensions = ['js', 'jsx', 'ts', 'tsx'];
const imageExtensions = ['png', 'jpg', 'jpeg', 'gif', 'svg'];
import { parseCode } from './parser';
import { getModuleNodes } from './nodeUtils';
import { v4 as uuid } from 'uuid';

const createCodeNodes = (fullPath, fileContents, newPos, parentId) => {
  const module = parseCode(fileContents);
  const moduleNodes = getModuleNodes(module);
  const { moduleNode, rootCode, children, edges: newEdges } = moduleNodes;
  moduleNode.position = newPos;
  moduleNode.data.fullPath = fullPath;
  moduleNode.parentId = parentId;
  console.log('setting moduleNode parent id:', parentId);

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

export const getNodesForFile = (fullPath, fileContents, newPos, parentId) => {
  const extension = fullPath.split('.').pop();
  if (codeExtensions.includes(extension)) {
    const codeNodes = createCodeNodes(fullPath, fileContents, newPos, parentId);
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
