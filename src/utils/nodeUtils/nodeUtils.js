import { v4 as uuid } from 'uuid';

import * as recast from 'recast';
import { findReferences } from '../parser.js';

import { parseWithRecast } from '../parseWithRecast.js';

import { getNodesForFunctions } from './getNodesForFunctions.js';
import { layoutChildren } from './layoutChildren.js';
import { parseImports } from './parseImports.ts';

import path from 'path-browserify';

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

// export const getFunctionContent = (codeStrings, nodes, nodeId) => {
//   const lines = [];
//   const thisNode = nodes.find((node) => node.id === nodeId);
//   const newLines = functionNodeToString(thisNode);
//   const frameNodes = nodes.filter(
//     (node) => node.parentId === parentId && node.type === 'pureFunctionNode'
//   );
//   console.log('found nodes:', frameNodes);
//   frameNodes.forEach((codeNode) => {
//     const signature = generateFunctionSignature(codeNode.data);
//     codeStrings.push(signature);
//     codeStrings.push(codeNode.data.content);
//     getFunctionContent(codeStrings, nodes, codeNode.id);
//     codeStrings.push('}');
//   });
// };

const getEdges = (handles) => {
  // loop through all the handles and create edges between them
  // how to avoid duplicates when checking each side?
  const callHandles = handles.filter(
    (handle) => handle.refType === 'functionCall'
  );
  const edges = [];
  callHandles.forEach((handle) => {
    const targetHandles = handles.filter(
      (h) =>
        h.funcName === handle.funcName &&
        (h.refType === 'functionDefinition' || h.refType === 'import')
    );
    targetHandles.forEach((target) => {
      if (target.parentId !== handle.id) {
        const newEdge = {
          id: handle.id + target.id,
          source: handle.parentId,
          sourceHandle: handle.id,
          target: target.parentId,
          targetHandle: target.id,
        };
        edges.push(newEdge);
      }
    });
  });
  return edges;
};

// const createHandles = () => {
//   const functionCalls = findCallExpressions(func.localAst);

//   const functionHandles = functionCalls.map((call, index) => {
//     const line = call.node.loc.start.line;

//     const key = 'func:' + call.name + ':out' + index;

//     return {
//       moduleId: newModuleId,
//       funcName: call.name,
//       parentId: func.id + 'code',
//       refType: 'functionCall',
//       id: key,
//       key: key,
//       type: 'source',
//       position: 'right',
//       style: {
//         top: 14 * line,
//       },
//       data: {
//         name: call.name,
//       },
//     };
//   });
//   // the main function handle
//   const functionDefinitionHandle = {
//     moduleId: newModuleId,
//     parentId: func.id + 'code',
//     funcName: func.name,
//     refType: 'functionDefinition',
//     id: func.name + ':func',
//     key: func.name + ':func',
//     type: 'source',
//     position: 'left',
//     style: {
//       top: -10,
//       left: -20,
//     },
//     data: {
//       name: '',
//     },
//   };
//   handles.push(functionDefinitionHandle);
//   allHandles.push(functionDefinitionHandle);

//   handles = handles.concat(functionHandles);
//   allHandles = allHandles.concat(functionHandles);
// };

export const getImportHandles = (imports, moduleId) => {
  const localImports = imports.filter((imp) => imp.importType === 'local');

  return localImports.map((imp, index) => {
    return {
      moduleId: moduleId,
      parentId: moduleId,
      funcName: imp.moduleSpecifier,
      refType: 'import',
      id: moduleId + '-' + imp.fullPath + ':out',
      key: imp.fullPath + ':out',
      type: 'source',
      position: 'right',
      style: {
        top: 100 + 30 * index,
        right: 0,
        borderColor: imp.importType === 'local' ? 'blue' : 'green',
      },
      data: {
        name: imp.moduleSpecifier,
        fullPath: imp.fullPath,
        importType: imp.importType,
      },
    };
  });
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

  const moduleHandles = getImportHandles(fileInfo.imports, newModuleId);

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
      handles: moduleHandles,
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

  // Internal edges, needs moving out
  const edges = getEdges(moduleHandles);

  return {
    id: newModuleId,
    moduleNode,
    // rootCode,
    children,
    edges,
  };
};
