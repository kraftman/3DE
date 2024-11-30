import { create } from 'zustand';
import { loadFolderTree, loadFile } from '../electronHelpers';
import { flattenFileTree } from '../screens/Flow/utils';

// Zustand Store
export const useStore = create((set, get) => ({
  layers: {
    0: { nodes: [], edges: [], color: '#11441166' },
  },
  currentLayer: 0,
  folderData: [],
  flatFiles: {},
  rootPath: '',
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
  setFolderData: (payload) => set(() => ({ folderData: payload })),
  setFlatFiles: (payload) => set(() => ({ flatFiles: payload })),
  setRootPath: (payload) => set(() => ({ rootPath: payload })),
  loadFileSystem: async (newRootPath) => {
    const { fullRootPath, folderTree } = await loadFolderTree(newRootPath);
    set(() => ({ rootPath: fullRootPath, folderData: folderTree }));
    const flatFiles = flattenFileTree(folderTree);

    for (const [fullPath, fileInfo] of Object.entries(flatFiles)) {
      try {
        if (fileInfo.isFolder) {
          continue;
        }
        fileInfo.fileData = await loadFile(fullPath);
        fileInfo.savedData = fileInfo.fileData;
      } catch (error) {
        console.error('error loading file', fullPath, error);
      }
    }
    set(() => ({ flatFiles }));
    return fullRootPath;
  },
}));
