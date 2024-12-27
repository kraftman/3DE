import { useStore } from '../contexts/useStore';
import { useCallback } from 'react';
export const useLayerManager = () => {
  const store = useStore();

  const layers = useStore((store) => store.layers);
  const getCurrentLayer = useStore((store) => store.getCurrentLayer);
  const getLayers = useStore((store) => store.getLayers);

  const shiftLayerUp = () => {
    store.setCurrentLayer(Math.max(getCurrentLayer() - 1, 0));
  };

  const shiftLayerDown = useCallback(() => {
    const numLayers = Object.keys(getLayers()).length;
    store.setCurrentLayer(Math.min(getCurrentLayer() + 1, numLayers - 1));
  }, [getCurrentLayer, layers]);

  return { shiftLayerUp, shiftLayerDown };
};
