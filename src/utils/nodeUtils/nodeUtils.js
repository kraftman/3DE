import { v4 as uuid } from 'uuid';

import { getNodesForFunctions } from './getNodesForFunctions.js';
import { layoutChildren } from './layoutChildren.js';

import { getAstSize } from '../codeUtils.js';
import * as recast from 'recast';

export const findChildIds = (nodes, parentId) => {
  //rucursively find children from nodes and add to a flat array of children
  let children = [];
  const foundChildren = nodes.filter((node) => node.data.parentId === parentId);
  foundChildren.forEach((child) => {
    children.push(child.id);
    children = children.concat(findChildIds(nodes, child.id));
  });
  return children;
};

function generateFunctionSignature(
  frameNodeData // default to false for backward compatibility
) {
  console.log('frameNodeData:', frameNodeData);
  const { functionName, functionType, functionArgs, functionAsync } =
    frameNodeData;
  const args = functionArgs.join(', ');
  const asyncKeyword = functionAsync ? 'async ' : '';

  switch (functionType) {
    case 'functionExpression':
      return `const ${functionName} = ${asyncKeyword}function(${args}) { `;

    case 'functionDeclaration':
      return `${asyncKeyword}function ${functionName}(${args}) { `;

    case 'arrowFunctionExpression':
      return `const ${functionName} = ${asyncKeyword}(${args}) => { `;

    default:
      throw new Error(`Unknown function type: ${functionType}`);
  }
}

export const getFunctionContent = (nodes, functionNode) => {
  const lines = [];
  const signature = generateFunctionSignature(functionNode.data);
  lines.push(signature);
  lines.push(functionNode.data.content);

  const frameNodes = nodes.filter(
    (node) =>
      node.data.parentId === functionNode.id && node.type === 'pureFunctionNode'
  );
  frameNodes.forEach((codeNode) => {
    const subLines = getFunctionContent(nodes, codeNode);
    lines.push(...subLines);
  });
  lines.push('}');
  return lines;
};

export const createPartialNode = (foundFunction, moduleNode, newPath) => {
  const newSize = getAstSize(foundFunction.node);

  const newPos = {
    x: moduleNode.position.x + moduleNode.data.width + 100,
    y: 0,
  };

  const newNode = {
    id: uuid(),
    parentId: moduleNode.id,
    type: 'partial',
    position: {
      ...newPos,
    },
    width: newSize.width,
    height: newSize.height,
    data: {
      fullPath: newPath,
      moduleId: moduleNode.id,
      functionId: foundFunction.id,
      ...newPos,
      ...newSize,
    },
    style: {
      width: `${newSize.width}px`,
      height: `${newSize.height}px`,
    },
  };
  return newNode;
};

// const getEdges = (handles) => {
//   // loop through all the handles and create edges between them
//   // how to avoid duplicates when checking each side?
//   const callHandles = handles.filter(
//     (handle) => handle.refType === 'functionCall'
//   );
//   const edges = [];
//   callHandles.forEach((handle) => {
//     const targetHandles = handles.filter(
//       (h) =>
//         h.funcName === handle.funcName &&
//         (h.refType === 'functionDefinition' || h.refType === 'import')
//     );
//     targetHandles.forEach((target) => {
//       if (target.parentId !== handle.id) {
//         const newEdge = {
//           id: handle.id + target.id,
//           source: handle.parentId,
//           sourceHandle: handle.id,
//           target: target.parentId,
//           targetHandle: target.id,
//         };
//         edges.push(newEdge);
//       }
//     });
//   });
//   return edges;
// };

const isFunctionInvoked = (ast, functionName) => {
  let isInvoked = false;

  recast.visit(ast, {
    visitCallExpression(path) {
      const { callee } = path.node;

      // Check if the callee is an identifier and matches the function name
      if (callee.type === 'Identifier' && callee.name === functionName) {
        isInvoked = true;
        return false; // Exit early since we found a match
      }

      // Check if the callee is a member expression (e.g., obj.method)
      if (
        callee.type === 'MemberExpression' &&
        callee.property.type === 'Identifier' &&
        callee.property.name === functionName
      ) {
        isInvoked = true;
        return false; // Exit early since we found a match
      }

      this.traverse(path);
    },
  });

  return isInvoked;
};

export const getInternalEdges = (fileInfo, functionNodes, moduleNode) => {
  // TODO: this doesnt account for functions that are inside other functions.
  const edges = [];
  const { functions, exports } = fileInfo;
  functions.forEach((funcDefinition) => {
    // find any other function that calls this function
    functions.forEach((funcCall) => {
      const isCalled = isFunctionInvoked(funcCall.node, funcDefinition.name);
      if (isCalled) {
        const sourceNode = functionNodes.find(
          (node) => node.data.functionId === funcCall.id
        );
        const targetNode = functionNodes.find(
          (node) => node.data.functionId === funcDefinition.id
        );
        edges.push({
          id: sourceNode.id + targetNode.id,
          moduleId: moduleNode.id,
          target: sourceNode.id,
          source: targetNode.id,
          isInternal: true,
        });
      }
    });
    if (exports.find((exp) => exp.name === funcDefinition.name)) {
      const sourceNode = moduleNode;
      const targetNode = functionNodes.find(
        (node) => node.data.functionId === funcDefinition.id
      );
      if (sourceNode && targetNode) {
        edges.push({
          id: sourceNode.id + targetNode.id,
          moduleId: moduleNode.id,
          target: sourceNode.id,
          source: targetNode.id,
        });
      }
    }
  });
  console.log('exports:', exports);

  return edges;
};

export const getModuleNodes = (fileInfo) => {
  const fullPath = fileInfo.index;

  const newModuleId = uuid();
  const nodes = [];
  if (fileInfo.functions.length > 1) {
    fileInfo.functions.forEach((func) => {
      const newNodes = getNodesForFunctions(func, fullPath, newModuleId);
      nodes.push(...newNodes);
    });
  }

  let { children, moduleWidth, moduleHeight } = layoutChildren(
    fileInfo,
    nodes, //s
    newModuleId
  );

  children = children.reverse();

  const baseSize = {
    width: 200,
    height: 100,
  };
  moduleWidth = Math.max(moduleWidth, baseSize.width);
  moduleHeight = Math.max(moduleHeight, baseSize.height);

  const moduleNode = {
    id: newModuleId,
    data: {
      exports: fileInfo.exports,
      imports: fileInfo.imports,
      handles: [],
      moduleId: newModuleId,
      fullPath: fullPath,
      width: moduleWidth + 30,
      height: moduleHeight + 60,
    },
    type: 'module',
    position: {
      x: 200,
      y: 100,
    },
    style: {
      width: `${moduleWidth + 30}px`,
      height: `${moduleHeight + 60}px`,
    },
  };

  return {
    id: newModuleId,
    moduleNode,
    // rootCode,
    children,
  };
};
