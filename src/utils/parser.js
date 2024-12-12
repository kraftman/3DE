const recast = require('recast');
const { namedTypes: n, visit } = require('ast-types');
import { getEditorSize } from '../components/editorUtils';
import * as murmur from 'murmurhash-js';

import { parseWithRecast } from './parseWithRecast';

export const extractNonFunctionStatements = (functionNode) => {
  //console.log('extracting from node', functionNode);
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
  node._id = funcId;

  const nestedFunctions = getFunctions(node.body, funcId, depth + 1);
  const contentSize = getEditorSize(body);
  const funcInfo = {
    id: funcId,
    name,
    parentId,
    type,
    parameters,
    depth,
    nestedFunctions,
    node,
    async: node.async,
    path,
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

      imports.push(importNode);

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

export const isRootLevelNode = (nodePath) => {
  const node = nodePath.node;

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
  return isRootLevelNode;
};

const getRootLevelCode = (ast) => {
  // Traverse the AST to prune nodes

  const rootPaths = [];

  visit(ast, {
    visitProgram(path) {
      // Traverse through the body of the program
      path.get('body').each((nodePath) => {
        const isRoot = isRootLevelNode(nodePath);
        if (isRoot) {
          //console.log('pruning node:', recast.print(nodePath.node).code);
          //nodePath.prune();
          rootPaths.push({
            line: rootPaths.length,
            path: nodePath,
          });
        }
      });

      // Continue traversal after pruning
      return false;
    },
  });

  // Generate the modified code with preserved formatting
  const combinedCode = recast.print(ast, { reuseWhitespace: true }).code;

  return rootPaths;
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

  const imports = getImports(ast);
  const myExports = getExports(ast);

  const nestedFunctions = getFunctions(ast.program);
  const flatFunctions = flattenFunctions(nestedFunctions);

  const rootLevelCode = getRootLevelCode(ast);

  return {
    imports,
    exports: myExports,
    functions: flatFunctions,
    rootLevelCode,
    flatFunctions,
    ast,
  };
};

export const findReferences = (raw) => {
  const references = [];

  const ast = parseWithRecast(raw);

  // Traverse the AST
  recast.types.visit(ast, {
    visitIdentifier(path) {
      // Skip declarations
      if (
        path.parentPath.node.type !== 'VariableDeclarator' && // Not in `const x = ...`
        path.parentPath.node.type !== 'FunctionDeclaration' && // Not in `function example`
        path.parentPath.node.type !== 'FunctionExpression' && // Not in `const x = function() {}`
        path.parentPath.node.type !== 'ArrowFunctionExpression' // Not in `const x = () => {}`
      ) {
        references.push(path.node.name);
      }
      this.traverse(path);
    },
    visitCallExpression(path) {
      // Record function invocations
      const callee = path.node.callee;
      if (callee.type === 'Identifier') {
        references.push(callee.name); // Simple function calls
      } else if (callee.type === 'MemberExpression') {
        // Handle calls like `object.method()`
        const objectName = callee.object.name || '(unknown)';
        const propertyName = callee.property.name || '(unknown)';
        references.push(`${objectName}.${propertyName}`);
      }
      this.traverse(path);
    },
  });

  return references;
};
