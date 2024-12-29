import { secondLevelImport1 } from './secondLevelImport1';

const thisFunctionIsNotExported = () => {
  console.log('thisFunctionIsNotExported');
};

export const firstLevelImport2 = () => {
  console.log('firstLevelImport2');
};

export const thisFunctionIsNotImported = () => {
  console.log('thisFunctionIsNotImported');
};
