import React from 'react';
import { Handle } from '@xyflow/react';
import { findFileForImport } from '../../../utils/fileUtils';
import { useNodeManager } from '../../../hooks/useNodeManager';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { AddImportModal } from './AddImportModal';
import path from 'path-browserify';
import { useFileSystem } from '../../../stores/useFileSystem';
import { getImports } from '../../../utils/parser';
import { parseImports } from '../../../utils/nodeUtils/parseImports';

const { namedTypes: n, visit, builders: b } = require('ast-types');

//
// SHARED STYLES
//
const handleTextStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, 5px)',
  fontSize: '10px',
  pointerEvents: 'none',
  color: 'white',
  backgroundColor: 'black',
  border: '1px solid grey',
  padding: '2px 2px',
  boxSizing: 'border-box',
  borderRadius: '4px',
  whiteSpace: 'nowrap',
  textAlign: 'center',
};

// Base button style that all import-related button
const baseButtonStyle = {
  position: 'absolute',
  display: 'inline-flex',
  justifyContent: 'center',
  alignItems: 'center',
  transform: 'translate(50%, 0)',
  fontSize: '10px',
  backgroundColor: 'black',
  padding: '2px 4px',
  boxSizing: 'border-box',
  borderRadius: '4px',
  textAlign: 'center',
};

// Variants for different scenarios
const missingImportButtonStyle = {
  ...baseButtonStyle,
  color: 'red',
  border: '1px solid red',
};

const fileImportButtonStyle = {
  ...baseButtonStyle,
  color: 'white',
  border: '1px solid white',
};

const moduleImportButtonStyle = {
  ...baseButtonStyle,
  color: 'grey',
  border: '1px solid white',
};

//
// CHILD COMPONENTS
//
const CollapsedHandle = ({ handle }) => {
  return (
    <Handle
      key={handle.key}
      type="source"
      position="right"
      id={handle.id}
      style={{ ...handle.style, top: '10px' }}
    />
  );
};

const MissingImportHandle = ({ handle, data }) => {
  const { createMissingImport } = useNodeManager((store) => ({
    createMissingImport: store.createMissingImport,
  }));

  return (
    <button
      onClick={() => {
        createMissingImport(data.moduleId, handle.data.fullPath);
      }}
      key={handle.key}
      style={{
        ...missingImportButtonStyle,
        top: handle.style.top,
        right: handle.style.right,
      }}
    >
      {handle.data.name}
    </button>
  );
};

/**
 * FileImportHandle, but expects a computed `top` from the parent
 * so other handles can be stacked below it.
 */
const FileImportHandle = ({ handle, data, top, onClick, showChildren }) => {
  const { toggleChildModule, togglePartialModule } = useNodeManager(
    (store) => ({
      toggleChildModule: store.toggleChildModule,
    })
  );

  const importButtons = handle.data.import.specifiers.map(
    (specifier, index) => {
      return (
        <button
          key={specifier.local + index}
          onClick={(e) => {
            console.log('func imort clicked', specifier);
            e.preventDefault();
            e.stopPropagation();
            togglePartialModule(
              data.moduleId,
              handle.data.name,
              specifier.local.name
            );
          }}
          style={{
            ...fileImportButtonStyle,
            borderColor: 'blue',
            top: top + 25 + index * 20,
            right: handle.style.right,
          }}
        >
          {specifier.local?.name || specifier.imported?.name}
        </button>
      );
    }
  );

  return (
    <div>
      <Handle
        key={handle.key}
        type="source"
        position="right"
        id={handle.id}
        // We override the top with our computed offset:
        style={{ ...handle.style, top }}
      />
      <div
        style={{
          ...fileImportButtonStyle,
          top: top + 5,
          right: handle.style.right,
          backgroundColor: '#333', // Dark background for the div
          padding: '0px',
          borderRadius: '4px',
          display: 'flex',
          gap: '8px', // Space between buttons
          alignItems: 'center',
        }}
      >
        <button
          style={{
            backgroundColor: '#444', // Dark button background
            color: '#fff', // White text
            border: 'none',
            borderRadius: '2px',
            padding: '0px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
          onClick={() => {
            const depth = 1;
            onClick();
          }}
          key={handle.key + '_button'}
        >
          {handle.data.name}
        </button>
        <button
          style={{
            backgroundColor: '#444',
            color: '#fff',
            border: 'none',
            borderRadius: '2px',
            padding: '0px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={() => {
            console.log('handle click', handle);
            const depth = 1;
            toggleChildModule(data.moduleId, handle.data.fullPath, depth);
          }}
        >
          <ArrowForwardIcon style={{ color: '#fff', fontSize: '16px' }} />
        </button>
      </div>
      {showChildren[handle.key] ? importButtons : null}
    </div>
  );
};

const ModuleImportHandle = ({ handle, data }) => {
  const { toggleChildModule } = useNodeManager((store) => ({
    toggleChildModule: store.toggleChildModule,
  }));

  return (
    <div key={handle.key}>
      <Handle
        key={handle.key}
        type="source"
        position="right"
        id={handle.id}
        style={{ ...handle.style }}
      />
      <button
        disabled
        onClick={() => {
          console.log('handle click', handle);
          const depth = 1;
          toggleChildModule(data.moduleId, handle.data.fullPath, depth);
        }}
        key={handle.key + '_button'}
        style={{
          ...moduleImportButtonStyle,
          top: handle.style.top + 5,
          right: handle.style.right,
        }}
      >
        {handle.data.name}
      </button>
    </div>
  );
};

function replaceImports(thisPath, ast, exportNodes) {
  // 1. Remove all existing import declarations
  ast.program.body = ast.program.body.filter(
    (node) => node.type !== 'ImportDeclaration'
  );

  // 2. Group exports by relative path
  const groupedImports = {};
  exportNodes.forEach((exportNode) => {
    let relativePath = path.relative(path.dirname(thisPath), exportNode.path);
    if (!relativePath.startsWith('.') && !path.isAbsolute(relativePath)) {
      relativePath = `.${path.sep}${relativePath}`;
    }
    console.log('relativePath', relativePath);
    if (!groupedImports[relativePath]) {
      groupedImports[relativePath] = new Set();
    }
    groupedImports[relativePath].add(exportNode.name);
  });

  // 3. Create and insert fresh import declarations
  Object.entries(groupedImports).forEach(([importPath, names]) => {
    console.log('importPath', importPath);
    const specifiers = Array.from(names).map((name) =>
      b.importSpecifier(b.identifier(name))
    );
    console.log('specifiers', specifiers);
    const importDeclaration = b.importDeclaration(
      specifiers,
      b.literal(importPath)
    );
    console.log('creating new import, ', importDeclaration);
    // Insert at the top of the file
    ast.program.body.unshift(importDeclaration);
  });
  console.log(' new ast', ast);
}

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
