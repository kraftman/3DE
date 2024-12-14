import React from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Flow } from './screens/Flow/Flow';
import { ReactFlowProvider } from '@xyflow/react';
import { FlowProvider } from './screens/Flow/FlowContext';

export const FlowManager = () => {
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
