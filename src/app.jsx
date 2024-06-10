import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Container } from './components/Container';
import { Flow } from './components/Flow';
import ReactFlow, {
  useNodesState,
  useEdgesState,
  addEdge,
  useReactFlow,
  ReactFlowProvider,
} from 'reactflow';

const root = createRoot(document.body);
root.render(
  <DndProvider backend={HTML5Backend}>
    <ReactFlowProvider>
      <Flow />
    </ReactFlowProvider>
  </DndProvider>
);
