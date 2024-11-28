import * as ts from 'typescript';

export const findFunctions = (code) => {
  // Create a TypeScript program in memory
  let sourceFile;
  try {
    sourceFile = ts.createSourceFile(
      'tempFile.ts',
      code,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.JS
    );
  } catch (e) {
    console.log(e);
    return [];
  }
  const result = [];

  function visit(node) {
    if (ts.isCallExpression(node)) {
      result.push(node);
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return result;
};
