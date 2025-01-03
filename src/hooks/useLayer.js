import { useCallback } from 'react';
import { useStore } from '../contexts/useStore'; // adjust the import path as needed
import { useLayout } from './useLayout.js';

import { parseWithRecast } from '../utils/parseWithRecast.js';
import { useShallow } from 'zustand/react/shallow';
const { namedTypes: n, visit } = require('ast-types');

import {
  hideModuleChildren,
  showModuleChildren,
} from '../utils/moduleUtils.js';
import { useFileSystem } from '../stores/useFileSystem.js';
import { isRootLevelNode } from '../utils/parser.js';
import * as recast from 'recast';

export const useLayer = () => {
  const { setNodes, setEdges, getNodes, getEdges } = useStore(
    useShallow((state) => ({
      setNodes: state.setNodes,
      setEdges: state.setEdges,
      getNodes: state.getNodes,
      getEdges: state.getEdges,
    }))
  );
  const { flatFiles, setFlatFiles } = useFileSystem(
    useShallow((state) => ({
      setFlatFiles: state.setFlatFiles,
      flatFiles: state.flatFiles,
    }))
  );

  const { layoutNodes } = useLayout();

  const onModuleClose = (moduleId) => {
    setNodes((nodes) => {
      const nonModuleNodes = nodes.filter(
        (node) => node.data.moduleId !== moduleId
      );
      return nonModuleNodes;
    });
  };

  const toggleShowChildModules = useCallback(
    (moduleId) => {
      const nodes = getNodes();
      const edges = getEdges();

      const moduleNode = nodes.find(
        (node) => node.type === 'module' && node.id === moduleId
      );
      if (moduleNode.data.showChildren) {
        return setNodes((nodes) => hideModuleChildren(nodes, moduleId));
      }

      const { newNodes, newEdges } = showModuleChildren(
        nodes,
        edges,
        moduleNode,
        flatFiles
      );

      setNodes(newNodes);
      setEdges((edges) => edges.concat(newEdges));

      layoutNodes(moduleNode.id);
    },
    [flatFiles]
  );

  const onRootNodeTextChange = useCallback(
    (fullPath, value) => {
      // need to edit the actual rootcode ast
      console.log('new value', value);
      const parsed = parseWithRecast(value);
      if (!parsed) {
        console.error('skipping invalid code');
        return;
      }
      const parsedBody = parsed.program.body;
      const file = flatFiles[fullPath];
      const fileAst = file.fullAst;

      const newRootCode = [];

      visit(parsed, {
        visitProgram(path) {
          // Traverse through the body of the program
          path.get('body').each((nodePath) => {
            newRootCode.push({
              line: newRootCode.length,
              path: nodePath,
            });
          });
          return false;
        },
      });
      console.log('old ast', recast.print(fileAst).code);
      visit(fileAst, {
        visitProgram(path) {
          // Separate imports and other declarations
          const importNodes = [];
          const otherNodes = [];

          path.get('body').each((nodePath) => {
            const node = nodePath.node;
            if (node.type === 'ImportDeclaration') {
              importNodes.push(node);
            } else {
              const isRoot = isRootLevelNode(nodePath);
              console.log('==== is root', isRoot);
              console.log('==== node', recast.print(node).code);
              if (!isRoot) {
                otherNodes.push(node);
              }
            }
          });

          path.node.body = [
            ...importNodes, // Keep imports at the top
            ...parsedBody, // Inject the parsed nodes
            ...otherNodes, // Append the rest of the nodes
          ];
          console.log('new body', path.node.body);

          return false; // Stop traversal
        },
      });
      console.log('new ast', recast.print(fileAst).code);

      const newFile = {
        ...file,
        fullAst: fileAst,
        rootCode: newRootCode,
      };

      setFlatFiles((files) => {
        return { ...files, [fullPath]: newFile };
      });
    },
    [flatFiles]
  );

  return {
    onModuleClose,
    toggleShowChildModules,
    onRootNodeTextChange,
  };
};
