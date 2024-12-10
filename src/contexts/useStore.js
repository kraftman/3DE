import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

export const useStore = create(
  immer((set, get) => ({
    // Layers and Current Layer State
    layers: {
      0: { nodes: [], edges: [], color: '#11441166' },
    },
    currentLayer: 0,

    // Set functions using Immer
    setLayers: (updateFn) =>
      set((state) => {
        state.layers =
          typeof updateFn === 'function' ? updateFn(state.layers) : updateFn;
      }),
    setCurrentLayer: (layerId) =>
      set((state) => {
        if (!state.layers[layerId]) {
          state.layers[layerId] = { nodes: [], edges: [], color: '#11441166' };
        }
        state.currentLayer = layerId;
      }),
    setNodes: (updateFn) =>
      set((state) => {
        const currentLayer = state.currentLayer;
        state.layers[currentLayer].nodes =
          typeof updateFn === 'function'
            ? updateFn(state.layers[currentLayer].nodes)
            : updateFn;
      }),
    setEdges: (updateFn) =>
      set((state) => {
        const currentLayer = state.currentLayer;
        state.layers[currentLayer].edges =
          typeof updateFn === 'function'
            ? updateFn(state.layers[currentLayer].edges)
            : updateFn;
      }),

    // Selectors for optimized access
    getNodes: () => get().layers[get().currentLayer].nodes,
    getEdges: () => get().layers[get().currentLayer].edges,

    // Additional State Management
    folderData: null,
    setFolderData: (payload) =>
      set((state) => {
        state.folderData = payload;
      }),
    rootPath: null,
    setRootPath: (payload) =>
      set((state) => {
        state.rootPath = payload;
      }),
  }))
);
