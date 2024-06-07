import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Container } from './components/Container';

const root = createRoot(document.body);
root.render(
  <DndProvider backend={HTML5Backend}>
    <Container />
  </DndProvider>
);
