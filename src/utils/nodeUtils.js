import { mockModule } from '../screens/Flow/mocks';
import { v4 as uuid } from 'uuid';
import { findCallExpressions } from './astUtils.js';

import * as recast from 'recast';

import { parseWithRecast } from './parseWithRecast';

import { getEditorSize } from './codeUtils.js';

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

export const getRaw = (moduleId, moduleNodes) => {
  // need to decide if this should be raw or asts

  const codeStrings = [];

  const moduleNode = moduleNodes.find(
    (node) => node.id === moduleId && node.type === 'module'
  );

  moduleNode.data.imports.forEach((imp) => {
    codeStrings.push(recast.print(imp.node).code);
  });

  getFunctionContent(codeStrings, moduleNodes, moduleId);

  const rootCode = moduleNodes.find(
    (node) => node.type === 'code' && node.parentId === moduleId
  );
  codeStrings.push(rootCode.data.content);

  const code = codeStrings.join('\n');
  const newAst = parseWithRecast(code);

  //return codeStrings.join('\n');
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
      funcName: imp.name,
      refType: 'import',
      id: moduleId + '-' + imp.name + ':out',
      key: imp.name + ':out',
      type: 'source',
      position: 'right',
      style: {
        top: 100 + 30 * index,
        right: 0,
        borderColor: imp.importType === 'local' ? 'blue' : 'green',
      },
      data: {
        name: imp.name,
        fullPath: imp.fullPath,
        importType: imp.importType,
      },
    };
  });
};

export const getModuleNodes = (parsed) => {
  const maxDepth = parsed.functions.reduce((acc, func) => {
    return Math.max(acc, func.depth);
  }, 0);

  const fullPath = parsed.index;

  const newModuleId = uuid();

  const nodes = [];
  parsed.functions.forEach((func) => {
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
        moduleId: newModuleId,
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
        moduleId: newModuleId,
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
    nodes.push(frameNode);
    nodes.push(codeNode);
  });

  const children = [];
  let allHandles = [];

  let moduleWidth = 100;
  let moduleHeight = 100;

  for (let i = maxDepth; i >= 0; i--) {
    const functionsAtDepth = parsed.functions.filter(
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
  console.log('parsed imports:', parsed.imports);
  const imports = parsed.imports.map((imp) => {
    const impPath = imp.moduleSpecifier;
    const isLocal = impPath.startsWith('.') || impPath.startsWith('/');
    const impFullPath =
      isLocal && path.resolve(path.dirname(fullPath), impPath);
    return {
      ...imp,
      importType: isLocal ? 'local' : 'module',
      fullPath: impFullPath,
    };
  });

  const moduleHandles = getImportHandles(imports, newModuleId);
  allHandles = allHandles.concat(moduleHandles);

  const baseSize = getEditorSize(parsed.rootCode.code);
  moduleWidth = Math.max(moduleWidth, baseSize.width);
  moduleHeight = Math.max(moduleHeight, baseSize.height);

  const moduleNode = {
    id: newModuleId,
    data: {
      exports: parsed.exports,
      imports: imports,
      handles: moduleHandles,
      moduleId: newModuleId,
      fullPath: fullPath,
      width: moduleWidth + 30,
      height: moduleHeight + 60,
      rootCode: parsed.rootCode.code,
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

  const rootSize = getEditorSize(parsed.rootCode.code);

  const importDefinitons = parsed.rootCode.node.body.filter((node) => {
    return node.type === 'ImportDeclaration';
  });

  const importHandles = importDefinitons?.map((node) => {
    const line = node.loc.start.line;
    let name = '';
    if (node.specifiers) {
      name =
        node.specifiers[0]?.local.name || node.specifiers[0]?.imported.name;
    }
    return {
      moduleId: newModuleId,
      id: name + ':in',
      key: name + ':in',
      funcName: name,
      parentId: newModuleId,
      refType: 'import',
      type: 'source',
      position: 'left',
      style: {
        top: 14 * line,
      },
      data: {
        name,
      },
    };
  });

  // const rootCode = {
  //   id: uuid(),
  //   data: {
  //     content: parsed.rootCode.code,
  //     imports: parsed.imports,
  //     exports: parsed.exports,
  //     handles: importHandles,
  //     moduleId: newModuleId,
  //   },
  //   type: 'code',
  //   parentId: newModuleId,
  //   extent: 'parent',
  //   position: {
  //     x: 10,
  //     y: 50,
  //   },
  //   style: {
  //     width: `${rootSize.width}px`,
  //     height: `${rootSize.height}px`,
  //   },
  // };

  const sortedChildren = children.reverse();

  // Internal edges, needs moving out
  const edges = getEdges(allHandles);

  return {
    id: newModuleId,
    moduleNode,
    // rootCode,
    children: sortedChildren,
    edges,
    parsedAst: parsed,
  };
};
