import React from 'react';
const { useFileSystem } = require('../../stores/useFileSystem');

export const ImageNode = ({ id, data }) => {
  const fileInfo = useFileSystem((state) => {
    return state.flatFiles[data.fullPath];
  });
  const fileData = fileInfo?.fileData;

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
