import { initialSettingsState, tempInput } from './mocks';

export const getInitialNodes = (initialSettingsState) => [
  {
    id: '1',
    data: {
      fileName: './MyComponent.js',
      value: tempInput,
      handles: [],
    },
    type: 'editor',
    position: { x: 500, y: 100 },
  },
  {
    id: '2',
    data: {
      fileName: 'Settings.js',
      value: '',
      handles: [],
      settings: initialSettingsState,
    },
    type: 'group',
    position: { x: 200, y: 100 },
  },
  // {
  //   id: '2',
  //   data: {
  //     fileName: 'Settings.js',
  //     value: '',
  //     handles: [],
  //     settings: initialSettingsState,
  //   },
  //   type: 'settings',
  //   position: { x: 200, y: 100 },
  // },
];
