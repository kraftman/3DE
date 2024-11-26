const recast = require('recast');
const { namedTypes: n, visit } = require('ast-types');
import { getEditorSize } from '../components/editorUtils';
import * as murmur from 'murmurhash-js';

import { parseWithRecast } from './parseWithRecast';

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

const createFunction = (path, name, parentId, depth, type) => {
  const node = path.node;
  const parameters = node.params.map(
    (param) => recast.print(param, { reuseWhitespace: true }).code
  );
  const body = extractNonFunctionStatements(node);

  const funcId = murmur.murmur3(name + parentId + body);
  const nestedFunctions = getFunctions(node.body, funcId, depth + 1);
  const contentSize = getEditorSize(body);
  //const subtreeCode = recast.print(node).code;
  //const newAst = parseWithRecast(body);
  const funcInfo = {
    id: funcId,
    name,
    parentId,
    type,
    parameters,
    depth,
    body,
    nestedFunctions,
    node,
    path,
    //localAst: newAst,
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

      const funcInfo = createFunction(
        path,
        name,
        parentId,
        depth,
        'functionDeclaration'
      );
      functionList.push(funcInfo);

      return false;
    },

    visitFunctionExpression(path) {
      const { node } = path;

      // Check if this function is an argument of a CallExpression
      if (
        path.parentPath &&
        n.CallExpression.check(path.parentPath.node) &&
        path.parentPath.node.arguments.includes(node)
      ) {
        return false; // Ignore this function
      }

      let name = '<anonymous>';
      if (path.parentPath && n.VariableDeclarator.check(path.parentPath.node)) {
        name = path.parentPath.node.id.name;
      } else if (path.parentPath && n.Property.check(path.parentPath.node)) {
        name = path.parentPath.node.key.name;
      }

      const funcInfo = createFunction(
        path,
        name,
        parentId,
        depth,
        'functionExpression'
      );
      functionList.push(funcInfo);

      return false;
    },

    visitArrowFunctionExpression(path) {
      const { node } = path;

      // Check if this function is an argument of a CallExpression
      if (
        path.parentPath &&
        n.CallExpression.check(path.parentPath.node) &&
        path.parentPath.node.arguments.includes(node)
      ) {
        return false; // Ignore this function
      }

      let name = '<anonymous>';
      if (path.parentPath && n.VariableDeclarator.check(path.parentPath.node)) {
        name = path.parentPath.node.id.name;
      } else if (path.parentPath && n.Property.check(path.parentPath.node)) {
        name = path.parentPath.node.key.name;
      }

      const funcInfo = createFunction(
        path,
        name,
        parentId,
        depth,
        'arrowFunctionExpression'
      );
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
        console.log('checking node:', nodePath);

        // Check if the node matches root-level conditions, excluding imports
        const isRootLevelNode =
          // Exclude ImportDeclaration and FunctionDeclaration nodes
          !n.ImportDeclaration.check(node) &&
          !n.FunctionDeclaration.check(node) &&
          !(
            n.VariableDeclaration.check(node) &&
            node.declarations.some(
              (declaration) =>
                n.FunctionExpression.check(declaration.init) ||
                n.ArrowFunctionExpression.check(declaration.init)
            )
          ) &&
          // Exclude ExportNamedDeclarations containing FunctionDeclarations
          !(
            n.ExportNamedDeclaration.check(node) &&
            (n.FunctionDeclaration.check(node.declaration) || // Handles `export function`
              (n.VariableDeclaration.check(node.declaration) && // Handles `export const`
                node.declaration.declarations.some(
                  (declaration) =>
                    n.FunctionExpression.check(declaration.init) ||
                    n.ArrowFunctionExpression.check(declaration.init)
                )))
          );

        // Prune the node if it's an ImportDeclaration or doesn't match
        if (n.ImportDeclaration.check(node) || !isRootLevelNode) {
          //console.log('pruning node:', recast.print(node).code);
          nodePath.prune();
        }
      });

      // Continue traversal after pruning
      return false;
    },
  });

  // Generate the modified code with preserved formatting
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
    ast = parseWithRecast(code);
  } catch (e) {
    console.log('error parsing code:', e);
    return {
      imports: [],
      exports: [],
      functions: [],
      rootLevelCode: null,
    };
  }
  console.log('parsed ast:', ast);
  console.log('printe d:', recast.print(ast).code);

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
