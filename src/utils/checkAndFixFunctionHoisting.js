const recast = require('recast');
const b = recast.types.builders;

function getLineNumber(node) {
  return node && node.loc && node.loc.start ? node.loc.start.line : Infinity;
}

export function checkAndFixFunctionHoisting(ast) {
  // Track function declarations, exports, and their usages
  const functionDeclarations = new Map();
  const functionCalls = [];
  const exports = new Map();

  // Tracking top-level statements
  const topLevelStatements = {
    imports: [],
    variableDeclarations: [],
    otherStatements: [],
  };

  // Collect top-level statements
  recast.visit(ast, {
    visitImportDeclaration(path) {
      topLevelStatements.imports.push(path);
      this.traverse(path);
    },
    visitVariableDeclaration(path) {
      // Only track top-level variable declarations
      if (path.parent.node.type === 'Program') {
        topLevelStatements.variableDeclarations.push(path);
      }
      this.traverse(path);
    },
    visitStatement(path) {
      // Track other top-level statements
      if (
        path.parent.node.type === 'Program' &&
        path.node.type !== 'ImportDeclaration' &&
        path.node.type !== 'VariableDeclaration' &&
        path.node.type !== 'FunctionDeclaration' &&
        path.node.type !== 'ExportNamedDeclaration' &&
        path.node.type !== 'ExportDefaultDeclaration'
      ) {
        topLevelStatements.otherStatements.push(path);
      }
      this.traverse(path);
    },
  });

  // Collect function declarations
  recast.visit(ast, {
    visitFunctionDeclaration(path) {
      const node = path.node;
      if (node.id) {
        functionDeclarations.set(node.id.name, {
          node,
          path,
          line: getLineNumber(node),
        });
      }
      this.traverse(path);
    },
  });

  // Collect exports (named exports and default exports)
  recast.visit(ast, {
    visitExportNamedDeclaration(path) {
      const node = path.node;
      if (
        node.declaration &&
        node.declaration.type === 'FunctionDeclaration' &&
        node.declaration.id
      ) {
        exports.set(node.declaration.id.name, {
          type: 'named',
          path,
          node,
          line: getLineNumber(node),
        });
      } else if (node.specifiers.length) {
        node.specifiers.forEach((specifier) => {
          exports.set(specifier.exported.name, {
            type: 'named',
            path,
            local: specifier.local.name,
            line: getLineNumber(node),
          });
        });
      }
      this.traverse(path);
    },
    visitExportDefaultDeclaration(path) {
      const node = path.node;
      if (node.declaration.type === 'FunctionDeclaration') {
        exports.set('default', {
          type: 'default',
          path,
          name: node.declaration.id ? node.declaration.id.name : null,
          line: getLineNumber(node),
        });
      }
      this.traverse(path);
    },
  });

  // Collect function calls with their locations
  recast.visit(ast, {
    visitCallExpression(path) {
      const callee = path.node.callee;
      if (callee.type === 'Identifier') {
        functionCalls.push({
          name: callee.name,
          line: getLineNumber(path.node),
        });
      }
      this.traverse(path);
    },
  });

  // Identify functions exported before declaration or used before declaration
  const problemFunctions = [];

  // Check exported functions
  for (const [name, exportInfo] of exports) {
    const declarationInfo =
      name === 'default'
        ? null
        : functionDeclarations.get(name) ||
          (exportInfo.local
            ? functionDeclarations.get(exportInfo.local)
            : null);

    // Check if exported function is not declared
    if (!declarationInfo) {
      problemFunctions.push({
        name,
        export: exportInfo,
        type: 'missing-declaration',
      });
    }
  }

  // Check functions used before declaration
  for (const [name, usage] of functionDeclarations) {
    // Find calls to this function
    const functionSpecificCalls = functionCalls.filter(
      (call) => call.name === name
    );

    if (functionSpecificCalls.length > 0) {
      // Check if any call is before the function declaration
      const earliestCall = functionSpecificCalls.reduce((earliest, current) => {
        return !earliest || current.line < earliest.line ? current : earliest;
      }, null);

      // Compare call location with declaration location
      if (earliestCall && earliestCall.line < usage.line) {
        problemFunctions.push({
          name,
          declaration: usage,
          firstCall: earliestCall,
          type: 'used-before-declaration',
        });
      }
    }
  }

  // Determine insertion point
  let insertIndex = 0;
  if (topLevelStatements.imports.length > 0) {
    // After last import
    insertIndex = topLevelStatements.imports.length;
  }
  if (topLevelStatements.variableDeclarations.length > 0) {
    // After last top-level variable declaration
    insertIndex = Math.max(
      insertIndex,
      topLevelStatements.imports.length +
        topLevelStatements.variableDeclarations.length
    );
  }
  if (topLevelStatements.otherStatements.length > 0) {
    // After last top-level statement
    insertIndex = Math.max(
      insertIndex,
      topLevelStatements.imports.length +
        topLevelStatements.variableDeclarations.length +
        topLevelStatements.otherStatements.length
    );
  }

  // Move problematic function declarations
  const programBody = ast.program.body;

  problemFunctions.forEach((problem) => {
    if (problem.type === 'used-before-declaration') {
      // Remove the original declaration
      problem.declaration.path.prune();

      // Insert at the calculated insertion point
      programBody.splice(insertIndex, 0, problem.declaration.node);
    } else if (problem.type === 'missing-declaration') {
      // For missing declarations, we'll add a placeholder function
      const placeholderFunc = b.functionDeclaration(
        b.identifier(
          problem.name === 'default' ? 'defaultExport' : problem.name
        ),
        [],
        b.blockStatement([
          b.throwStatement(
            b.newExpression(b.identifier('Error'), [
              b.literal(
                `Function ${problem.name} was exported before being defined`
              ),
            ])
          ),
        ])
      );

      // Insert at the calculated insertion point
      programBody.splice(insertIndex, 0, placeholderFunc);

      // If it was a named export, we need to update the export
      if (problem.export.type === 'named') {
        const exportNode = problem.export.path.node;
        if (exportNode.specifiers.length) {
          // Update the local name in export specifiers
          exportNode.specifiers.forEach((specifier) => {
            if (specifier.exported.name === problem.name) {
              specifier.local.name = placeholderFunc.id.name;
            }
          });
        }
      }
    }
  });

  return ast;
}
