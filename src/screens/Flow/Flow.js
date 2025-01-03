import React, { useEffect, useMemo } from 'react';
import {
  ReactFlow,
  MiniMap,
  Panel,
  Controls,
  Background,
  applyEdgeChanges,
  applyNodeChanges,
} from '@xyflow/react';

import { Tooltip } from 'react-tooltip';
import '@xyflow/react/dist/style.css';
import '@xyflow/react/dist/base.css';
import 'react-tooltip/dist/react-tooltip.css';
import { ModuleNode } from '../../components/nodes/ModuleNode/ModuleNode.jsx';
import { PureFunctionNode } from '../../components/nodes/PureFunctionNode/PureFunctionNode';
import { CodeNode } from '../../components/nodes/CodeNode/CodeNode';
import { PartialNode } from '../../components/nodes/PartialNode/PartialNode.js';
import { ImageNode } from '../../components/nodes/ImageNode';
import { FolderSelectButton } from '../../components/FolderSelectButton';
import { BasicTree } from '../../components/FolderTree';
import './updatenode.css';
import { SnackbarProvider } from 'notistack';
import { useLayerManager } from '../../hooks/useLayerManager';
import { LayerManager } from '../../components/LayerManager';
import { SearchBar } from '../../components/SearchBar';
import { useStore } from '../../contexts/useStore.js';
import { TextNode } from '../../components/nodes/TextNode/TextNode.js';
import { MarkdownNode } from '../../components/nodes/MarkdownNode/MarkdownNode.js';
import { useFileManager } from '../../hooks/useFileManager.js';
import { useNodeManager } from '../../hooks/useNodeManager.js';
import { useLayout } from '../../hooks/useLayout.js';

const defaultViewport = { x: 0, y: 0, zoom: 1.5 };

export const Flow = () => {
  const { shiftLayerUp, shiftLayerDown } = useLayerManager();
  const { setNodes, setEdges } = useStore();

  const layers = useStore((store) => store.layers);
  const nodes = useStore((store) => store.getNodes());
  const edges = useStore((store) => store.getEdges());

  const currentLayer = useStore((store) => store.currentLayer);

  const { onNodeDragStart, onNodeDragStop } = useNodeManager();

  const { loadFileSystem, handleSave, onFileSelected, addNewFile, removeFile } =
    useFileManager();
  const { layoutNodes } = useLayout();

  useEffect(() => {
    const init = async () => {
      const loadSessions = async () => {
        return;
      };
      loadSessions();
      await onFolderSelected('/home/chris/3DE');
    };
    init();
    window.electronAPI.receiveFromMain('file-update', (response) => {
      console.log('file update', response);
      if (response.eventType === 'add') {
        addNewFile(response.filePath);
      } else if (response.eventType === 'unlink') {
        removeFile(response.filePath);
      }
    });
  }, []);

  useEffect(() => {
    const handleKeyDown = async (e) => {
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        handleSave();
      } else if (e.ctrlKey && e.key === 'ArrowUp') {
        shiftLayerUp();
      } else if (e.ctrlKey && e.key === 'ArrowDown') {
        shiftLayerDown();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleSave]);

  const onNodesChange = (changes) => {
    setNodes((prevNodes) => {
      return applyNodeChanges(changes, prevNodes);
    });
  };

  const onEdgesChange = (changes) => {
    setEdges((prevEdges) => applyEdgeChanges(changes, prevEdges));
  };

  const nodeTypes = useMemo(
    () => ({
      text: TextNode,
      markdown: MarkdownNode,
      code: CodeNode,
      module: ModuleNode,
      pureFunctionNode: PureFunctionNode,
      partial: PartialNode,
      image: ImageNode,
    }),
    [TextNode, MarkdownNode, CodeNode, ModuleNode, PureFunctionNode, ImageNode]
  );

  const nodeClassName = (node) => node.type;

  const onFolderSelected = (folder) => {
    loadFileSystem(folder);
  };

  const onSearchSelect = (selected) => {
    const newPos = { x: 0, y: 0 };
    onFileSelected(newPos, selected.fullPath);
  };

  return (
    <>
      <ReactFlow
        nodeTypes={nodeTypes}
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        defaultViewport={defaultViewport}
        minZoom={0.2}
        maxZoom={4}
        attributionPosition="bottom-left"
        connectionMode="loose"
        onNodeDragStop={onNodeDragStop}
        onNodeDragStart={onNodeDragStart}
      >
        <Background
          style={{
            background: layers[currentLayer].color,
          }}
        />

        <Panel position="top-left">
          <FolderSelectButton onFolderSelected={onFolderSelected} />
          <button onClick={layoutNodes}>Layout</button>

          <BasicTree />
        </Panel>
        <Panel position="top-right">
          <LayerManager />
        </Panel>
        <Panel position="top">
          <SnackbarProvider
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'center',
            }}
          />
          <SearchBar onSearchSelect={onSearchSelect} />
          <Tooltip
            id="saved-tooltip"
            place="bottom"
            content="Hello world! I'm a Tooltip"
          />
        </Panel>
        <MiniMap zoomable pannable nodeClassName={nodeClassName} />
        <Controls />
      </ReactFlow>
    </>
  );
};
