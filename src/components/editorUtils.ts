import * as monaco from 'monaco-editor';
import { Position } from 'reactflow';

import { EDITOR } from '../constants';

import path from 'path-browserify';

import * as ts from 'typescript';

const fsMap = {
  js: 'javascript',
  py: 'python',
  java: 'java',
  html: 'html',
  css: 'css',
  json: 'json',
  xml: 'xml',
  yaml: 'yaml',
  ts: 'typescript',
  tsx: 'typescript',
};
export const detectLanguage = (fileName) => {
  if (!fileName) {
    return 'plaintext';
  }
  const ext = fileName.split('.').pop();

  if (fsMap[ext]) {
    return fsMap[ext];
  }
  return 'plaintext';
};

// for now this just gets imports, exports, root level logic, and functions
// need to merge it with the function below it when we have a better idea of what we need
export function analyzeSourceFile(code) {
  const sourceFile = ts.createSourceFile(
    'tempFile.ts',
    code,
    ts.ScriptTarget.Latest,
    true
  );
  const imports = [];
  const exports = [];
  const rootLevelLogic = [];
  const functions = [];

  ts.forEachChild(sourceFile, (node) => {
    if (ts.isImportDeclaration(node)) {
      imports.push(node);
    } else if (ts.isExportAssignment(node)) {
      // Handles "export default ..."
      exports.push(node);
    } else if (ts.isExportDeclaration(node)) {
      // Handles "export { ... }"
      exports.push(node);
    } else if (ts.isVariableStatement(node)) {
      if (
        node.modifiers?.some((mod) => mod.kind === ts.SyntaxKind.ExportKeyword)
      ) {
        // Exported variable statement
        exports.push(node);
      } else {
        // Non-exported variable statement
        rootLevelLogic.push(node);
      }
    } else if (ts.isFunctionDeclaration(node)) {
      // Always add to functions
      functions.push(node);

      // Check if the function is exported
      if (
        node.modifiers?.some((mod) => mod.kind === ts.SyntaxKind.ExportKeyword)
      ) {
        exports.push(node);
      }
    } else if (
      !ts.isInterfaceDeclaration(node) &&
      !ts.isTypeAliasDeclaration(node)
    ) {
      rootLevelLogic.push(node);
    }
  });

  return { imports, exports, rootLevelLogic, functions };
}

export const getFeatures = (code: string) => {
  try {
    const sourceFile = ts.createSourceFile(
      'tempFile.ts',
      code,
      ts.ScriptTarget.Latest,
      true
    );

    const handles: Array<any> = [];

    const visit = (node: ts.Node) => {
      if (ts.isImportDeclaration(node)) {
        const importClause = node.importClause;
        if (importClause) {
          if (importClause.name) {
            // Default import
            const name = importClause.name.getText();
            const line =
              sourceFile.getLineAndCharacterOfPosition(node.getStart()).line +
              1;
            const fileName = (node.moduleSpecifier as ts.StringLiteral).text;
            handles.push({
              line,
              name,
              fileName,
              type: 'import',
            });
          }

          if (importClause.namedBindings) {
            if (ts.isNamedImports(importClause.namedBindings)) {
              // Named imports
              importClause.namedBindings.elements.forEach((element) => {
                const name = element.name.getText();
                const line =
                  sourceFile.getLineAndCharacterOfPosition(node.getStart())
                    .line + 1;
                const fileName = (node.moduleSpecifier as ts.StringLiteral)
                  .text;
                handles.push({
                  line,
                  name,
                  fileName,
                  type: 'import',
                });
              });
            } else if (ts.isNamespaceImport(importClause.namedBindings)) {
              // Namespace import (import * as ns from ...)
              const name = importClause.namedBindings.name.getText();
              const line =
                sourceFile.getLineAndCharacterOfPosition(node.getStart()).line +
                1;
              const fileName = (node.moduleSpecifier as ts.StringLiteral).text;
              handles.push({
                line,
                name,
                fileName,
                type: 'import',
              });
            }
          }
        }
      } else if (
        ts.isExportDeclaration(node) &&
        node.exportClause &&
        ts.isNamedExports(node.exportClause)
      ) {
        node.exportClause.elements.forEach((element) => {
          const name = element.name.getText();
          const line =
            sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;
          handles.push({
            line,
            name,
            type: 'export',
          });
        });
      } else if (ts.isExportAssignment(node)) {
        const name = (node.expression as ts.Identifier).getText();
        const line =
          sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;
        handles.push({
          line,
          name,
          type: 'export',
        });
      } else if (ts.isFunctionDeclaration(node) && node.name) {
        const name = node.name.getText();
        const line =
          sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;
        const isExported = !!(
          node.modifiers &&
          node.modifiers.some((mod) => mod.kind === ts.SyntaxKind.ExportKeyword)
        );

        handles.push({
          line,
          name,
          type: isExported ? 'export' : 'function',
        });
      } else if (
        ts.isVariableStatement(node) &&
        node.modifiers &&
        node.modifiers.some((mod) => mod.kind === ts.SyntaxKind.ExportKeyword)
      ) {
        node.declarationList.declarations.forEach((declaration) => {
          if (ts.isVariableDeclaration(declaration) && declaration.name) {
            const name = declaration.name.getText();
            const line =
              sourceFile.getLineAndCharacterOfPosition(node.getStart()).line +
              1;
            if (
              declaration.initializer &&
              (ts.isArrowFunction(declaration.initializer) ||
                ts.isFunctionExpression(declaration.initializer))
            ) {
              handles.push({
                line,
                name,
                type: 'export',
              });
            } else {
              handles.push({
                line,
                name,
                type: 'export',
              });
            }
          }
        });
      } else if (
        ts.isVariableDeclaration(node) &&
        node.initializer &&
        (ts.isArrowFunction(node.initializer) ||
          ts.isFunctionExpression(node.initializer))
      ) {
        const name = node.name.getText();
        const { line, character } = sourceFile.getLineAndCharacterOfPosition(
          node.getStart()
        );
        const { line: endLine, character: EndCharacter } =
          sourceFile.getLineAndCharacterOfPosition(node.getEnd());

        handles.push({
          line: line + 1,
          loc: {
            start: {
              line: line + 1,
              column: character,
            },
            end: {
              line: endLine + 1,
              column: EndCharacter,
            },
          },
          name,
          type: 'function',
        });
      }

      ts.forEachChild(node, visit);
    };

    ts.forEachChild(sourceFile, visit);

    return handles;
  } catch (e) {
    console.error(e);
    return [];
  }
};

