import React, { useState, useEffect } from 'react';
import { Tree, ControlledTreeEnvironment } from 'react-complex-tree';
import '@blueprintjs/core/lib/css/blueprint.css';
import { renderers as bpRenderers } from 'react-complex-tree-blueprintjs-renderers';

import { useReactFlow } from '@xyflow/react';
import { useFileSystem } from '../stores/useFileSystem';
import { useFileManager } from '../hooks/useFileManager';

export const BasicTree = () => {
  const [focusedItem, setFocusedItem] = useState();
  const [expandedItems, setExpandedItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);

  const flatFiles = useFileSystem((state) => state.flatFiles);

  //console.log('flatFiles in tree', flatFiles);
  const { onFileSelected } = useFileManager();

  const { screenToFlowPosition } = useReactFlow();

  const onFileSelectedInternal = (event) => {
    const newPos = screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });
    const fullPath = event.target.getAttribute('data-rct-item-id');
    onFileSelected(newPos, fullPath);
  };

  useEffect(() => {
    const handleDragEnd = (event) => {
      const fullPath = event.target.getAttribute('data-rct-item-id');
      const isInTree = event.target.closest('.react-complex-tree');
      if (!isInTree && !flatFiles[fullPath].isFolder) {
        onFileSelectedInternal(event);
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
      }
    };
    window.addEventListener('dragend', handleDragEnd);
    return () => {
      window.removeEventListener('dragend', handleDragEnd);
    };
  }, [flatFiles]);

  return (
    <ControlledTreeEnvironment
      items={flatFiles}
      getItemTitle={(item) => item.data}
      viewState={{
        ['tree-2']: {
          focusedItem,
          expandedItems,
          selectedItems,
        },
      }}
      canDragAndDrop={true}
      canReorderItems={true}
      canDropOnFolder={true}
      canDropOnNonFolder={true}
      onDrop={(...args) => {
        console.log('==== onDrop', args);
      }}
      onFocusItem={(item) => setFocusedItem(item.index)}
      onExpandItem={(item) => setExpandedItems([...expandedItems, item.index])}
      onCollapseItem={(item) =>
        setExpandedItems(
          expandedItems.filter(
            (expandedItemIndex) => expandedItemIndex !== item.index
          )
        )
      }
      onSelectItems={(items) => setSelectedItems(items)}
      {...bpRenderers}
    >
      <div
        className="rct-dark"
        style={{ backgroundColor: '#222', color: '#e3e3e3', maxWidth: 300 }}
      >
        <Tree treeId="tree-2" rootItem="root" treeLabel="Tree Example" />
      </div>
    </ControlledTreeEnvironment>
  );
};
