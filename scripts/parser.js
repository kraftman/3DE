const ts = require('typescript');

function analyzeSourceFile(sourceFile) {
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

// Example usage:
const code = `
import { something } from './module';

export const a = 10;

function doSomething() {
  console.log('doing something');
}

export function doSomethingElse() {
  console.log('doing something else');
}

const b = a + 20;

export default b;
`;

const sourceFile = ts.createSourceFile(
  'tempFile.ts',
  code,
  ts.ScriptTarget.Latest,
  true
);

const result = analyzeSourceFile(sourceFile);

// Output results:
console.log(
  'Imports:',
  result.imports.map((imp) => imp.getText())
);
console.log(
  'Exports:',
  result.exports.map((exp) => exp.getText())
);
console.log(
  'Root-Level Logic:',
  result.rootLevelLogic.map((logic) => logic.getText())
);
console.log(
  'Functions:',
  result.functions.map((func) => func.getText())
);
