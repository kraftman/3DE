import { useFlow } from './FlowContext'; // adjust the import path as needed

export const useLayer = () => {
  const { state, dispatch } = useFlow();

  const setLayer = (layer) => {
    dispatch({ type: 'SET_LAYER', payload: layer });
  };

  const setNodes = (nodesUpdater) => {
    dispatch({ type: 'SET_NODES', payload: nodesUpdater });
  };

  const setEdges = (edgesUpdater) => {
    dispatch({ type: 'SET_EDGES', payload: edgesUpdater });
  };

  const nodes = state.layers[state.currentLayer].nodes;
  const edges = state.layers[state.currentLayer].edges;
  const currentLayer = state.currentLayer;

  return { setLayer, setNodes, setEdges, nodes, edges, currentLayer };
};
