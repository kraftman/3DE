import path from 'path-browserify';

interface Imports {
  importType: 'local' | 'module';
  fullPath: string;
  source: {
    type: string;
    value: string;
  };
}

export const parseImports = (imports, fullPath): Imports[] => {
  return imports.map((imp) => {
    const impPath = imp.source.value;
    const isLocal = impPath.startsWith('.') || impPath.startsWith('/');
    const impFullPath =
      isLocal && path.resolve(path.dirname(fullPath), impPath);
    return {
      ...imp,
      importType: isLocal ? 'local' : 'module',
      fullPath: impFullPath,
      moduleSpecifier: imp.source.value,
    };
  });
};
