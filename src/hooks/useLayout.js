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
        edges.push(edge);
      }
    });
  });
  return edges;
};

export const useLayout = () => {
  const setNodes = useStore((state) => state.setNodes);
  const getEdges = useStore((state) => state.getEdges);

  const layoutNodes = (parentId) => {
    setNodes((nodes) => {
      const dagreGraph = new dagre.graphlib.Graph().setDefaultEdgeLabel(
        () => ({})
      );
      dagreGraph.setGraph({ rankdir: 'LR' });

      const moduleNodes = nodes.filter((node) => node.type === 'module');
      const edges = getEdges();
      //const edges = findModuleEdges(moduleNodes);
      console.log('edges:', edges);
      edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
      });

      moduleNodes.forEach((moduleNode) => {
        dagreGraph.setNode(moduleNode.id, {
          width: moduleNode.data.width,
          height: moduleNode.data.height,
        });
      });

      dagre.layout(dagreGraph);

      return nodes.map((node) => {
        const layout = dagreGraph.node(node.id);
        console.log('layout:', layout);
        console.log(node.parentId);
        if (layout) {
          return {
            ...node,
            parentId: undefined,
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
