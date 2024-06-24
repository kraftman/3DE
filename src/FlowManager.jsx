import React, { useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Flow } from './screens/Flow/Flow';
import { ReactFlowProvider } from 'reactflow';
import { FlowProvider } from './screens/Flow/FlowContext';

export const FlowManager = () => {
  const [folderData, setFolderData] = useState([]);
  const onFolderSelected = (folderData) => {
    setFolderData(folderData);
  };
  return (
    <DndProvider backend={HTML5Backend}>
      <ReactFlowProvider>
        <FlowProvider>
          <Flow />
        </FlowProvider>
      </ReactFlowProvider>
    </DndProvider>
  );
};
