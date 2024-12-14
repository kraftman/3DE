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
import { PreviewNode } from '../../components/nodes/PreviewNode';
import { ImageNode } from '../../components/nodes/ImageNode';
import { FolderSelectButton } from '../../components/FolderSelectButton';
import { BasicTree } from '../../components/FolderTree';
import './updatenode.css';
import { SnackbarProvider } from 'notistack';
import { useLayer } from '../../hooks/useLayer.js';
import { LayerManager } from '../../components/LayerManager';
import { SearchBar } from '../../components/SearchBar';
import { useStore } from '../../contexts/useStore.js';
import { TextNode } from '../../components/nodes/TextNode/TextNode.js';
import { MarkdownNode } from '../../components/nodes/MarkdownNode/MarkdownNode.js';
import { useFileManager } from '../../hooks/useFileManager.js';
import { useNodeManager } from '../../hooks/useNodeManager.js';

const defaultViewport = { x: 0, y: 0, zoom: 1.5 };

export const Flow = () => {
  const {
    //functions,
    shiftLayerUp,
    shiftLayerDown,
  } = useLayer();
  const { setNodes, setEdges } = useStore();

  const layers = useStore((store) => store.layers);
  const nodes = useStore((store) => store.getNodes());
  const edges = useStore((store) => store.getEdges());

  const currentLayer = useStore((store) => store.currentLayer);

  const { onNodeDragStart, onNodeDragStop } = useNodeManager();

  const { loadFileSystem, handleSave } = useFileManager();

  useEffect(() => {
    const init = async () => {
      const loadSessions = async () => {
        return;
      };
      loadSessions();
      await onFolderSelected('/home/chris/marvel-app');
    };
    init();
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
    setEdges((prevEdges) => {
      applyEdgeChanges(changes, prevEdges);
    });
  };

  const nodeTypes = useMemo(
    () => ({
      text: TextNode,
      markdown: MarkdownNode,
      code: CodeNode,
      module: ModuleNode,
      pureFunctionNode: PureFunctionNode,
      image: ImageNode,
      preview: PreviewNode,
    }),
    [
      TextNode,
      MarkdownNode,
      CodeNode,
      ModuleNode,
      PureFunctionNode,
      ImageNode,
      PreviewNode,
    ]
  );

  const nodeClassName = (node) => node.type;

  const onFolderSelected = (folder) => {
    loadFileSystem(folder);
  };

  const onSearchSelect = (selected) => {
    const newId = (nodes.length + 1).toString();
    const newNode = {
      id: newId,
      data: {
        functionId: selected.id,
        content: selected.content,
        functionName: 'TestFunction' + newId,
      },
      type: 'pureFunctionNode',
      position: {
        x: 500,
        y: 500,
      },
      style: {
        width: '400px',
        height: '300px',
      },
    };
    setNodes((nodes) => {
      return nodes.concat(newNode);
    });
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
          {/* <SearchBar
            searchContent={functions}
            onSearchSelect={onSearchSelect}
          /> */}
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
