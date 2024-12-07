import { useStore } from '../contexts/useStore';
import { findChildIds } from '../utils/nodeUtils';

export const useEdgeManager = () => {
  const store = useStore();

  const toggleHideEdges = (nodeId, hideEdges) => {
    store.setNodes((nodes) => {
      const childIds = findChildIds(nodes, nodeId);

      store.setEdges((edges) => {
        const newEdges = edges.map((edge) => {
          if (
            childIds.includes(edge.source) ||
            childIds.includes(edge.target)
          ) {
            return { ...edge, hidden: hideEdges };
          }
          return edge;
        });
        return newEdges;
      });
      return nodes;
    });
  };

  return { toggleHideEdges };
};
