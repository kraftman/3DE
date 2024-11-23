import { mockModule } from '../screens/Flow/mocks';
import { v4 as uuid } from 'uuid';
import { findCallExpressions } from './astUtils.js';

import { parseCode } from './parser';

import { getEditorSize } from './codeUtils.js';

export const getModuleNodes = () => {
  const parsed = parseCode(mockModule);
  console.log('parsed:', parsed);
  const maxDepth = parsed.flatFunctions.reduce((acc, func) => {
    return Math.max(acc, func.depth);
  }, 0);

  const newModuleId = uuid();

  const children = [];

  let moduleWidth = 0;
  let moduleHeight = 0;

  for (let i = maxDepth; i >= 0; i--) {
    console.log('depth:', i);

    const functionsAtDepth = parsed.flatFunctions.filter(
      (func) => func.depth === i
    );
    let currentHeight = 0;
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
      const childWidth = localChildren.reduce((acc, child) => {
        return Math.max(acc, child.frameSize.width);
      }, 0);

      const height = localChildren.reduce((acc, child) => {
        return Math.max(acc, acc + child.frameSize.height);
      }, func.frameSize.height);
      // update the frameSize to include the children, for use in the parent

      const parent = parsed.flatFunctions.find(
        (parent) => parent.id === func.parentId
      );
      const frameWidth =
        localChildren.length > 0
          ? func.contentSize.width + childWidth
          : func.contentSize.width;
      func.frameSize = { width: frameWidth + 30, height: height + 50 };

      const frame = {
        id: func.id,
        data: {
          functionName: func.name,
          content: func.body,
          handles: handles,
        },
        type: 'pureFunctionNode',
        parentId: func.parentId || newModuleId,
        extent: 'parent',
        position: {
          x: parent ? parent.contentSize.width : 20,
          y: 30 + currentHeight + (parent ? parent.contentSize.height : 20),
        },
        style: {
          width: `${frameWidth + 20}px`,
          height: `${height + 30}px`,
        },
      };

      const handles = [];

      const functionCalls = findCallExpressions(func.localAst);

      const functionHandles = functionCalls.map((call, index) => {
        const line = call.node.loc.start.line;

        const key = 'func:' + call.name + ':out' + index;

        return {
          id: key,
          key: key,
          type: 'source',
          position: 'right',
          style: {
            top: 14 * line,
          },
          data: {
            name: call.name,
          },
        };
      });
      handles.concat(functionHandles);
      console.log('==== func', func);

      const codeFrame = {
        id: func.id + 'code',
        data: {
          content: func.body,
          funcInfo: func,
          handles,
        },
        type: 'code',
        parentId: frame.id,
        extent: 'parent',
        position: {
          x: 10,
          y: 30,
        },
        style: {
          width: `${func.contentSize.width}px`,
          height: `${func.contentSize.height}px`,
        },
      };

      children.push(codeFrame);
      children.push(frame);

      currentHeight += height + 50;

      console.log('pushed child:', children.length);
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
      id: imp.name + ':out',
      key: imp.name + ':out',
      type: 'source',
      position: 'right',
      style: {
        top: 100 + 30 * index,
        right: -100,
      },
      data: {
        name: imp.name,
      },
    };
  });

  const moduleNode = {
    id: newModuleId,
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
      id: name + ':in',
      key: name + ':in',
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

  return {
    moduleNode,
    rootCode,
    children: sortedChildren,
  };
};
