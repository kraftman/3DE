import { useStore } from '../contexts/useStore';
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

export const useLayout = () => {
  const store = useStore();

  const layoutNodes = (parentId) => {
    store.setNodes((nodes) => {
      const dagreGraph = new dagre.graphlib.Graph().setDefaultEdgeLabel(
        () => ({})
      );
      dagreGraph.setGraph({ rankdir: 'LR' });

      const moduleNodes = nodes.filter((node) => node.type === 'module');
      const edges = findModuleEdges(moduleNodes);

      moduleNodes.forEach((moduleNode) => {
        dagreGraph.setNode(moduleNode.id, {
          width: moduleNode.data.width + 40,
          height: moduleNode.data.height,
        });
      });

      edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
      });

      dagre.layout(dagreGraph);

      return nodes.map((node) => {
        const layout = dagreGraph.node(node.id);
        if (layout) {
          return {
            ...node,
            position: {
              x: layout.x - layout.width / 2,
              y: layout.y - layout.height / 2,
            },
          };
        }
        return node;
      });
    });
  };

  return { layoutNodes };
};
