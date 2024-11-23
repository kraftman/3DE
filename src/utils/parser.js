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
    .map((node) => recast.print(node, { reuseWhitespace: true }).code)
    .join('\n');
  return extractedCode;
};

const createFunction = (path, name, parentId, depth) => {
  const node = path.node;
  const parameters = node.params.map(
    (param) => recast.print(param, { reuseWhitespace: true }).code
  );
  const body = extractNonFunctionStatements(node);

  const funcId = uuid();
  const nestedFunctions = getFunctions(node.body, funcId, depth + 1);
  const contentSize = getEditorSize(body);
  //const subtreeCode = recast.print(node).code;
  const newAst = recast.parse(body);
  console.log('newAst at parse:', recast.print(node).code);
  const funcInfo = {
    id: funcId,
    name,
    parentId,
    parameters,
    depth,
    body,
    nestedFunctions,
    node,
    localAst: newAst,
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

      const funcInfo = createFunction(path, name, parentId, depth);
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

      const funcInfo = createFunction(path, name, parentId, depth);
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

      const funcInfo = createFunction(path, name, parentId, depth);
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
      importNode.specifiers.forEach((spec) => {
        if (spec.type === 'ImportSpecifier') {
          // Named import
          imports.push({
            node: importNode,
            moduleSpecifier: importNode.source.value,
            name: spec.local.name, // Local name
            imported: spec.imported.name, // Original name
          });
        } else if (spec.type === 'ImportDefaultSpecifier') {
          // Default import
          imports.push({
            node: importNode,
            moduleSpecifier: importNode.source.value,
            name: spec.local.name, // Local name
          });
        } else if (spec.type === 'ImportNamespaceSpecifier') {
          // Namespace import
          imports.push({
            node: importNode,
            moduleSpecifier: importNode.source.value,
            name: spec.local.name, // Local name
          });
        }
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
        declarations: recast.print(exportNode, { reuseWhitespace: true }).code,
      });
      this.traverse(path);
    },
  });
  return myExports;
};

const getRootLevelCode = (ast) => {
  // Traverse the AST to prune nodes
  visit(ast, {
    visitProgram(path) {
      // Traverse through the body of the program
      path.get('body').each((nodePath) => {
        const node = nodePath.node;

        // Check if the node matches root-level conditions
        const isRootLevelNode =
          n.ImportDeclaration.check(node) ||
          ((n.ExportNamedDeclaration.check(node) ||
            n.ExportDefaultDeclaration.check(node)) &&
            !(
              n.FunctionDeclaration.check(node.declaration) ||
              n.FunctionExpression.check(node.declaration)
            )) ||
          (n.VariableDeclaration.check(node) &&
            node.kind === 'const' &&
            node.declarations.every(
              (decl) =>
                !n.FunctionExpression.check(decl.init) &&
                !n.ArrowFunctionExpression.check(decl.init)
            ));

        // Prune the node if it doesn't match
        if (!isRootLevelNode) {
          nodePath.prune();
        }
      });

      // Continue traversal after pruning
      return false;
    },
  });

  // Generate the modified code with preserved formatting
  console.log('new ast:', ast);
  const combinedCode = recast.print(ast, { reuseWhitespace: true }).code;

  return {
    body: ast.program.body,
    code: combinedCode,
    node: ast.program,
  };
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

  const printedCode = recast.print(ast, { reuseWhitespace: true }).code;
  const visibleCode = printedCode
    .replace(/ /g, '␣') // Spaces as '␣'
    .replace(/\t/g, '⇥') // Tabs as '⇥'
    .replace(/\n/g, '↵\n'); // Newlines as '↵'

  //console.log('=====', visibleCode);

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
