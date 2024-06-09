import React from 'react';
import JsxParser from 'react-jsx-parser';

const jsxString = `
  <div>
    <h1>Hello, World!</h1>
    <SomeComponent prop1="value1" />
  </div>
`;

export const PreviewNode = ({ data }) => {
  return (
    <div>
      <JsxParser
        jsx={jsxString}
        // Add any additional components or functions you want to make available in the JSX
      />
    </div>
  );
};
