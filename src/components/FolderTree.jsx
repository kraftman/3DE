import React, { useState, useEffect } from 'react';
import {
  UncontrolledTreeEnvironment,
  Tree,
  StaticTreeDataProvider,
  ControlledTreeEnvironment,
} from 'react-complex-tree';
import '@blueprintjs/core/lib/css/blueprint.css'
import { renderers as bpRenderers } from 'react-complex-tree-blueprintjs-renderers';

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
  sortDirectory(flat, parentKey)

  return flat;
}

function sortDirectory(flat, parentKey){
  const children = flat[parentKey].children;
  const folders = children.filter(child => flat[child].isFolder);
  const others = children.filter(child => !flat[child].isFolder);
  folders.sort();
  others.sort();

  const sortedChildren = folders.concat(others);

  flat[parentKey].children = sortedChildren;
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

  useEffect(() => {
    const handleDragEnd = (event) => {
      const fullPath = event.target.getAttribute('data-rct-item-id');
      const isInTree = event.target.closest('.react-complex-tree');
      if (!isInTree && !flat[fullPath].isFolder) {
        onFileSelected(event);
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
      }
    };
    window.addEventListener('dragend', handleDragEnd);
    return () => {
      window.removeEventListener('dragend', handleDragEnd);
    };
  }, [folderData]);

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
