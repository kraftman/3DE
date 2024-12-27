import { useStore } from '../contexts/useStore';
import dagre from '@dagrejs/dagre';

export const useLayout = () => {
  const setNodes = useStore((state) => state.setNodes);
  const getEdges = useStore((state) => state.getEdges);

  const layoutNodes = () => {
    setNodes((nodes) => {
      const dagreGraph = new dagre.graphlib.Graph().setDefaultEdgeLabel(
        () => ({})
      );
      dagreGraph.setGraph({ rankdir: 'LR' });

      const moduleNodes = nodes.filter(
        (node) => node.type === 'module' || node.type === 'partial'
      );
      const edges = getEdges();
      edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
      });

      moduleNodes.forEach((moduleNode) => {
        console.log('=======', moduleNode.data.width);
        dagreGraph.setNode(moduleNode.id, {
          width: moduleNode.data.isCollapsed ? 200 : moduleNode.data.width,
          height: moduleNode.data.isCollapsed ? 50 : moduleNode.data.height,
        });
      });

      dagre.layout(dagreGraph);

      return nodes.map((node) => {
        const layout = dagreGraph.node(node.id);
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
