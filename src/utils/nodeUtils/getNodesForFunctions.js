import { v4 as uuid } from 'uuid';

export const getNodesForFunctions = (func, fullPath, moduleId) => {
  const newNodes = [];

  const frameNode = {
    id: uuid(),
    type: 'pureFunctionNode',
    extent: 'parent',
    data: {
      functionName: func.name,
      functionType: func.type,
      functionArgs: func.parameters,
      functionAsync: func.async,
      content: func.body,
      depth: func.depth,
      functionId: func.id,
      moduleId: moduleId,
      fullPath: fullPath,
      frameSize: { ...func.contentSize },
    },
  };
  const codeNode = {
    id: frameNode.id + 'code',
    extent: 'parent',
    type: 'code',
    parentId: frameNode.id,
    data: {
      depth: func.depth,
      content: func.body,
      functionId: func.id,
      moduleId: moduleId,
      fullPath: fullPath,
    },
    position: {
      x: 10,
      y: 30,
    },
    style: {
      width: `${func.contentSize.width}px`,
      height: `${func.contentSize.height}px`,
    },
  };
  newNodes.push(frameNode);
  newNodes.push(codeNode);
  return newNodes;
};
