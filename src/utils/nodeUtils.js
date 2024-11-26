import { mockModule } from '../screens/Flow/mocks';
import { v4 as uuid } from 'uuid';
import { findCallExpressions } from './astUtils.js';

import * as recast from 'recast';

import { parseCode } from './parser';

import { getEditorSize } from './codeUtils.js';
import * as murmur from 'murmurhash-js';

export const findChildren = (nodes, parentId) => {
  //rucursively find children from nodes and add to a flat array of children
  let children = [];
  const foundChildren = nodes.filter((node) => node.parentId === parentId);
  foundChildren.forEach((child) => {
    children.push(child.id);
    children = children.concat(findChildren(nodes, child.id));
  });
  return children;
};

function generateFunctionSignature(functionName, functionType, functionArgs) {
  const args = functionArgs.join(', ');

  switch (functionType) {
    case 'functionExpression':
      return `const ${functionName} = function(${args}) { `;

    case 'functionDeclaration':
      return `function ${functionName}(${args}) { `;

    case 'arrowFunctionExpression':
      return `const ${functionName} = (${args}) => { `;

    default:
      throw new Error(`Unknown function type: ${functionType}`);
  }
}

const getFunctionContent = (codeStrings, nodes, parentId) => {
  const codeNodes = nodes.filter(
    (node) => node.parentId === parentId && node.type === 'pureFunctionNode'
  );
  codeNodes.forEach((codeNode) => {
    const { functionName, functionType, functionArgs } = codeNode.data;
    const signature = generateFunctionSignature(
      functionName,
      functionType,
      functionArgs
    );
    codeStrings.push(signature);
    codeStrings.push(codeNode.data.content);
    getFunctionContent(codeStrings, nodes, codeNode.id);
    codeStrings.push('}');
  });
};

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
  const newAst = recast.parse(code);

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

export const getModuleNodes = (parsed) => {
  const maxDepth = parsed.flatFunctions.reduce((acc, func) => {
    return Math.max(acc, func.depth);
  }, 0);

  const newModuleId = uuid();

  const nodes = [];
  parsed.flatFunctions.forEach((func) => {
    const frameNode = {
      id: uuid(),
      type: 'pureFunctionNode',
      data: {
        functionName: func.name,
        functionType: func.type,
        functionArgs: func.parameters,
        content: func.body,
        depth: func.depth,
        functionId: func.id,
        moduleId: newModuleId,
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

  let moduleWidth = 0;
  let moduleHeight = 0;

  for (let i = maxDepth; i >= 0; i--) {
    const functionsAtDepth = parsed.flatFunctions.filter(
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

  const moduleHandles = parsed.imports.map((imp, index) => {
    return {
      moduleId: newModuleId,
      parentId: newModuleId,
      funcName: imp.name,
      refType: 'import',
      id: imp.name + ':out',
      key: imp.name + ':out',
      type: 'source',
      position: 'right',
      style: {
        top: 100 + 30 * index,
        right: -50,
      },
      data: {
        name: imp.name,
      },
    };
  });
  allHandles = allHandles.concat(moduleHandles);

  const baseSize = getEditorSize(parsed.rootLevelCode.code);
  moduleWidth = Math.max(moduleWidth, baseSize.width);
  moduleHeight = Math.max(moduleHeight, baseSize.height);

  const moduleNode = {
    id: newModuleId,
    data: {
      exports: parsed.exports,
      imports: parsed.imports,
      handles: moduleHandles,
      moduleId: newModuleId,
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
  const rootSize = getEditorSize(parsed.rootLevelCode.code);

  const importDefinitons = parsed.rootLevelCode.node.body.filter((node) => {
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

  const rootCode = {
    id: uuid(),
    data: {
      content: parsed.rootLevelCode.code,
      imports: parsed.imports,
      exports: parsed.exports,
      handles: importHandles,
      moduleId: newModuleId,
    },
    type: 'code',
    parentId: newModuleId,
    extent: 'parent',
    position: {
      x: 10,
      y: 50,
    },
    style: {
      width: `${rootSize.width}px`,
      height: `${rootSize.height}px`,
    },
  };

  const sortedChildren = children.reverse();

  const edges = getEdges(allHandles);

  return {
    id: newModuleId,
    moduleNode,
    rootCode,
    children: sortedChildren,
    edges,
    parsedAst: parsed,
  };
};
