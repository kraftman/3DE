import { getChildNodes } from './getChildNodes';

export const findChildNodes = (nodes, moduleId) => {
  const childNodes = nodes.filter((node) => node.parentId === moduleId);
  let foundNodes = [];
  for (const child of childNodes) {
    foundNodes.push(child);
    const children = findChildNodes(nodes, child.id);
    foundNodes = foundNodes.concat(children);
  }
  return foundNodes;
};

export const collapseModule = (nodes, moduleId) => {
  const moduleNodes = nodes.filter((node) => node.data.moduleId === moduleId);

  const moduleNodeIds = moduleNodes.map((node) => node.id);

  const collapsedHeight = 100;

  const newNodes = nodes.map((node) => {
    if (moduleNodeIds.includes(node.id) && node.type !== 'module') {
      return {
        ...node,
        hidden: true,
      };
    }
    if (node.type === 'module' && node.id === moduleId) {
      return {
        ...node,
        data: { ...node.data, isCollapsed: true },
        style: { ...node.style, height: collapsedHeight + 'px' },
      };
    }
    return node;
  });
  return newNodes;
};

export const expandModule = (nodes, moduleId) => {
  const moduleNode = nodes.find(
    (node) => node.id === moduleId && node.type === 'module'
  );
  const moduleNodes = nodes.filter((node) => node.data.moduleId === moduleId);

  const moduleNodeIds = moduleNodes.map((node) => node.id);

  const oldHeight = moduleNode.data.height;

  const newNodes = nodes.map((node) => {
    if (moduleNodeIds.includes(node.id) && node.type !== 'module') {
      return {
        ...node,
        hidden: false,
      };
    }
    if (node.type === 'module' && node.id === moduleId) {
      return {
        ...node,
        data: { ...node.data, isCollapsed: false },
        style: { ...node.style, height: oldHeight + 'px' },
      };
    }
    return node;
  });
  return newNodes;
};

export const findHandleEdges = (moduleNodes) => {
  const edges = [];
  moduleNodes.forEach((moduleNode) => {
    // for each import, check if there is a module with the path
    moduleNode.data.imports.forEach((imp) => {
      const targetModule = moduleNodes.find(
        (node) =>
          node.data.fullPath === imp.fullPath + '.js' ||
          node.data.fullPath === imp.fullPath + '.ts' ||
          node.data.fullPath === imp.fullPath + '.tsx' ||
          node.data.fullPath === imp.fullPath + '.jsx'
      );
      if (targetModule) {
        edges.push({
          id: `${moduleNode.id}-${targetModule.id}}-${imp.name}`,
          source: moduleNode.id,
          target: targetModule.id,
          targetHandle: targetModule.id + '-handle',
          sourceHandle: moduleNode.id + '-' + imp.name + ':out',
        });
      }
    });
  });
  return edges;
};

export const hideModuleChildren = (nodes, moduleId) => {
  const childModules = nodes.filter(
    (node) => node.parentId === moduleId && node.type === 'module'
  );
  let foundNodes = [];
  for (const child of childModules) {
    foundNodes.push(child);
    const children = findChildNodes(nodes, child.id);
    foundNodes = foundNodes.concat(children);
  }

  const foundNodeIds = foundNodes.map((node) => node.id);

  const newNodes = nodes.map((node) => {
    if (node.id === moduleId) {
      return {
        ...node,
        data: { ...node.data, showChildren: false },
      };
    }
    if (foundNodeIds.includes(node.id)) {
      return {
        ...node,
        hidden: true,
      };
    }
    return node;
  });
  return newNodes;
};

export const showModuleChildren = (nodes, moduleId, localFlatFiles) => {
  // need to only create new ones if they dont already exist
  const newNodes = getChildNodes(nodes, moduleId, localFlatFiles);
  const children = findChildNodes(nodes, moduleId);
  const childIds = children.map((child) => child.id);
  const newNewNodes = newNodes.map((node) => {
    if (node.type === 'module' && node.id === moduleId) {
      //console.log('found module node:', node);
      return {
        ...node,
        data: { ...node.data, showChildren: true },
      };
    }
    if (childIds.includes(node.id)) {
      return {
        ...node,
        hidden: false,
      };
    }
    return node;
  });

  const newModules = newNewNodes.filter((node) => node.type === 'module');
  const newEdges = findHandleEdges(newModules);
  return {
    newNodes: newNewNodes,
    newEdges: newEdges,
  };
};
