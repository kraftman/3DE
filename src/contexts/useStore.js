import { create } from 'zustand';
import { loadFolderTree, loadFile } from '../electronHelpers';
import { flattenFileTree } from '../screens/Flow/utils';
import { parseCode } from '../utils/parser';
import { getModuleNodes } from '../utils/nodeUtils';
import { isCodeFile } from '../utils/fileUtils';

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
  setFolderData: (payload) => set(() => ({ folderData: payload })),
  setFlatFiles: (payload) => set(() => ({ flatFiles: payload })),
  setRootPath: (payload) => set(() => ({ rootPath: payload })),
  loadFileSystem: async (newRootPath) => {
    const { fullRootPath, folderTree } = await loadFolderTree(newRootPath);
    set(() => ({ rootPath: fullRootPath, folderData: folderTree }));
    const flatFiles = flattenFileTree(folderTree);
    console.log('flatFiles', flatFiles);

    for (const [fullPath, fileInfo] of Object.entries(flatFiles)) {
      try {
        if (fileInfo.isFolder) {
          continue;
        }
        if (!isCodeFile(fullPath)) {
          continue;
        }

        fileInfo.fileData = await loadFile(fullPath);
        const moduleCode = parseCode(fileInfo.fileData);
        const { imports, exports, flatFunctions, rootLevelCode } = moduleCode;
        fileInfo.imports = imports;
        fileInfo.exports = exports;
        fileInfo.functions = flatFunctions;
        fileInfo.rootCode = rootLevelCode;

        fileInfo.savedData = fileInfo.fileData;
      } catch (error) {
        console.error('error loading file', fullPath, error);
      }
    }
    set(() => ({ flatFiles }));
    return fullRootPath;
  },
}));
