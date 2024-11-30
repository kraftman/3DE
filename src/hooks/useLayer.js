import { useStore } from '../contexts/useStore'; // adjust the import path as needed
import { getRaw } from '../utils/nodeUtils';

import { getNodesForFile } from '../utils/getNodesForFile.js';

import dagre from '@dagrejs/dagre';

const findModuleEdges = (moduleNodes) => {
  const edges = [];
  moduleNodes.forEach((moduleNode) => {
    // this needs updating to not add every import, just if one is found at all
    // so multiple imports to the same file arent included
    moduleNode.data.imports.forEach((imp) => {
      //console.log('import path:', imp);
      const targetModule = moduleNodes.find((node) => {
        return (
          node.data.fullPath === imp.fullPath + '.js' ||
          node.data.fullPath === imp.fullPath + '.ts' ||
          node.data.fullPath === imp.fullPath + '.tsx' ||
          node.data.fullPath === imp.fullPath + '.jsx'
        );
      });
      if (targetModule) {
        const edge = {
          id: `${moduleNode.id}-${targetModule.id}`,
          source: moduleNode.id,
          target: targetModule.id,
        };
        console.log('found edge:', edge);
        edges.push(edge);
      }
    });
  });
  return edges;
};

export const useLayer = () => {
  const store = useStore();

  const nodes = store.layers[store.currentLayer]?.nodes || [];
  const edges = store.layers[store.currentLayer]?.edges || [];

  const toggleHideImmediateChildren = (moduleId) => {
    store.setNodes((nodes) => {
      const moduleNodes = nodes.filter(
        (node) => node.data.moduleId === moduleId
      );
      console.log('found module nodes:', moduleNodes);
      const moduleNodeIds = moduleNodes.map((node) => node.id);

      const moduleNode = moduleNodes.find(
        (node) => node.type === 'module' && node.id === moduleId
      );

      const newRaw = getRaw(moduleId, moduleNodes);
      const newNodes = nodes.map((node) => {
        if (moduleNodeIds.includes(node.id) && node.type !== 'module') {
          return {
            ...node,
            hidden: moduleNode.data.showRaw,
          };
        }
        if (node.type === 'module' && node.id === moduleId) {
          node.data = {
            ...node.data,
            showRaw: !node.data.showRaw,
            raw: newRaw,
          };
        }
        return node;
      });
      return newNodes;
    });
  };

  const createMissingImport = (moduleId, importPath) => {
    // we dont know the extension so assume js for now
    const fullPath = importPath + '.js';
    if (store.flatFiles[fullPath]) {
      return;
    }
    const newFile = {
      index: fullPath,
      children: [],
      data: fullPath,
      fileData: '',
      isFolder: false,
    };
    store.setFlatFiles((files) => {
      const newFiles = {
        ...files,
        [fullPath]: newFile,
      };
      return newFiles;
    });

    store.setNodes((nodes) => {
      const parentModule = nodes.find(
        (node) => node.id === moduleId && node.type === 'module'
      );
      const newPosition = {
        x: parentModule.data.width + 100,
        y: 0,
      };
      const newNodes = getNodesForFile(fullPath, '', newPosition, moduleId);
      return nodes.concat(newNodes);
    });
  };

  const onModuleClose = (moduleId) => {
    store.setNodes((nodes) => {
      const nonModuleNodes = nodes.filter(
        (node) => node.data.moduleId !== moduleId
      );
      return nonModuleNodes;
    });
  };

  const layoutNodes = (parentId) => {
    console.log('layout nodes ', parentId);
    store.setNodes((nodes) => {
      // need to get all the current modules
      // find their width and height
      // find their edges
      // pass to dagre
      //
      const dagreGraph = new dagre.graphlib.Graph().setDefaultEdgeLabel(
        () => ({})
      );
      dagreGraph.setGraph({ rankdir: 'LR' });
      const moduleNodes = nodes.filter((node) => node.type === 'module');
      const edges = findModuleEdges(moduleNodes);

      moduleNodes.forEach((moduleNode) => {
        if (parentId && moduleNode.id === parentId) {
          console.log('parent node y:', moduleNode.position.y);
          dagreGraph.setNode(moduleNode.id, {
            width: moduleNode.data.width + 40,
            height: moduleNode.data.height,
            x: moduleNode.position.x,
            y: moduleNode.position.y,
            fixed: true,
          });
          return;
        }

        dagreGraph.setNode(moduleNode.id, {
          width: moduleNode.data.width + 40,
          height: moduleNode.data.height,
        });
      });

      edges.forEach((edge) => {
        console.log('adding edge', edge);
        dagreGraph.setEdge(edge.source, edge.target);
      });
      dagre.layout(dagreGraph);

      const graphState = {
        graph: dagreGraph.graph(), // Global graph attributes
        nodes: dagreGraph.nodes().map((nodeId) => ({
          id: nodeId,
          data: dagreGraph.node(nodeId), // Node attributes like position, size
        })),
        edges: dagreGraph.edges().map((edgeObj) => ({
          source: edgeObj.v,
          target: edgeObj.w,
          data: dagreGraph.edge(edgeObj), // Edge attributes like weight, label
        })),
      };

      // Log the entire state for debugging
      console.log(JSON.stringify(graphState, null, 2));

      return nodes.map((node) => {
        const layout = dagreGraph.node(node.id);
        if (layout) {
          const newNode = {
            ...node,
            position: {
              x: layout.x - layout.width / 2,
              y: layout.y - layout.height / 2,
            },
          };
          return newNode;
        }
        return node;
      });
    });
  };

  return {
    ...store,
    nodes: nodes,
    edges: edges,
    getNodeById: (id) =>
      store.layers[store.currentLayer]?.nodes.find((node) => node.id === id),
    toggleHideImmediateChildren,
    onModuleClose,
    createMissingImport,
    layoutNodes,
  };
};
