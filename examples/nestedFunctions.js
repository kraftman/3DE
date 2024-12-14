import { unresolved } from './unresolved.js';
import { realImport } from './realImport.js';

const internalFunction = () => {
  console.log('internalFunction');
};

export const exportedFunction = () => {
  console.log('exportedFunction');
};

internalFunction();
