const recast = require('recast');

import path from 'path-browserify';

const { namedTypes: n, visit, builders: b } = require('ast-types');

export function findCallExpressions(ast) {
  const callExpressions = [];
  const ignoreList = ['console.log', 'console.error', 'console.warn'];

  // Use recast's `visit` function to traverse the AST
  recast.types.visit(ast, {
    visitCallExpression(path) {
      // Add the current CallExpression node to the results

      const node = path.node;
      let functionName = null;
      if (node.callee.type === 'Identifier') {
        functionName = node.callee.name; // e.g., `myFunction()`
      } else if (node.callee.type === 'MemberExpression') {
        // For member expressions like `console.log` or `Math.max`
        functionName = recast.print(node.callee, {
          reuseWhitespace: true,
        }).code;
      }

      if (!ignoreList.includes(functionName)) {
        callExpressions.push({ node: path.node, name: functionName });
      }

      // Continue traversing
      this.traverse(path);
    },
  });

  return callExpressions;
}

export function replaceImports(thisPath, ast, exportNodes) {
  // 1. Remove all existing import declarations
  ast.program.body = ast.program.body.filter(
    (node) => node.type !== 'ImportDeclaration'
  );

  // 2. Group exports by relative path
  const groupedImports = {};
  exportNodes.forEach((exportNode) => {
    let relativePath = path.relative(path.dirname(thisPath), exportNode.path);
    if (!relativePath.startsWith('.') && !path.isAbsolute(relativePath)) {
      relativePath = `.${path.sep}${relativePath}`;
    }
    console.log('relativePath', relativePath);
    if (!groupedImports[relativePath]) {
      groupedImports[relativePath] = new Set();
    }
    groupedImports[relativePath].add(exportNode.name);
  });

  // 3. Create and insert fresh import declarations
  Object.entries(groupedImports).forEach(([importPath, names]) => {
    console.log('importPath', importPath);
    const specifiers = Array.from(names).map((name) =>
      b.importSpecifier(b.identifier(name))
    );
    console.log('specifiers', specifiers);
    const importDeclaration = b.importDeclaration(
      specifiers,
      b.literal(importPath)
    );
    console.log('creating new import, ', importDeclaration);
    // Insert at the top of the file
    ast.program.body.unshift(importDeclaration);
  });
  console.log(' new ast', ast);
}

export const generateFunctionSignature = (funcInfo) => {
  const node = funcInfo.node;

  if (!node || !node.params) {
    throw new Error('Invalid funcInfo: node or params missing.');
  }

  // Helper function to generate parameter representation
  function paramToString(param) {
    if (param.type === 'Identifier') {
      // Simple parameter (e.g., x)
      return param.name;
    } else if (param.type === 'AssignmentPattern') {
      // Default values (e.g., x = 10)
      return `${paramToString(param.left)} = ${
        recast.print(param.right, { reuseWhitespace: true }).code
      }`;
    } else if (param.type === 'RestElement') {
      // Rest parameters (e.g., ...args)
      return `...${paramToString(param.argument)}`;
    } else if (param.type === 'ObjectPattern') {
      // Destructured object (e.g., { a, b })
      const properties = param.properties.map((prop) => {
        if (prop.type === 'Property') {
          return `${
            prop.key.name ||
            recast.print(prop.key, { reuseWhitespace: true }).code
          }`;
        }
        return recast.print(prop, { reuseWhitespace: true }).code;
      });
      return `{ ${properties.join(', ')} }`;
    } else if (param.type === 'ArrayPattern') {
      // Destructured array (e.g., [a, b])
      const elements = param.elements.map((el) =>
        el ? paramToString(el) : ''
      );
      return `[${elements.join(', ')}]`;
    } else {
      // Catch-all: print the node as-is
      return recast.print(param, { reuseWhitespace: true }).code;
    }
  }

  // Generate the function parameters signature
  const paramsSignature = node.params.map(paramToString).join(', ');

  // Determine the function name
  let functionName = 'anonymous';

  if (node.id && node.id.name) {
    functionName = node.id.name;
  } else if (funcInfo.type === 'arrowFunctionExpression') {
    // Check if the parent node is a VariableDeclarator
    const parent = funcInfo.path.parentPath.node;
    if (
      parent &&
      parent.type === 'VariableDeclarator' &&
      parent.id &&
      parent.id.type === 'Identifier'
    ) {
      functionName = parent.id.name;
    }
  }

  // Handle the type of function
  let prefix = '';
  if (funcInfo.type === 'functionDeclaration') {
    prefix = '';
  } else if (funcInfo.type === 'functionExpression') {
    prefix = '';
  } else if (funcInfo.type === 'arrowFunctionExpression') {
    prefix = '';
  }

  // Construct the final signature
  const signature = `${prefix}${functionName} (${paramsSignature})`;

  return signature;
};
