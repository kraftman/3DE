import { myFunction } from './import1';
import { myFunction as myFunction2 } from './import2';

const myFunctionThatUsesBothImports = () => {
  myFunction();
  myFunction2();
};
