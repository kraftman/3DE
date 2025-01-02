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

const removeFunction = (path, functionId) => {
  if (path.node._id && path.node._id === functionId) {
    // For arrow functions in variable declarations, remove the entire declaratio
    if (path.parent && path.parent.type === 'VariableDeclarator') {
      path.parent.prune();
    } else {
      path.prune();
    }
  }
};

export const removeFunctionFromAst = (ast, functionId) => {
  console.log('removing function:', functionId);
  visit(ast, {
    visitExportNamedDeclaration(path) {
      if (path.node.declaration?.declarations?.[0]?.init?._id === functionId) {
        path.prune();
      }
      this.traverse(path);
    },
    visitVariableDeclarator(path) {
      if (path.node.init && path.node.init._id === functionId) {
        path.prune();
      }
      this.traverse(path);
    },
    visitFunctionDeclaration(path) {
      removeFunction(path, functionId);
      this.traverse(path);
    },
    visitFunctionExpression(path) {
      removeFunction(path, functionId);
      this.traverse(path);
    },
    visitArrowFunctionExpression(path) {
      removeFunction(path, functionId);
      this.traverse(path);
    },
    visitObjectMethod(path) {
      removeFunction(path, functionId);
      this.traverse(path);
    },
    visitClassMethod(path) {
      removeFunction(path, functionId);
      this.traverse(path);
    },
  });
  console.log('after removal ast:', ast);
  console.log('after removal:', recast.print(ast).code);
};

export const addFunctionToAst = (ast, functionAst) => {
  visit(ast, {
    visitProgram(path) {
      path.node.body.push(functionAst);
      return false;
    },
  });
};
