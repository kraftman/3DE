import React from 'react';
import path from 'path-browserify';

import { useFileSystem } from '../../contexts/FileSystemContext';

export const ImageNode = ({ id, data }) => {
  const { flatFiles } = useFileSystem();
  const fileData = flatFiles[data.fullPath]?.fileData;

  return (
    <div className="text-updater-node">
      {fileData && (
        <img
          src={fileData}
          alt="Fetched from backend"
          style={{ width: '100%', height: '100%' }}
        />
      )}
    </div>
  );
};
