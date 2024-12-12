export const layoutChildren = (fileInfo, nodes, newModuleId) => {
  const maxDepth = fileInfo.functions.reduce((acc, func) => {
    return Math.max(acc, func.depth);
  }, 0);

  let moduleWidth = 100;
  let moduleHeight = 100;

  const children = [];

  for (let i = maxDepth; i >= 0; i--) {
    const functionsAtDepth = fileInfo.functions.filter(
      (func) => func.depth === i
    );
    const nodesAtDepth = nodes.filter(
      (node) => node.data.depth === i && node.type === 'pureFunctionNode'
    );
    let currentHeight = 50;
    // increase width by the widest child at this depth
    moduleWidth =
      moduleWidth +
      30 +
      nodesAtDepth.reduce((acc, node) => {
        return Math.max(acc, node.data.frameSize.width);
      }, 0);

    functionsAtDepth.forEach((func) => {
      let frameNode = nodes.find(
        (node) =>
          node.data.functionId === func.id && node.type === 'pureFunctionNode'
      );
      const localChildren = nodes.filter(
        (node) =>
          node.parentId === frameNode.id && node.type === 'pureFunctionNode'
      );
      // get widest child of this specific function
      const childWidth = localChildren.reduce((acc, child) => {
        return Math.max(acc, child.data.frameSize.width);
      }, 0);

      // accumulate heights of children of this function
      const height = localChildren.reduce((acc, child) => {
        return Math.max(acc, acc + child.data.frameSize.height);
      }, frameNode.data.frameSize.height);
      // update the frameSize to include the children, for use in the parent

      const frameWidth =
        localChildren.length > 0
          ? func.contentSize.width + childWidth
          : func.contentSize.width;
      frameNode.data.frameSize = {
        width: frameWidth + 30,
        height: height + 50,
      };

      const parentNode = nodes.find(
        (node) => node.data.functionId === func.parentId
      );
      frameNode.data.handles = [];
      frameNode.parentId = parentNode ? parentNode.id : newModuleId;
      frameNode.position = {
        x: parentNode ? parentNode.data.frameSize.width : 20,
        y:
          30 +
          currentHeight +
          (parentNode ? parentNode.data.frameSize.height : 20),
      };
      frameNode.style = {
        width: `${frameWidth + 20}px`,
        height: `${height + 30}px`,
      };

      // let handles = createHandles();

      let codeFrame = nodes.find(
        (node) => node.data.functionId === func.id && node.type === 'code'
      );
      codeFrame.handles = [];

      children.push(codeFrame);
      children.push(frameNode);

      currentHeight += height + 50;
    });
    if (i === 0) {
      moduleHeight =
        moduleHeight +
        50 +
        nodesAtDepth.reduce((acc, node) => {
          return Math.max(acc, acc + node.data.frameSize.height);
        }, 0);
    }
  }
  return {
    children,
    moduleWidth,
    moduleHeight,
  };
};
