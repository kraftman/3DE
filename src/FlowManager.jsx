import React, { useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Flow } from './screens/Flow/Flow';
import FolderSelectButton from './components/FolderSelectButton';
import { ReactFlowProvider } from 'reactflow';
import { BasicTree } from './components/FolderTree';

export const FlowManager = () => {
  const [folderData, setFolderData] = useState([]);
  const onFolderSelected = (folderData) => {
    setFolderData(folderData);
  };
  return (
    <DndProvider backend={HTML5Backend}>
      <FolderSelectButton onFolderSelected={onFolderSelected} />
      <BasicTree folderData={folderData} />
      <ReactFlowProvider>
        <Flow />
      </ReactFlowProvider>
    </DndProvider>
  );
};
