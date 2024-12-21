import { unresolved } from './unresolved.js';
import { realImport } from './realImport.js';

const internalFunction = (arg1, arg2, arg3) => {
  console.log('internalFunction');
};

export const exportedFunction = (arg1, { spreadArg1, spreadArg2 }) => {
  console.log('exportedFunction');
};

function exampleWithNestedFunc(
  param1,
  { key1, key2 },
  param2 = 'default',
  ...rest
) {
  console.log(param1, key1, key2, param2, rest);

  const nestedFunction1 = (nestedArg1) => {
    console.log('nestedFunction1');
  };
}

internalFunction();
