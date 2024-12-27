const thisIsInternal = () => {
  console.log('This is internal');
};

export const thisIsAnExport = () => {
  thisIsInternal();
  console.log('This is an export');
};

export const thisIsAnotherExport = () => {
  thisIsInternal();
  console.log('This is another export');
};
