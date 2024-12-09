import { create } from 'zustand';

// Zustand Store
export const useFileSystem = create((set, get) => ({
  folderData: [],
  flatFiles: {},
  rootPath: '',
  setFlatFiles: (payload) =>
    set((state) => ({
      flatFiles:
        typeof payload === 'function' ? payload(state.flatFiles) : payload,
    })),

  setFolderData: (payload) => set(() => ({ folderData: payload })),
  setRootPath: (payload) => set(() => ({ rootPath: payload })),
}));
