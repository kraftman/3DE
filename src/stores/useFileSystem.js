import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

export const useFileSystem = create(
  immer((set) => ({
    folderData: [],
    flatFiles: {},
    rootPath: '',

    // Set flatFiles with Immer
    setFlatFiles: (updateFn) =>
      set((state) => {
        state.flatFiles =
          typeof updateFn === 'function' ? updateFn(state.flatFiles) : updateFn;
      }),

    // Set folderData with Immer
    setFolderData: (payload) =>
      set((state) => {
        state.folderData = payload;
      }),

    // Set rootPath with Immer
    setRootPath: (payload) =>
      set((state) => {
        state.rootPath = payload;
      }),
  }))
);
