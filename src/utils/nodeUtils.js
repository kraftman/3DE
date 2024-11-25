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

export const getRaw = (module, node, children) => {
  // need to decide if this should be raw or asts

  const codeStrings = [];

  module.parsedAst.imports.forEach((imp) => {
    console.log('imp:', recast.print(imp.node).code);
    codeStrings.push(recast.print(imp.node).code);
  });
  console.log('codeStrings:', codeStrings);

  const mergedAst = {
    type: 'File',
    program: {
      type: 'Program',
      body: [],
      sourceType: 'module', // Adjust sourceType as needed
    },
  };

  //const raw = recast.print(mergedAst).code;
  //console.log('raw:', raw);
  return codeStrings.join('\n');
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
      functionId: func.id,
      moduleId: newModuleId,
      type: 'pureFunctionNode',
      data: {
        functionInfo: func,
        functionName: func.name,
        content: func.body,
      },
    };
    const codeNode = {
      id: frameNode.id + 'code',
      functionId: func.id,
      moduleId: newModuleId,
      parentId: frameNode.id,
      extent: 'parent',

      type: 'code',
      data: {
        content: func.body,
        funcInfo: func,
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
    let currentHeight = 30;
    // increase width by the widest child at this depth
    moduleWidth =
      moduleWidth +
      30 +
      functionsAtDepth.reduce((acc, func) => {
        return Math.max(acc, func.frameSize.width);
      }, 0);

    functionsAtDepth.forEach((func) => {
      const localChildren = parsed.flatFunctions.filter(
        (child) => child.parentId === func.id
      );
      // get widest child of this specific function
      const childWidth = localChildren.reduce((acc, child) => {
        return Math.max(acc, child.frameSize.width);
      }, 0);

      // accumulate heights of children of this function
      const height = localChildren.reduce((acc, child) => {
        return Math.max(acc, acc + child.frameSize.height);
      }, func.frameSize.height);
      // update the frameSize to include the children, for use in the parent

      const parentFunction = parsed.flatFunctions.find(
        (parent) => parent.id === func.parentId
      );
      const frameWidth =
        localChildren.length > 0
          ? func.contentSize.width + childWidth
          : func.contentSize.width;
      func.frameSize = { width: frameWidth + 30, height: height + 50 };

      let frameNode = nodes.find(
        (node) =>
          node.functionId === func.id && node.type === 'pureFunctionNode'
      );
      const parentNode = nodes.find(
        (node) => node.functionId === func.parentId
      );

      frameNode = {
        ...frameNode,
        data: {
          ...frameNode.data,
          // handles: handles,
        },
        parentId: parentNode ? parentNode.id : newModuleId,
        extent: 'parent',
        position: {
          x: parentFunction ? parentFunction.contentSize.width : 20,
          y:
            30 +
            currentHeight +
            (parentFunction ? parentFunction.contentSize.height : 20),
        },
        style: {
          width: `${frameWidth + 20}px`,
          height: `${height + 30}px`,
        },
      };

      // let handles = createHandles();

      let codeFrame = nodes.find(
        (node) => node.functionId === func.id && node.type === 'code'
      );
      codeFrame = {
        ...codeFrame,
        data: {
          ...codeFrame.data,
          // handles,
        },
      };

      children.push(codeFrame);
      children.push(frameNode);

      currentHeight += height + 50;
    });
    if (i === 0) {
      moduleHeight =
        moduleHeight +
        50 +
        functionsAtDepth.reduce((acc, func) => {
          return Math.max(acc, acc + func.frameSize.height);
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

  const moduleNode = {
    id: newModuleId,
    moduleId: newModuleId,
    data: {
      exports: parsed.exports,
      imports: parsed.imports,
      handles: moduleHandles,
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
    moduleId: newModuleId,
    data: {
      content: parsed.rootLevelCode.code,
      imports: parsed.imports,
      exports: parsed.exports,
      codeNode: parsed.rootLevelCode.node,
      handles: importHandles,
    },
    type: 'code',
    parentId: newModuleId,
    extent: 'parent',
    position: {
      x: 10,
      y: 30,
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
