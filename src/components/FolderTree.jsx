import React, { useState } from 'react';
import {
  UncontrolledTreeEnvironment,
  Tree,
  StaticTreeDataProvider,
  ControlledTreeEnvironment,
} from 'react-complex-tree';
import 'react-complex-tree/lib/style-modern.css';

function flattenStructure(flat, nestedStructure, parentKey) {
  nestedStructure.forEach((child) => {
    flat[parentKey].children.push(child.path);
    flat[child.path] = {
      index: child.path,
      children: [],
      data: child.name,
      isFolder: child.isDirectory,
    };
    if (child.isDirectory) {
      flattenStructure(flat, child.contents, child.path);
    }
  });

  return flat;
}

export const BasicTree = ({ folderData, onFileSelected }) => {
  const [focusedItem, setFocusedItem] = useState();
  const [expandedItems, setExpandedItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);

  const wrapped = { name: 'root', contents: folderData };
  const flat = {
    root: {
      index: 'root',
      children: [],
      data: 'Root item',
      isFolder: true,
    },
  };

  flattenStructure(flat, wrapped.contents, 'root');

  window.addEventListener('dragend', (event) => {
    if (!event.target.closest('.react-complex-tree')) {
      console.log('Item was dragged out of the tree', event);
      const itemId = event.target.getAttribute('data-rct-item-id');
      console.log('Drag end - Item ID:', itemId);
      onFileSelected(itemId);
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
    }
  });

  return (
    <ControlledTreeEnvironment
      items={flat}
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
