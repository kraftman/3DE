import { unresolved } from './unresolved.js';
import { realImport } from './realImport.js';

const internalFunction = (arg1, arg2, arg3) => {
  console.log('internalFunction');
};

export const exportedFunction = (arg1, { spreadArg1, spreadArg2 }) => {
  console.log('exportedFunction');
};

function example(param1, { key1, key2 }, param2 = 'default', ...rest) {
  console.log(param1, key1, key2, param2, rest);
}

internalFunction();
