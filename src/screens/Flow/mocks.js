export const initialSettingsState = {
  packageJson: {
    name: 'my-new-app',
    productName: 'my-new-app',
    version: '1.0.0',
    description: 'My Electron application description',
    main: '.webpack/main',
    scripts: {
      start: 'electron-forge start',
      package: 'electron-forge package',
      make: 'electron-forge make',
      publish: 'electron-forge publish',
      lint: 'echo "No linting configured"',
      test: 'echo "No test configured"',
    },
    dependencies: {
      '@babel/parser': '^7.24.7',
      '@babel/standalone': '^7.24.7',
      '@babel/traverse': '^7.24.7',
      '@emotion/react': '^11.11.4',
      '@emotion/styled': '^11.11.5',
      '@fontsource/roboto': '^5.0.13',
      '@monaco-editor/react': '^4.6.0',
      '@mui/icons-material': '^5.15.19',
      '@mui/material': '^5.15.19',
      acorn: '^8.11.3',
      'electron-squirrel-startup': '^1.0.1',
      estraverse: '^5.3.0',
      'monaco-editor': '^0.49.0',
      'monaco-editor-webpack-plugin': '^7.1.0',
      react: '^18.3.1',
      'react-dnd': '^16.0.1',
      'react-dnd-html5-backend': '^16.0.1',
      'react-dom': '^18.3.1',
      'react-jsx-parser': '^1.29.0',
      'react-resizable': '^3.0.5',
      reactflow: '^11.11.3',
    },
  },
  prettier: '',
  eslint: '',
};

export const tempInput = `
import React from 'react';
export const myfunction = () => {
  return 'hello world';
}

export const myfunction2 = () => {
  return 'hello world';
}

const privateFunction = () => {
  return 'meep'; 
}

`;

export const mockModule = `
import { Container } from '@mui/material';
import { getCharacterById } from '../../actions/characterActions';
import { CharacterDetail } from '../../../components/CharacterDetail';

const Page = async ({ params }) => {
  const { id } = params;

  const character = await getCharacterById(id);

  return (
    <Container> 
      <CharacterDetail character={character} />
    </Container>
  );
};

export default Page; 


`;

export const mockModuleold = `
import { something 
 } from './module';
      import DefaultExport from './module2.js';
// comment
      //indented comment
     export const a = 10;


import { namedExport as alias } from './module3.js';
        import * as namespace from './module4.js';
import DefaultExport2, { namedExport } from './module5.js';



const anonDepth1 = () => {
        console.log('meeep in anon depth 1');
}

function decFunc2Depth1() {
  anonDepth1()
  console.log(
  'doing something decFunc2Depth1');
        return 'testreturn'
  anonDepth1()  
  return 'test return'
}
  

export function exportDepth1(param1, param2) {
  const a = '1 '
  const depth2Anon =() => {
    console.log('inside another func depth2Anon')
  }
  function depth2Dec () {
          console.log('also inside func depth2Dec')
    // function depth3Dec() {
    //   console.log('third depth depth3Dec')
    // }
    // const depth3Anon = () => { 
    //   console.log('third depth anon depth3Anon')
    // } 
  }
    depth2Anon()
    
  console.log('doing something else in exportDepth1');
  something()
}

const b = a + 20;

export default b;
`;
