import { useStore } from '../contexts/useStore';
import { useCallback } from 'react';
export const useLayerManager = () => {
  const store = useStore();
  const currentLayer = useStore((store) => store.currentLayer);

  const layers = useStore((store) => store.layers);
  console.log('layers', layers);
  const getCurrentLayer = useStore((store) => store.getCurrentLayer);
  const getLayers = useStore((store) => store.getLayers);

  const shiftLayerUp = () => {
    console.log('current layer up', getCurrentLayer());
    store.setCurrentLayer(Math.max(getCurrentLayer() - 1, 0));
  };

  const shiftLayerDown = useCallback(() => {
    console.log('current layer down ', getCurrentLayer());
    const numLayers = Object.keys(getLayers()).length;
    console.log('num layers', numLayers);
    console.log('layers in down', getLayers());
    store.setCurrentLayer(Math.min(getCurrentLayer() + 1, numLayers - 1));
  }, [getCurrentLayer, layers]);

  return { shiftLayerUp, shiftLayerDown };
};
