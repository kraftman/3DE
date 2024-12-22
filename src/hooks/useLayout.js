import { useStore } from '../contexts/useStore';
import dagre from '@dagrejs/dagre';
import { importWithoutExtension } from '../utils/fileUtils';

const findModuleEdges = (moduleNodes) => {
  const edges = [];
  moduleNodes.forEach((moduleNode) => {
    // this needs updating to not add every import, just if one is found at all
    // so multiple imports to the same file arent included
    moduleNode.data.imports.forEach((imp) => {
      //console.log('import path:', imp);
      const targetModule = moduleNodes.find(
        (node) =>
          importWithoutExtension(node.data.fullPath) ===
          importWithoutExtension(imp.fullPath)
      );
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
  const setNodes = useStore((state) => state.setNodes);

  const layoutNodes = (parentId) => {
    setNodes((nodes) => {
      const dagreGraph = new dagre.graphlib.Graph().setDefaultEdgeLabel(
        () => ({})
      );
      dagreGraph.setGraph({ rankdir: 'LR' });

      const moduleNodes = nodes.filter((node) => node.type === 'module');
      const edges = findModuleEdges(moduleNodes);

      moduleNodes.forEach((moduleNode) => {
        dagreGraph.setNode(moduleNode.id, {
          width: moduleNode.data.width,
          height: moduleNode.data.height,
        });
      });

      console.log('found edges:', edges);
      edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
      });

      dagre.layout(dagreGraph);

      return nodes.map((node) => {
        const layout = dagreGraph.node(node.id);
        console.log('layout:', layout);
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
