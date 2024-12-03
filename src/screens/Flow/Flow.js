import React, {
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
} from 'react';
import {
  ReactFlow,
  MiniMap,
  Panel,
  Controls,
  Background,
  useReactFlow,
  useUpdateNodeInternals,
  applyEdgeChanges,
  applyNodeChanges,
} from '@xyflow/react';

import { Tooltip } from 'react-tooltip';

import '@xyflow/react/dist/style.css';

// or if you just want basic styles
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
import path from 'path-browserify';

import { SnackbarProvider, enqueueSnackbar } from 'notistack';
import { useLayer } from '../../hooks/useLayer.js';

import {
  LayerManager,
  getRandomDarkHexColorWithAlpha,
} from '../../components/LayerManager';

import { SearchBar } from '../../components/SearchBar';

import { getNewEdges, getNewNodeId, isValidCode } from './utils';
import { useStore } from '../../contexts/useStore.js';
import { getModuleNodes } from '../../utils/nodeUtils.js';

import { parseCode } from '../../utils/parser';

import { mockModule } from './mocks.js';

const defaultViewport = { x: 0, y: 0, zoom: 1.5 };

import { getNodesForFile } from '../../utils/getNodesForFile.js';

import { TextNode } from '../../components/nodes/TextNode/TextNode.js';
import { MarkdownNode } from '../../components/nodes/MarkdownNode/MarkdownNode.js';

export const Flow = () => {
  const {
    setLayers,
    setCurrentLayer,
    layers,
    setNodes,
    setEdges,
    nodes,
    edges,
    state: layerState,
    currentLayer,
    onNodeDragStart,
    onNodeDragStop,
    functions,
    handleSave,
    shiftLayerUp,
    shiftLayerDown,
  } = useLayer();

  const { loadFileSystem, setFocusNode } = useStore();

  const loadModules = () => {
    // for testing
    try {
      const newModule = parseCode(mockModule);
      const fullPath = '/home/chris/marvel-app/src/app/character/[id]/page.tsx';
      const moduleNodes = getModuleNodes(newModule, fullPath);
      const { moduleNode, rootCode, children, edges: newEdges } = moduleNodes;

      const allNodes = [].concat(moduleNode).concat(rootCode).concat(children);

      setNodes((nodes) => {
        return nodes.concat(allNodes);
      });
      console.log('added nodes', allNodes);

      setEdges((edges) => {
        return edges.concat(newEdges);
      });
    } catch (e) {
      console.error('error parsing module:', e);
    }
  };

  const addKeyListener = () => {
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
  };

  useEffect(() => {
    const loadSessions = async () => {
      return;
    };
    loadSessions();
    loadModules();
    onFolderSelected('/home/chris/marvel-app');
    addKeyListener();
  }, []);

  const onNodeClick = (event, node) => {
    setFocusNode(node);
  };

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
    []
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
        onNodeClick={onNodeClick}
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
          <SearchBar
            searchContent={functions}
            onSearchSelect={onSearchSelect}
          />
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