const getHandlePosition = (feature) => {
  if (feature.type === 'import') {
    return Position.Right;
  }
  if (feature.type === 'export') {
    return Position.Left;
  }
};

const getLeftPosition = (feature) => {
  switch (feature.type) {
    case 'export':
      return -5;
    case 'function':
      return 40 + feature.loc.start.column * (EDITOR.FONT_SIZE - 4);
    default:
      return 500;
  }
};
const getTopPosition = (feature) => {
  switch (feature.type) {
    case 'function':
      return 5 + (EDITOR.FONT_SIZE + 4) * feature.line;
    default:
      return 10 + (EDITOR.FONT_SIZE + 4) * feature.line;
  }
};

const getColor = (feature) => {
  if (feature.type === 'import') {
    const isLocal =
      feature.fileName.startsWith('./') ||
      feature.fileName.startsWith('../') ||
      feature.fileName.startsWith('/');
    // if (isLocal) {
    //   for (const node of nodes) {
    //     if (feature.fileName.includes(node.data.fileName)) {
    //       return '#03ad1a';
    //     }
    //   }
    //   return '#b30f00';
    // }
    // if (settings.packageJson.dependencies[feature.fileName]) {
    //   return '#4287f5';
    // }
    return '#b30f00';
  }
  switch (feature.type) {
    case 'export':
      return '#03ad1a';
    case 'function':
      return '#888888';
    default:
      return '#000';
  }
};

const getMaxWidth = (lines) => {
  let maxWidth = 0;
  lines.forEach((line) => {
    maxWidth = Math.max(maxWidth, line.length);
  });
  console.log('maxWidth:', maxWidth);
  return maxWidth;
};

export const getEditorSize = (code) => {
  const lines = code.split('\n');
  const newHeight = 50 + lines.length * 15;
  const newWidth = 100 + getMaxWidth(lines) * 6;
  return { height: newHeight, width: newWidth };
};

export const getHandles = (nodeId, fullPath, code) => {
  const features = getFeatures(code);
  const handles = features.map((feature) => {
    const { name, type, fileName } = feature;
    const newHandle = {
      id: `${nodeId}-${type}-${name}`,
      name,
      nodeId,
      fileName: fileName || '',
      nodePath: fullPath || '',
      loc: feature.loc,
      type: 'source',
      handleType: feature.type,
      position: getHandlePosition(feature),
      style: {
        left: getLeftPosition(feature),
        top: getTopPosition(feature),
        background: getColor(feature),
        zIndex: 1000,
      },
    };
    console.log('loc', feature.loc);
    if (feature.type === 'import') {
      // @ts-expect-error bleh
      newHandle.importPath = path.resolve(path.dirname(fullPath), fileName);
    }
    return newHandle;
  });
  return handles;
};

export const removeTextChunk = (
  text,
  fromLine,
  toLine,
  startColumn = 0,
  endColumn = null
) => {
  const lines = text.split('\n');

  if (fromLine < 1 || toLine > lines.length || fromLine > toLine) {
    throw new Error('Invalid fromLine or toLine');
  }

  // Handle the case where endColumn is null or exceeds line length
  const adjustedEndColumn = (line, column) =>
    column === null || column > line.length ? line.length : column;

  // Extract the chunk and handle partial lines
  const extractedChunk = lines
    .slice(fromLine - 1, toLine)
    .map((line, index) => {
      if (index === 0 && fromLine === toLine) {
        return line.slice(startColumn, adjustedEndColumn(line, endColumn));
      } else if (index === 0) {
        return line.slice(startColumn);
      } else if (index === toLine - fromLine) {
        return line.slice(0, adjustedEndColumn(line, endColumn));
      } else {
        return line;
      }
    })
    .join('\n');

  // Remove the chunk and handle partial lines
  const newLines = lines
    .map((line, index) => {
      if (index + 1 === fromLine && fromLine === toLine) {
        return (
          line.slice(0, startColumn) +
          line.slice(adjustedEndColumn(line, endColumn))
        );
      } else if (index + 1 === fromLine) {
        return line.slice(0, startColumn);
      } else if (index + 1 === toLine) {
        return line.slice(adjustedEndColumn(line, endColumn));
      } else if (index + 1 > fromLine && index + 1 < toLine) {
        return '';
      } else {
        return line;
      }
    })
    .filter((line) => line !== '');

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
