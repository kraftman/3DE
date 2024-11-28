// Example TypeScript code as a string
const code = `
import { foo } from "bar";

  export function hello() {
    function nested() {}
    const arrow = () => {
      function doubleNested() {}
  };
  }

  const myFunc = () => {
    console.log('meep')
    }

  const x = 42;
`;
const recast = require('recast');
const { namedTypes: n, visit } = require('ast-types');

const parseCode = (code) => {
  const ast = recast.parse(code, {
    parser: require('recast/parsers/typescript'),
  });

  const imports = [];
  const exports = [];
  const functions = [];
  const rootLevelCode = [];

  // Helper function to traverse functions
  function getFunctions(node, depth = 0) {
    const functionList = [];

    visit(node, {
      visitFunctionDeclaration(path) {
        const { node } = path;
        const name = node.id ? node.id.name : '<anonymous>';
        const parameters = node.params.map((param) => recast.print(param).code);
        const body = node.body ? recast.print(node.body).code : null;

        functionList.push({
          name,
          parameters,
          depth,
          body,
          nestedFunctions: getFunctions(node.body, depth + 1),
        });

        this.traverse(path);
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
        const body = node.body ? recast.print(node.body).code : null;

        functionList.push({
          name,
          parameters,
          depth,
          body,
          nestedFunctions: getFunctions(node.body, depth + 1),
        });

        this.traverse(path);
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

        functionList.push({
          name,
          parameters,
          depth,
          body,
          nestedFunctions: getFunctions(node.body, depth + 1),
        });

        this.traverse(path);
      },
    });

    return functionList;
  }

  // Process imports
  visit(ast, {
    visitImportDeclaration(path) {
      const importNode = path.node;
      imports.push({
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
  };
};

const {
  imports,
  exports: myExports,
  functions,
  rootLevelCode,
} = parseCode(code);
console.log('Imports:', imports);
console.log('Exports:', myExports);
console.log('Functions:', functions);
console.log('Root-Level Code:', rootLevelCode);
