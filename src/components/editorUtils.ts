import * as monaco from 'monaco-editor';
import { Position } from 'reactflow';

import { EDITOR } from '../constants';

import path from 'path-browserify';

import * as ts from 'typescript';

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
        console.log('function found', node);
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
      console.log('feature', feature);
      return 40 + feature.loc.start.column * EDITOR.FONT_SIZE;
    default:
      return 500;
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
        top: 10 + (EDITOR.FONT_SIZE + 4) * feature.line,
        background: getColor(feature),
        zIndex: 1000,
      },
    };
    if (feature.type === 'import') {
      // @ts-expect-error bleh
      newHandle.importPath = path.resolve(path.dirname(fullPath), fileName);
    }
    console.log('newhandles', newHandle);
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
