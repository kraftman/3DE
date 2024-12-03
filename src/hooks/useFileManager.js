import { useStore } from '../contexts/useStore';
import { isValidCode } from '../screens/Flow/utils.js';
import path from 'path-browserify';
import { enqueueSnackbar } from 'notistack';

export const useFileManager = () => {
  const store = useStore();

  const handleSave = () => {
    const fullPath = store.nodes.find((node) => node.id === store.focusNode.id)
      .data.fullPath;

    const extension = path.extname(fullPath);
    const jsFiles = ['.js', '.jsx', '.ts', '.tsx'];
    const isJsFile = jsFiles.includes(extension);

    const fileData = store.flatFiles[fullPath].fileData;
    const isValid = isValidCode(fileData);
    if (!isJsFile || !isValid) {
      enqueueSnackbar({
        message: 'Invalid code',
        options: {
          variant: 'error',
        },
      });
      return;
    }

    //TODO use the result as the new file contents, as it should be formatted
    store.setFlatFiles((files) => {
      const newFiles = {
        ...files,
        [fullPath]: { ...files[fullPath], savedData: fileData },
      };
      return newFiles;
    });
  };

  return {
    flatFiles: store.flatFiles,
    handleSave,
  };
};
