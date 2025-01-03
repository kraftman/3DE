import React from 'react';
import { Handle } from '@xyflow/react';
import IconButton from '@mui/material/IconButton';
import SettingsIcon from '@mui/icons-material/Settings';

import { useUpdateNodeInternals } from '@xyflow/react';

import { findFileForImport } from '../../../utils/fileUtils';
import { AddImportModal } from './AddImportModal';
import { useFileSystem } from '../../../stores/useFileSystem';
import { getImports } from '../../../utils/parser';
import { parseImports } from '../../../utils/nodeUtils/parseImports';
import { FileImportHandle } from './ImportManager/FileImportHandle';
import { CollapsedHandle } from './ImportManager/CollapseHandle';
import { MissingImportHandle } from './ImportManager/MissingImportHandle';
import { ModuleImportHandle } from './ImportManager/ModuleImportHandle';
import { handleTextStyle } from './ImportManager/styles';
import { replaceImports } from '../../../utils/astUtils';
import { useStore } from '../../../contexts/useStore';

/**
 * FileImportHandle, but expects a computed `top` from the parent
 * so other handles can be stacked below it.
 */

export const getImportHandles = (imports, moduleId) => {
  const localImports = imports.filter((imp) => imp.importType === 'local');

  return localImports.map((imp, index) => {
    return {
      moduleId: moduleId,
      parentId: moduleId,
      funcName: imp.moduleSpecifier,
      refType: 'import',
      id: moduleId + '-' + imp.fullPath + ':out',
      key: imp.fullPath + ':out',
      type: 'source',
      position: 'right',
      style: {
        top: 100 + 30 * index,
        right: 0,
        borderColor: imp.importType === 'local' ? 'blue' : 'green',
      },
      data: {
        name: imp.moduleSpecifier,
        fullPath: imp.fullPath,
        importType: imp.importType,
        import: imp,
      },
    };
  });
};

const ImportManager = React.memo(({ flatFiles, data }) => {
  let currentTop = 100;

  const handleSpacing = 30;
  const [showChildren, setShowChildren] = React.useState({});
  const updateNodeInternals = useUpdateNodeInternals();
  const [isOpen, setIsOpen] = React.useState(false);
  const setNodes = useStore((state) => state.setNodes);
  console.log('inside import hanlde manager');

  const fileInfo = flatFiles[data.fullPath];
  const setFlatFiles = useFileSystem((state) => state.setFlatFiles);

  const handleNewImports = (newExports) => {
    setIsOpen(false);

    if (!Array.isArray(newExports)) {
      return;
    }
    console.log('new exports', newExports);
    replaceImports(data.fullPath, fileInfo.fullAst, newExports);
    const imports = getImports(fileInfo.fullAst);
    const parsedImports = parseImports(imports, data.fullPath);

    setNodes((nodes) => {
      const newNodes = nodes.map((node) => {
        if (node.id === data.moduleId) {
          return {
            ...node,
            data: {
              ...node.data,
              imports: parsedImports,
            },
          };
        }
        return node;
      });
      return newNodes;
    });

    setFlatFiles({
      ...flatFiles,
      [data.fullPath]: {
        ...fileInfo,
        fullAst: fileInfo.fullAst,
        imports: parsedImports,
      },
    });
    updateNodeInternals(data.moduleId);
  };

  const initialImports = [];

  const handles = getImportHandles(fileInfo.imports, data.moduleId);

  handles.forEach((handle) => {
    handle.data.import.specifiers.forEach((specifier) => {
      let name = specifier?.local?.name;
      if (!specifier?.local?.name) {
        name = specifier?.imported?.name;
      }
      if (!name) {
        console.error('no name for specifier', specifier);
      }
      initialImports.push({
        name: name,
        path: handle.data.fullPath,
      });
    });
  });

  // Create the rest of the handles
  const otherHandles = handles?.map((handle) => {
    if (handle.refType !== 'import') {
      return (
        <Handle
          key={handle.key}
          type="source"
          position="right"
          id={handle.id}
          style={{ ...handle.style }}
        >
          <button style={handleTextStyle}>{handle.data.name}</button>
        </Handle>
      );
    }

    if (Object.keys(flatFiles).length === 0) {
      return null;
    }

    if (data.isCollapsed) {
      return <CollapsedHandle key={handle.key} handle={handle} />;
    }

    if (handle.data.fullPath === false) {
      return (
        <ModuleImportHandle key={handle.key} handle={handle} data={data} />
      );
    }

    if (findFileForImport(flatFiles, handle.data.fullPath)) {
      const importCount = handle?.data?.import?.specifiers?.length || 1;
      const topForThisHandle = currentTop;

      if (showChildren[handle.key]) {
        currentTop += importCount * handleSpacing;
      } else {
        currentTop += handleSpacing;
      }

      return (
        <FileImportHandle
          key={handle.key}
          handle={handle}
          data={data}
          top={topForThisHandle}
          showChildren={showChildren}
          onClick={() => {
            setShowChildren({
              ...showChildren,
              [handle.key]: !showChildren[handle.key],
            });
          }}
        />
      );
    }

    return <MissingImportHandle key={handle.key} handle={handle} data={data} />;
  });

  // Prepend the cog IconButton to the list of handles
  const allHandles = [
    <IconButton
      key="openModalCog"
      aria-label="open modal"
      onClick={() => setIsOpen(true)}
      style={{
        position: 'absolute',
        top: 70,
        right: 0,
        transform: 'translate(50%, -50%)',
      }}
      size="small"
    >
      <SettingsIcon />
    </IconButton>,
    ...otherHandles,
  ];

  return (
    <>
      {allHandles}
      <AddImportModal
        open={isOpen}
        onClose={handleNewImports}
        initialImports={initialImports}
      />
    </>
  );
});
ImportManager.displayName = 'ImportManager';
export { ImportManager };
