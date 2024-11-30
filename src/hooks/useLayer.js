import { useStore } from '../contexts/useStore'; // adjust the import path as needed

export const useLayer = () => {
  const store = useStore();

  const nodes = store.layers[store.currentLayer]?.nodes || [];
  const edges = store.layers[store.currentLayer]?.edges || [];

  return {
    ...store,
    nodes: nodes,
    edges: edges,
    getNodeById: (id) =>
      store.layers[store.currentLayer]?.nodes.find((node) => node.id === id),
  };
};
