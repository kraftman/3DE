import { unresolved } from './unresolved.js';
import { realImport } from './realImport.js';

const internalFunction = (arg1, arg2, arg3) => {
  console.log('internalFunction');
};

export const exportedFunction = ({ spreadArg1, spreadArg2 }) => {
  console.log('exportedFunction');
};

internalFunction();
