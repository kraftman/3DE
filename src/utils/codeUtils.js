const { namedTypes: n, visit } = require('ast-types');
import * as recast from 'recast';

const getMaxWidth = (lines) => {
  let maxWidth = 0;
  lines.forEach((line) => {
    maxWidth = Math.max(maxWidth, line.length);
  });
  return maxWidth;
};

export const getAstSize = (ast) => {
  const code = recast.print(ast, { reuseWhitespace: true }).code;
  return getEditorSize(code);
};

export const getEditorSize = (code) => {
  const lines = code.split('\n');
  const newHeight = 50 + lines.length * 15;
  const newWidth = 100 + getMaxWidth(lines) * 6;
  return { height: newHeight, width: newWidth };
};

export const removeFunctionFromAst = (ast, functionId) => {
  visit(ast, {
    visitFunctionDeclaration(path) {
      if (path.node._id && path.node._id === functionId) {
        path.prune();
        return false;
      }

      this.traverse(path);
    },
  });
};

export const addFunctionToAst = (ast, functionAst) => {
  visit(ast, {
    visitProgram(path) {
      path.node.body.push(functionAst);
      return false;
    },
  });
};
