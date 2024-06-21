import { parse } from 'acorn';
import estraverse from 'estraverse';
import * as monaco from 'monaco-editor';
import ReactFlow, {
  useNodesState,
  useEdgesState,
  MiniMap,
  Controls,
  Position,
  Background,
  useReactFlow,
  useUpdateNodeInternals,
} from 'reactflow';

export const getFeatures = (code) => {
  try {
    const ast = parse(code, { sourceType: 'module', locations: true });
    const handles = [];
    estraverse.traverse(ast, {
      enter: (node, parent) => {
        if (node.type === 'ImportDeclaration') {
          const name = node.specifiers[0].local.name;
          const values = {
            line: node.loc.start.line,
            name,
            fileName: node.source.value,
            type: 'import',
          };
          handles.push(values);
        } else if (node.type === 'ExportNamedDeclaration') {
          const identifier = node.declaration.declarations.find(
            (d) => d.id.type === 'Identifier'
          );
          const name = identifier.id.name;
          const line = node.loc.start.line;
          handles.push({ name, line, type: 'export' });
        } else if (node.type === 'ExportDefaultDeclaration') {
          if (node.declaration.type === 'Identifier') {
            handles.push({
              name: node.declaration.name,
              line: node.loc.start.line,
              type: 'export',
            });
          } else {
            handles.push({
              name: 'default',
              line: node.loc.start.line,
              type: 'export',
            });
          }
        } else if (
          node.type === 'VariableDeclarator' &&
          (node.init.type === 'ArrowFunctionExpression' ||
            node.init.type === 'FunctionExpression') &&
          parent.type === 'VariableDeclaration'
        ) {
          console.log(node.type, node);
          const isDefaultExport = null; //handles.find(
          //(exp) => exp.name === node.id.name
          //);
          if (!isDefaultExport) {
            handles.push({
              name: node.id.name,
              line: node.loc.start.line,
              end: node.id.loc.end.column,
              loc: node.loc,
              type: 'function',
            });
          }
          //exports.push({ name: node.id.name, line: node.loc.start.line });
        }
      },
    });

    return handles;
  } catch (e) {
    console.log(e);
    return [];
  }
};

const getHandlePosition = (feature) => {
  if (feature.type === 'import') {
    return Position.Left;
  }
  if (feature.type === 'export') {
    return Position.Right;
  }
};

const getLeftPosition = (feature) => {
  switch (feature.type) {
    case 'export':
      return -5;
    case 'function':
      return feature.end * 7 + 50;
    default:
      return 410;
  }
};

// const getColor = (feature) => {
//   if (feature.type === 'import') {
//     const isLocal =
//       feature.fileName.startsWith('./') ||
//       feature.fileName.startsWith('../') ||
//       feature.fileName.startsWith('/');
//     if (isLocal) {
//       for (const node of nodes) {
//         if (feature.fileName.includes(node.data.fileName)) {
//           return '#03ad1a';
//         }
//       }
//       return '#b30f00';
//     }
//     if (settings.packageJson.dependencies[feature.fileName]) {
//       return '#4287f5';
//     }
//     return '#b30f00';
//   }
//   switch (feature.type) {
//     case 'export':
//       return '#03ad1a';
//     case 'function':
//       return '#b30f00';
//     default:
//       return '#000';
//   }
// };

export const getHandles = (nodeId, code) => {
  const features = getFeatures(code);
  const handles = features.map((feature) => {
    const { name, line, type } = feature;
    return {
      id: `${type}-${name}-${line}`,
      name,
      nodeId,
      loc: feature.loc,
      type: 'source',
      handleType: feature.type,
      position: getHandlePosition(feature),
      style: {
        left: getLeftPosition(feature),
        top: -5 + 16 * feature.line,
        //background: getColor(feature),
        zIndex: 1000,
      },
    };
  });
  return handles;
};

export const removeTextChunk = (text, fromLine, toLine) => {
  const lines = text.split('\n');

  if (fromLine < 1 || toLine > lines.length || fromLine > toLine) {
    throw new Error('Invalid fromLine or toLine');
  }

  // Extract lines from fromLine to toLine (inclusive)
  const extractedChunk = lines.slice(fromLine - 1, toLine).join('\n');

  // Remove lines from fromLine to toLine (inclusive)
  const newLines = lines.slice(0, fromLine - 1).concat(lines.slice(toLine));

  // Join the remaining lines back into a single string
  const updatedText = newLines.join('\n');

  return {
    updatedText,
    extractedChunk,
  };
};

export const insertTextChunk = (text, chunk, line) => {
  const lines = text.split('\n');
  if (line > lines.length + 1) {
    const numOfNewLines = line - lines.length;
    //pad out with new lines
    for (let i = 0; i < numOfNewLines; i++) {
      lines.push('');
    }
    lines.push(chunk);
    return lines.join('\n');
  }
  if (line < 1) {
    return chunk + '\n' + text;
  }

  const newLines = lines
    .slice(0, line - 1)
    .concat(chunk)
    .concat(lines.slice(line - 1));
  return newLines.join('\n');
};

export const getDecorators = (text) => {
  const matches = [];
  const regex = /:string\b/g;

  let match;

  while ((match = regex.exec(text)) !== null) {
    const startLineNumber = text.substring(0, match.index).split('\n').length;
    const startColumn = match.index - text.lastIndexOf('\n', match.index - 1);
    const endLineNumber = text.substring(0, regex.lastIndex).split('\n').length;
    const endColumn =
      regex.lastIndex - text.lastIndexOf('\n', regex.lastIndex - 1);
    matches.push({
      range: new monaco.Range(
        startLineNumber,
        startColumn,
        endLineNumber,
        endColumn
      ),
      options: {
        beforeContentClassName: 'before-class',
        afterContentClassName: 'after-class',
        inlineClassName: 'match-class',
      },
    });
  }

  const newDecorations = matches.map((match) => ({
    range: match.range,
    options: match.options,
  }));
  return newDecorations;
};
