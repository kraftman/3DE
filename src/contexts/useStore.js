import { create } from 'zustand';

// Zustand Store
export const useStore = create((set, get) => ({
  layers: {
    0: { nodes: [], edges: [], color: '#11441166' },
  },
  currentLayer: 0,
  folderData: [],
  flatFiles: {},
  rootPath: '',
  functions: [],
  focusNode: null,
  setFocusNode: (node) => set(() => node),
  setFunctions: (payload) =>
    set((state) => ({
      functions:
        typeof payload === 'function' ? payload(state.functions) : payload,
    })),
  setState: (newState) => set(() => newState),
  setLayers: (payload) =>
    set((state) => ({
      layers: typeof payload === 'function' ? payload(state.layers) : payload,
    })),
  setCurrentLayer: (layerId) =>
    set((state) => {
      if (!state.layers[layerId]) {
        return {
          layers: {
            ...state.layers,
            [layerId]: { nodes: [], edges: [] },
          },
          currentLayer: layerId,
        };
      }
      return { currentLayer: layerId };
    }),
  setNodes: (payload) =>
    set((state) => ({
      layers: {
        ...state.layers,
        [state.currentLayer]: {
          ...state.layers[state.currentLayer],
          nodes:
            typeof payload === 'function'
              ? payload(state.layers[state.currentLayer].nodes)
              : payload,
        },
      },
    })),
  setEdges: (payload) =>
    set((state) => ({
      layers: {
        ...state.layers,
        [state.currentLayer]: {
          ...state.layers[state.currentLayer],
          edges:
            typeof payload === 'function'
              ? payload(state.layers[state.currentLayer].edges)
              : payload,
        },
      },
    })),
  setFlatFiles: (payload) =>
    set((state) => ({
      flatFiles:
        typeof payload === 'function' ? payload(state.flatFiles) : payload,
    })),
  getNodes() {
    return get().layers[get().currentLayer].nodes;
  },

  setFolderData: (payload) => set(() => ({ folderData: payload })),
  setRootPath: (payload) => set(() => ({ rootPath: payload })),
}));
