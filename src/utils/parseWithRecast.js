import * as babelParser from '@babel/parser';
import * as recast from 'recast';

// Define a reusable parser
const babelParserWithConfig = {
  parse: (source) =>
    babelParser.parse(source, {
      sourceType: 'module',
      tokens: true,
      plugins: ['typescript', 'jsx', 'asyncGenerators', 'topLevelAwait'], // Add other plugins as needed
    }),
};

// Use this parser with recast
export const parseWithRecast = (code) => {
  try {
    return recast.parse(code, { parser: babelParserWithConfig });
  } catch (e) {
    console.error('error in parser:', e);
    console.log('code:', code);

    return null;
  }
};
