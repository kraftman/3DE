import React, { useCallback } from 'react';

import { removeFunctionFromAst } from '../utils/codeUtils.js';
import { useShallow } from 'zustand/react/shallow';

import { useFileSystem } from '../stores/useFileSystem.js';

import { useStore } from '../contexts/useStore';

const { namedTypes: n, visit } = require('ast-types');
import * as recast from 'recast';

export const useFunctionManager = () => {
  const { setNodes } = useStore(
    useShallow((state) => ({
      setNodes: state.setNodes,
    }))
  );

  const { flatFiles, setFlatFiles } = useFileSystem(
    useShallow((state) => ({
      setFlatFiles: state.setFlatFiles,
      flatFiles: state.flatFiles,
    }))
  );

  function handleFunctionNode(path, functionId, newBodyStatements) {
    if (path.node._id && path.node._id === functionId) {
      path.node.body = newBodyStatements;

      return false;
    }
  }

  function handleFunctionSignatureChange(path, newAst) {
    const newFunction = newAst.program.body[0];
    path.node.params = newFunction.params;
    const node = path.node;
    if (
      node.type === 'FunctionDeclaration' ||
      node.type === 'FunctionExpression'
    ) {
      path.node.id = newFunction.id; // Update function name
    } else if (node.type === 'ArrowFunctionExpression') {
      // For arrow functions, update the variable name
      const variableDeclarator = path.parentPath.value; // Assuming parent is VariableDeclarator
      console.log('variable declarator', variableDeclarator);
      if (variableDeclarator.type === 'VariableDeclarator') {
        console.log('updating node', variableDeclarator);
        variableDeclarator.id.name = newFunction.id.name;
      } else {
        console.error(
          'Failed to update variable name for arrow function',
          newFunction
        );
      }
    }
  }

  const onFunctionTextChange = useCallback(
    (fullPath, functionId, newBodyStatements) => {
      const file = flatFiles[fullPath];
      visit(file.fullAst, {
        visitFunctionDeclaration(path) {
          handleFunctionNode(path, functionId, newBodyStatements);
          this.traverse(path);
        },
        visitFunctionExpression(path) {
          handleFunctionNode(path, functionId, newBodyStatements);
          this.traverse(path);
        },
        visitArrowFunctionExpression(path) {
          handleFunctionNode(path, functionId, newBodyStatements);
          this.traverse(path);
        },
        visitObjectMethod(path) {
          handleFunctionNode(path, functionId, newBodyStatements);
          this.traverse(path);
        },
        visitClassMethod(path) {
          handleFunctionNode(path, functionId, newBodyStatements);
          this.traverse(path);
        },
      });

      setFlatFiles((files) => {
        const newFile = {
          ...file,
          functions: [...file.functions],
        };
        return { ...files, [fullPath]: newFile };
      });

      // also need to handle them creating a new function in code
    },
    [flatFiles]
  );

  const onFunctionSignatureChange = useCallback(
    (fullPath, functionId, newAst) => {
      const file = flatFiles[fullPath];
      const funcInfo = file.functions.find((func) => func.id === functionId);
      handleFunctionSignatureChange(funcInfo.path, newAst);

      setFlatFiles((files) => {
        const newFunctions = file.functions.map((func) => {
          if (func.id === functionId) {
            return { ...func };
          }
          return func;
        });
        const newFile = {
          ...file,
          functions: newFunctions,
          fullAst: { ...file.fullAst },
        };
        return { ...files, [fullPath]: newFile };
      });
    },
    [flatFiles]
  );

  const onFunctionSizeChange = useCallback(
    (fullPath, functionId, newSize) => {
      setFlatFiles((files) => {
        const file = files[fullPath];
        const newFunctions = file.functions.map((func) => {
          if (func.id === functionId) {
            return { ...func, contentSize: newSize };
          }
          return func;
        });
        const newFile = {
          ...file,
          functions: newFunctions,
        };
        return { ...files, [fullPath]: newFile };
      });

      setNodes((nodes) =>
        nodes.map((node) => {
          if (node.data.functionId === functionId) {
            return {
              ...node,
              width: newSize.width,
              height: newSize.height,
              data: {
                ...node.data,
                width: newSize.width,
                height: newSize.height,
              },
              style: {
                ...node.style,
                width: newSize.width,
                height: newSize.height,
              }
            };
          }
          return node;
        })
      );
    },
    [flatFiles]
  );

  const onFunctionDelete = (fullPath, functionId) => {
    const fileInfo = flatFiles[fullPath];

    removeFunctionFromAst(fileInfo.fullAst, functionId);

    // maybe layout nodes too?
    setNodes((nodes) =>
      nodes.filter((node) => node.data.functionId !== functionId)
    );
    setFlatFiles((files) => {
      const newFunctions = fileInfo.functions.filter(
        (func) => func.id !== functionId
      );
      const newFile = {
        ...fileInfo,
        functions: newFunctions,
      };
      return { ...files, [fullPath]: newFile };
    });
  };

  return {
    onFunctionTextChange,
    onFunctionSignatureChange,
    onFunctionDelete,
    onFunctionSizeChange,
  };
};
