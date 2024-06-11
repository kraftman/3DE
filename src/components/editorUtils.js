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
      enter: (node) => {
        if (node.type === 'ExportNamedDeclaration') {
          const identifier = node.declaration.declarations.find(
            (d) => d.id.type === 'Identifier'
          );
          const name = identifier.id.name;
          const line = node.loc.start.line;
          exports.push({ name, line });
        } else if (node.type === 'ExportDefaultDeclaration') {
          if (node.declaration.type === 'Identifier') {
            exports.push({
              name: node.declaration.name,
              line: node.loc.start.line,
            });
          } else {
            exports.push({ name: 'default', line: node.loc.start.line });
          }
        }
      },
    });
    return exports;
  } catch (e) {
    return [];
  }
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
