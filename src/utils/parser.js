const recast = require('recast');
const { namedTypes: n, visit } = require('ast-types');
const babelParser = require('@babel/parser');
const { v4: uuid } = require('uuid');
import { getEditorSize } from '../components/editorUtils';

const extractNonFunctionStatements = (functionNode) => {
  const nonFunctionNodes = functionNode.body.body.filter(
    (node) =>
      !n.FunctionDeclaration.check(node) && // Exclude declared functions
      !(
        n.VariableDeclaration.check(node) &&
        node.declarations.some(
          (declaration) =>
            declaration.init &&
            (n.FunctionExpression.check(declaration.init) ||
              n.ArrowFunctionExpression.check(declaration.init))
        )
      ) // Exclude function expressions
  );
  const extractedCode = nonFunctionNodes
    .map((node) => recast.print(node).code)
    .join('\n');
  return extractedCode;
};

const createFunction = (node, name, parentId, depth) => {
  const parameters = node.params.map((param) => recast.print(param).code);
  const body = extractNonFunctionStatements(node);

  const funcId = uuid();
  const nestedFunctions = getFunctions(node.body, funcId, depth + 1);
  const contentSize = getEditorSize(body);
  const funcInfo = {
    id: funcId,
    name,
    parentId,
    parameters,
    depth,
    body,
    nestedFunctions,
    node,
    contentSize,
    frameSize: {
      ...contentSize,
    },
  };
  return funcInfo;
};

function getFunctions(node, parentId = null, depth = 0) {
  const functionList = [];

  visit(node, {
    visitFunctionDeclaration(path) {
      const { node } = path;
      const name = node.id ? node.id.name : '<anonymous>';

      const funcInfo = createFunction(node, name, parentId, depth);
      functionList.push(funcInfo);

      return false;
    },

    visitFunctionExpression(path) {
      const { node } = path;
      let name = '<anonymous>';

      if (path.parentPath && n.VariableDeclarator.check(path.parentPath.node)) {
        name = path.parentPath.node.id.name;
      } else if (path.parentPath && n.Property.check(path.parentPath.node)) {
        name = path.parentPath.node.key.name;
      }

      const funcInfo = createFunction(node, name, parentId, depth);
      functionList.push(funcInfo);
      functionList.push(funcInfo);

      return false;
    },

    visitArrowFunctionExpression(path) {
      const { node } = path;
      let name = '<anonymous>';

      // Arrow functions are usually assigned to variables or properties
      if (path.parentPath && n.VariableDeclarator.check(path.parentPath.node)) {
        name = path.parentPath.node.id.name;
      } else if (path.parentPath && n.Property.check(path.parentPath.node)) {
        name = path.parentPath.node.key.name;
      }

      const funcInfo = createFunction(node, name, parentId, depth);
      functionList.push(funcInfo);

      return false;
    },
  });

  return functionList;
}

const getImports = (ast) => {
  const imports = [];
  visit(ast, {
    visitImportDeclaration(path) {
      const importNode = path.node;
      imports.push({
        node: importNode,
        moduleSpecifier: importNode.source.value,
        namedImports: importNode.specifiers
          .filter((spec) => spec.type === 'ImportSpecifier')
          .map((spec) => spec.imported.name),
      });
      this.traverse(path);
    },
  });
  return imports;
};

const getExports = (ast) => {
  const myExports = [];
  visit(ast, {
    visitExportNamedDeclaration(path) {
      const exportNode = path.node;
      myExports.push({
        node: exportNode,
        name: exportNode.declaration?.id?.name || null,
        declarations: recast.print(exportNode).code,
      });
      this.traverse(path);
    },
  });
  return myExports;
};

const getRootLevelCode = (ast) => {
  const rootLevelCode = [];
  ast.program.body.forEach((node) => {
    if (
      !n.ImportDeclaration.check(node) &&
      !n.ExportNamedDeclaration.check(node) &&
      !n.FunctionDeclaration.check(node) &&
      !n.VariableDeclaration.check(node) // Skip variables, as they may hold functions
    ) {
      rootLevelCode.push(recast.print(node).code);
    }
  });
  return rootLevelCode;
};

const flattenFunctions = (functions) => {
  const flatFunctions = [];
  functions.forEach((func) => {
    flatFunctions.push(func);
    flatFunctions.push(...flattenFunctions(func.nestedFunctions));
  });
  return flatFunctions;
};

export const parseCode = (code) => {
  let ast = null;
  try {
    ast = recast.parse(code, {
      parser: {
        parse: (source) =>
          babelParser.parse(source, {
            sourceType: 'module',
            plugins: ['typescript', 'jsx'], // Add plugins as needed
          }),
      },
    });
  } catch (e) {
    console.log('error parsing code:', e);
    return {
      imports,
      exports,
      functions,
      rootLevelCode,
    };
  }

  const imports = getImports(ast);
  const myExports = getExports(ast);

  const functions = getFunctions(ast.program);
  const flatFunctions = flattenFunctions(functions);

  const rootLevelCode = getRootLevelCode(ast);

  return {
    imports,
    exports: myExports,
    functions,
    rootLevelCode,
    flatFunctions,
  };
};
