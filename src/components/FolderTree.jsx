import React from 'react';
import {
  UncontrolledTreeEnvironment,
  Tree,
  StaticTreeDataProvider,
  ControlledTreeEnvironment,
} from 'react-complex-tree';
import 'react-complex-tree/lib/style-modern.css';

const items = {
  root: {
    index: 'root',
    isFolder: true,
    children: ['child1', 'child2'],
    data: 'Root item',
  },
  child1: {
    index: 'child1',
    children: [],
    data: 'Child item 1',
  },
  child2: {
    index: 'child2',
    isFolder: true,
    children: ['child3'],
    data: 'Child item 2',
  },
  child3: {
    index: 'child3',
    children: [],
    data: 'Child item 3',
  },
};

const item2 = {
  root: {
    index: 'root',
    children: ['/home/chris/marvel-app/src/app/character/[id]'],
    data: 'Root item',
    isFolder: true,
  },
  '/home/chris/marvel-app/src/app/character/[id]': {
    index: '/home/chris/marvel-app/src/app/character/[id]',
    children: ['/home/chris/marvel-app/src/app/character/[id]/page.tsx'],
    data: '[id]',
    isFolder: true,
  },
  '/home/chris/marvel-app/src/app/character/[id]/page.tsx': {
    index: '/home/chris/marvel-app/src/app/character/[id]/page.tsx',
    children: [],
    data: 'page.tsx',
    isFolder: false,
  },
};
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

export const BasicTree = ({ folderData }) => {
  console.log('folderData:', folderData);
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
  console.log('flat:', flat);
  console.log('items:', items);

  const dataProvider = new StaticTreeDataProvider(item2);

  return (
    <ControlledTreeEnvironment
      items={flat}
      getItemTitle={(item) => item.data}
      viewState={{}}
      canDragAndDrop={true}
      canDropOnFolder={true}
      canReorderItems={true}
    >
      <div
        className="rct-dark"
        style={{ backgroundColor: '#222', color: '#e3e3e3' }}
      >
        <Tree treeId="tree-2" rootItem="root" treeLabel="Tree Example" />
      </div>
    </ControlledTreeEnvironment>
  );
};
