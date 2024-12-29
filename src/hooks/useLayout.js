import { useStore } from '../contexts/useStore';
import dagre from '@dagrejs/dagre';

export const layoutInternalNodes = (nodes, edges) => {
  const functionNodes = nodes.filter(
    (node) => node.type === 'pureFunctionNode'
  );
  const internalEdges = edges.filter((edge) => edge.isInternal); //

  const dagreGraph = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: 'LR', nodesep: 10, ranksep: 10, edgesep: 10 });
  internalEdges.forEach((edge) => {
    console.log(edge);
    dagreGraph.setEdge(edge.target, edge.source);
  });

  functionNodes.forEach((functionNode) => {
    console.log(functionNode);
    dagreGraph.setNode(functionNode.id, {
      width: functionNode.data.frameSize.width,
      height: functionNode.data.frameSize.height,
    });
  });
  dagre.layout(dagreGraph);

  let maxWidth = 400;
  let maxHeight = 300;
  nodes.forEach((node) => {
    const layout = dagreGraph.node(node.id);
    if (layout) {
      node.position = {
        x: 40 + layout.x - layout.width / 2,
        y: 80 + layout.y - layout.height / 2,
      };
      maxWidth = Math.max(maxWidth, layout.x + layout.width);
      maxHeight = Math.max(maxHeight, layout.y + layout.height);
    }
  });

  const moduleNode = nodes.find((node) => node.type === 'module');
  if (moduleNode) {
    console.log('updating size', maxWidth, maxHeight);
    moduleNode.width = maxWidth;
    moduleNode.height = maxHeight + 80;
    moduleNode.data.width = maxWidth;
    moduleNode.data.height = maxHeight + 80;
    moduleNode.style = {
      ...moduleNode.style,
      width: maxWidth,
      height: maxHeight + 80,
    };
  }
};

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
        dagreGraph.setNode(moduleNode.id, {
          width: moduleNode.data.isCollapsed ? 200 : moduleNode.data.width,
          height: moduleNode.data.isCollapsed ? 50 : moduleNode.data.height,
        });
      });

      dagre.layout(dagreGraph);
      // if we want the parent to not move, we need to adjust the position of the children
      // relative the parents offset. if we want to do this we need to calculate the parent
      // which could be tricky if there are multiple parents

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
