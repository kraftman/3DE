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
        console.log('functionName in callexp', functionName);
        callExpressions.push({ node: path.node, name: functionName });
      }

      // Continue traversing
      this.traverse(path);
    },
  });

  return callExpressions;
}
