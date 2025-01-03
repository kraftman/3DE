import { createChildNodes } from './createChildNodes';

import { importWithoutExtension } from './fileUtils';

export const findChildNodes = (nodes, moduleId) => {
  const childNodes = nodes.filter((node) => node.data.parentId === moduleId);
  let foundNodes = [];
  for (const child of childNodes) {
    foundNodes.push(child);
    const children = findChildNodes(nodes, child.id);
    foundNodes = foundNodes.concat(children);
  }
  return foundNodes;
};

export const findChildModules = (nodes, moduleId) => {
  const foundModules = nodes.filter(
    (node) => node.data.parentId === moduleId && node.type === 'module'
  );
  return foundModules;
};

export const collapseModule = (nodes, moduleId) => {
  // get all children of this node
  const moduleNodes = nodes.filter((node) => node.data.moduleId === moduleId);

  const moduleNodeIds = moduleNodes.map((node) => node.id);

  const collapsedHeight = 50;
  const collapsedWidth = 200;

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
        style: {
          ...node.style,
          height: collapsedHeight + 'px',
          width: collapsedWidth + 'px',
        },
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
  const oldWidth = moduleNode.data.width;

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
        style: {
          ...node.style,
          height: oldHeight + 'px',
          width: oldWidth + 'px',
        },
      };
    }
    return node;
  });
  return newNodes;
};

// check if this can be merged with findModuleEdges in uselayout
export const findHandleEdges = (oldEdge, oldNodes, moduleNodes) => {
  const edges = [];

  // for each new node, check if there is an old node that references the new node
  moduleNodes.forEach((newModule) => {
    oldNodes.find((oldModule) => {
      if (oldModule.id !== newModule.parentId) {
        return;
      }
      oldModule.data.handles.forEach((handle) => {
        if (
          importWithoutExtension(handle.data.fullPath) ===
          importWithoutExtension(newModule.data.fullPath)
        ) {
          const sourceName = oldModule.id + '-' + handle.data.fullPath + ':out';
          const targetName = newModule.id + '-handle';
          const edgeId = `${oldModule.id}-${newModule.id}}-${handle.data.name}`;
          if (oldEdge.find((edge) => edge.id === edgeId)) {
            return;
          }
          edges.push({
            id: edgeId,
            source: oldModule.id,
            target: newModule.id,
            targetHandle: targetName,
            sourceHandle: sourceName,
          });
        }
      });
    });
  });

  console.log('edges', edges);
  return edges;
};

export const hideModuleChildren = (nodes, moduleId) => {
  const childModules = nodes.filter(
    (node) => node.data.parentId === moduleId && node.type === 'module'
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

export const showModuleChildren = (nodes, edges, moduleNode, flatFiles) => {
  // need to only create new ones if they dont already exist

  // create any that dont exis
  const depth = 10;
  let newNodes = createChildNodes(
    flatFiles,
    nodes,
    moduleNode,
    undefined,
    depth
  );
  if (moduleNode.data.isCollapsed) {
    newNodes.forEach((node) => {
      if (node.type === 'module') {
        newNodes = collapseModule(newNodes, node.id);
      }
    });
  }
  // collapseModule(nodes, moduleId);

  // get the existing so they can be update
  const children = findChildNodes(nodes, moduleNode.id);
  const childIds = children.map((child) => child.id);
  const updatedNodes = nodes.map((node) => {
    if (node.type === 'module' && node.id === moduleNode.id) {
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

  // TODO/WARNING newNewNodes includes all nodes, not just the new ones
  const moduleNodes = newNodes.filter((node) => node.type === 'module');
  const newEdges = findHandleEdges(edges, nodes, moduleNodes);
  const childEdges = findHandleEdges(edges, moduleNodes, moduleNodes);
  return {
    newNodes: updatedNodes.concat(newNodes),
    newEdges: newEdges.concat(childEdges),
  };
};
