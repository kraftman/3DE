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
  const foundChildren = nodes.filter((node) => node.parentId === parentId);
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
      node.parentId === functionNode.id && node.type === 'pureFunctionNode'
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

export const getRaw = (nodes, moduleId) => {
  // start with the imports
  // get the root functions
  // ensure they are ordered correctly if hey call each other
  //
  const moduleNodes = nodes.filter((node) => node.data.moduleId === moduleId);

  const moduleNode = moduleNodes.find(
    (node) => node.type === 'module' && node.id === moduleId
  );

  let lines = [];

  // add the imports
  moduleNode.data.imports.forEach((imp) => {
    lines.push(recast.print(imp.node).code);
  });
  // add the root level code
  // TODO: any root level code that invokes a function needs to be after the function
  lines.push(moduleNode.data.rootCode);

  // order the functions

  // add the functions and sub functions
  const children = moduleNodes.filter(
    (node) => node.type === 'pureFunctionNode' && node.parentId === moduleId
  );

  const parsedFunctions = children.map((child) => {
    const newLines = getFunctionContent(nodes, child);
    return {
      id: child.id,
      functionName: child.data.functionName,
      rawCode: newLines.join('\n'),
    };
  });

  // for each function, check if any other functionn references it
  // if so, move it after that function

  children.forEach((child) => {
    const newLines = getFunctionContent(nodes, child);
    const references = findReferences(newLines.join('\n'));
    console.log('found references:', references);
    lines.push(...newLines);
  });

  const code = lines.join('\n');
  const newAst = parseWithRecast(code);

  return recast.prettyPrint(newAst).code;
};

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
  return imports.map((imp, index) => {
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
  fileInfo.functions.forEach((func) => {
    const newNodes = getNodesForFunctions(func, fullPath, newModuleId);
    nodes.push(...newNodes);
  });

  let allHandles = [];

  let { children, moduleWidth, moduleHeight } = layoutChildren(
    fileInfo,
    nodes,
    newModuleId
  );

  // need to do this here and not in parser because parser doesnt have fullPath

  const moduleHandles = getImportHandles(fileInfo.imports, newModuleId);
  allHandles = allHandles.concat(moduleHandles);

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

  children = children.reverse();

  // Internal edges, needs moving out
  const edges = getEdges(allHandles);

  return {
    id: newModuleId,
    moduleNode,
    // rootCode,
    children,
    edges,
  };
};
