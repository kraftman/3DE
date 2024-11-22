const recast = require('recast');
const { namedTypes: n, visit } = require('ast-types');
const babelParser = require('@babel/parser');

function extractNonFunctionStatements(functionNode) {
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
}

export const parseCode = (code) => {
  const imports = [];
  const exports = [];
  const functions = [];
  const flatFunctions = [];
  const rootLevelCode = [];

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

  // Helper function to traverse functions
  function getFunctions(node, depth = 0) {
    const functionList = [];

    visit(node, {
      visitFunctionDeclaration(path) {
        const { node } = path;
        const name = node.id ? node.id.name : '<anonymous>';
        const parameters = node.params.map((param) => recast.print(param).code);

        const body = extractNonFunctionStatements(node);

        const nestedFunctions = getFunctions(node.body, depth + 1);
        const funcInfo = {
          node: node,
          name,
          parameters,
          depth,
          body,
          nestedFunctions,
        };
        functionList.push(funcInfo);
        flatFunctions.push(funcInfo);

        //this.traverse(path);
        return false;
      },

      visitFunctionExpression(path) {
        const { node } = path;
        let name = '<anonymous>';

        if (
          path.parentPath &&
          n.VariableDeclarator.check(path.parentPath.node)
        ) {
          name = path.parentPath.node.id.name;
        } else if (path.parentPath && n.Property.check(path.parentPath.node)) {
          name = path.parentPath.node.key.name;
        }

        const parameters = node.params.map((param) => recast.print(param).code);
        const body = extractNonFunctionStatements(node);

        const nestedFunctions = getFunctions(node.body, depth + 1);
        const funcInfo = {
          name,
          parameters,
          depth,
          body,
          nestedFunctions,
        };
        functionList.push(funcInfo);
        flatFunctions.push(funcInfo);

        //this.traverse(path);
        return false;
      },

      visitArrowFunctionExpression(path) {
        const { node } = path;
        let name = '<anonymous>';

        // Arrow functions are usually assigned to variables or properties
        if (
          path.parentPath &&
          n.VariableDeclarator.check(path.parentPath.node)
        ) {
          name = path.parentPath.node.id.name;
        } else if (path.parentPath && n.Property.check(path.parentPath.node)) {
          name = path.parentPath.node.key.name;
        }

        const parameters = node.params.map((param) => recast.print(param).code);
        const body =
          node.body.type === 'BlockStatement'
            ? recast.print(node.body).code
            : recast.print(node.body).code; // For concise arrow function bodies

        const nestedFunctions = getFunctions(node.body, depth + 1);
        const funcInfo = {
          name,
          parameters,
          depth,
          body,
          nestedFunctions,
        };
        functionList.push(funcInfo);
        flatFunctions.push(funcInfo);

        //this.traverse(path);
        return false;
      },
    });

    return functionList;
  }

  // Process imports
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

  // Process exports
  visit(ast, {
    visitExportNamedDeclaration(path) {
      const exportNode = path.node;
      exports.push({
        node: exportNode,
        name: exportNode.declaration?.id?.name || null,
        declarations: recast.print(exportNode).code,
      });
      this.traverse(path);
    },
  });

  // Process functions
  const functionNodes = getFunctions(ast.program);
  functions.push(...functionNodes);

  // Process root-level code
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

  return {
    imports,
    exports,
    functions,
    rootLevelCode,
    flatFunctions,
  };
};
