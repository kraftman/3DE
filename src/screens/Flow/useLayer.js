import { useFlow } from './FlowContext'; // adjust the import path as needed

export const useLayer = () => {
  const { state, dispatch } = useFlow();

  const setCurrentLayer = (layer) => {
    dispatch({ type: 'SET_CURRENT_LAYER', payload: layer });
  };

  const setNodes = (nodesUpdater) => {
    dispatch({ type: 'SET_NODES', payload: nodesUpdater });
  };

  const setEdges = (edgesUpdater) => {
    dispatch({ type: 'SET_EDGES', payload: edgesUpdater });
  };

  const setLayers = (layer) => {
    dispatch({ type: 'SET_LAYERS', payload: layer });
  };

  const setState = (newState) => {
    dispatch({ type: 'SET_STATE', payload: newState });
  };

  const nodes = state.layers[state.currentLayer]?.nodes;
  const edges = state.layers[state.currentLayer]?.edges;
  const currentLayer = state.currentLayer;
  const layers = state.layers;

  return {
    setCurrentLayer,
    setNodes,
    setEdges,
    nodes,
    edges,
    layers,
    state,
    setState,
    currentLayer,
    setLayers,
  };
};
