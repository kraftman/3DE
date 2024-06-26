import * as acorn from 'acorn';
import tsPlugin from 'acorn-typescript';
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
        ts.isVariableDeclaration(node) &&
        node.initializer &&
        (ts.isArrowFunction(node.initializer) ||
          ts.isFunctionExpression(node.initializer))
      ) {
        const name = node.name.getText();
        const line =
          sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;
        handles.push({
          line,
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
  console.log('feature', feature, feature.type, feature.end * 7 + 50);
  switch (feature.type) {
    case 'export':
      return -5;
    case 'function':
      return -5;
    default:
      return 500;
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

export const getHandles = (nodeId, fullPath, code) => {
  const features = getFeatures(code);
  const handles = features.map((feature) => {
    const { name, type, fileName } = feature;
    console.log(name, type, fileName);
    const newHandle = {
      id: `${nodeId}-${type}-${name}`,
      name,
      nodeId,
      fileName: fileName || '',
      importPath:
        (fileName && path.resolve(path.dirname(fullPath), fileName)) || '',
      nodePath: fullPath || '',
      loc: feature.loc,
      type: 'source',
      handleType: feature.type,
      position: getHandlePosition(feature),
      style: {
        left: getLeftPosition(feature),
        top: 40 + 10 * feature.line,
        //background: getColor(feature),
        zIndex: 1000,
      },
    };
    console.log('newhandle', newHandle);
    return newHandle;
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
