import React from 'react';
import { Handle } from '@xyflow/react';
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

export const ImportManager = ({ flatFiles, data }) => {
  let currentTop = 100;

  const handleSpacing = 30;
  const [showChildren, setShowChildren] = React.useState({});
  const [isOpen, setIsOpen] = React.useState(false);

  const fileInfo = flatFiles[data.fullPath];
  const setFlatFiles = useFileSystem((state) => state.setFlatFiles);

  const handleNewImports = (newExports) => {
    console.log('new immports', newExports);
    setIsOpen(false);
    if (!newExports) {
      return;
    }
    console.log('before repalcing', fileInfo.fullAst);
    replaceImports(data.fullPath, fileInfo.fullAst, newExports);
    const imports = getImports(fileInfo.fullAst);
    console.log(' ===new imports', imports);
    const parsedImports = parseImports(imports, data.fullPath);
    console.log(' ==parsed imports', parsedImports);
    setFlatFiles({
      ...flatFiles,
      [data.fullPath]: {
        ...fileInfo,
        fullAst: fileInfo.fullAst,
        imports: parsedImports,
      },
    });
  };

  const initialImports = [];

  const handles = getImportHandles(fileInfo.imports, data.moduleId);
  console.log('handles', handles);

  handles.forEach((handle) => {
    handle.data.import.specifiers.forEach((specifier) => {
      let name = specifier?.local?.name;
      if (!specifier?.local?.name) {
        name = specifier?.imported?.name;
        //console.error('no name for specifier', specifier);
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
  console.log('initialImports', initialImports);

  // Build up all your handles
  const allHandles = handles?.map((handle) => {
    if (handle.refType !== 'import') {
      // Non-import handles remain the same
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

    // If it is an import handle:
    if (Object.keys(flatFiles).length === 0) {
      return null;
    }

    if (data.isCollapsed) {
      // If the node is collapsed:
      return <CollapsedHandle key={handle.key} handle={handle} />;
    }

    if (handle.data.fullPath === false) {
      // It's a module import that isn't resolved to a file
      return (
        <ModuleImportHandle key={handle.key} handle={handle} data={data} />
      );
    }

    // If we found the file for the import
    if (findFileForImport(flatFiles, handle.data.fullPath)) {
      const importCount = handle?.data?.import?.specifiers?.length || 1;
      const topForThisHandle = currentTop;

      // Increase currentTop by however tall you think this handle is:
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

    // Otherwise, it's a missing import handle:
    return <MissingImportHandle key={handle.key} handle={handle} data={data} />;
  });
  console.log('initialImports', initialImports);

  return (
    <>
      {allHandles}
      <button onClick={() => setIsOpen(true)}>Open Modal</button>
      <AddImportModal
        open={isOpen}
        onClose={handleNewImports}
        initialImports={initialImports}
      />
    </>
  );
};
