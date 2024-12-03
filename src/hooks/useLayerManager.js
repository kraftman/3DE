import { useStore } from '../contexts/useStore';
export const useLayerManager = () => {
  const store = useStore();

  const shiftLayerUp = () => {
    store.setCurrentLayer(Math.max(store.currentLayer - 1, 0));
  };

  const shiftLayerDown = () => {
    const numLayers = Object.keys(store.layers).length;
    store.setCurrentLayer(Math.min(store.currentLayer + 1, numLayers - 1));
  };

  return { shiftLayerUp, shiftLayerDown };
};
