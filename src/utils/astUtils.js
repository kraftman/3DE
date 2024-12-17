const recast = require('recast');

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
        functionName = recast.print(node.callee).code;
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
      return `${paramToString(param.left)} = ${recast.print(param.right).code}`;
    } else if (param.type === 'RestElement') {
      // Rest parameters (e.g., ...args)
      return `...${paramToString(param.argument)}`;
    } else if (param.type === 'ObjectPattern') {
      // Destructured object (e.g., { a, b })
      const properties = param.properties.map((prop) => {
        if (prop.type === 'Property') {
          return `${prop.key.name || recast.print(prop.key).code}`;
        }
        return recast.print(prop).code;
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
      return recast.print(param).code;
    }
  }

  // Generate the function parameters signature
  const paramsSignature = node.params.map(paramToString).join(', ');

  // Determine the function name (if it exists)
  const functionName = node.id && node.id.name ? node.id.name : 'anonymous';

  // Handle the type of function
  let prefix = '';
  if (funcInfo.type === 'functionDeclaration') {
    prefix = 'function ';
  } else if (funcInfo.type === 'functionExpression') {
    prefix = 'function ';
  } else if (funcInfo.type === 'arrowFunctionExpression') {
    prefix = '';
  }

  // Construct the final signature
  const signature = `${prefix}${functionName}(${paramsSignature})`;

  return signature;
};
