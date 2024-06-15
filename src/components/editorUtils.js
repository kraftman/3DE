import { parse } from 'acorn';
import estraverse from 'estraverse';
import * as monaco from 'monaco-editor';

export const getImports = (code) => {
  try {
    const ast = parse(code, { sourceType: 'module', locations: true });
    const imports = [];
    estraverse.traverse(ast, {
      enter: (node) => {
        if (node.type === 'ImportDeclaration') {
          const name = node.specifiers[0].local.name;
          const values = {
            line: node.loc.start.line,
            name,
            fileName: node.source.value,
          };
          imports.push(values);
        }
      },
    });
    return imports;
  } catch (e) {
    return [];
  }
};

export const getExports = (code) => {
  try {
    const ast = parse(code, { sourceType: 'module', locations: true });
    const exports = [];
    estraverse.traverse(ast, {
      enter: (node, parent) => {
        if (node.type === 'ExportNamedDeclaration') {
          const identifier = node.declaration.declarations.find(
            (d) => d.id.type === 'Identifier'
          );
          const name = identifier.id.name;
          const line = node.loc.start.line;
          exports.push({ name, line, type: 'export' });
        } else if (node.type === 'ExportDefaultDeclaration') {
          if (node.declaration.type === 'Identifier') {
            exports.push({
              name: node.declaration.name,
              line: node.loc.start.line,
              type: 'export',
            });
          } else {
            exports.push({
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
          const isDefaultExport = null; //exports.find(
          //(exp) => exp.name === node.id.name
          //);
          if (!isDefaultExport) {
            exports.push({
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
    console.log(exports);
    return exports;
  } catch (e) {
    console.log(e);
    return [];
  }
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
