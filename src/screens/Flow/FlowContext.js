import React, { useReducer, createContext, useContext } from 'react';

const initialState = {
  layers: {
    0: { nodes: [], edges: [], color: '#11441166' },
  },
  currentLayer: 0,
};

const reducer = (state, action) => {
  switch (action.type) {
    case 'SET_LAYERS':
      return {
        ...state,
        layers:
          typeof action.payload === 'function'
            ? action.payload(state.layers)
            : action.payload,
      };
    case 'SET_CURRENT_LAYER':
      if (!state.layers[action.payload]) {
        // add a new layer
        return {
          ...state,
          layers: {
            ...state.layers,
            [action.payload]: { nodes: [], edges: [] },
          },
          currentLayer: action.payload,
        };
      }
      return {
        ...state,
        currentLayer: action.payload,
      };
    case 'SET_NODES':
      return {
        ...state,
        layers: {
          ...state.layers,
          [state.currentLayer]: {
            ...state.layers[state.currentLayer],
            nodes:
              typeof action.payload === 'function'
                ? action.payload(state.layers[state.currentLayer].nodes)
                : action.payload,
          },
        },
      };
    case 'SET_EDGES':
      return {
        ...state,
        layers: {
          ...state.layers,
          [state.currentLayer]: {
            ...state.layers[state.currentLayer],
            edges:
              typeof action.payload === 'function'
                ? action.payload(state.layers[state.currentLayer].edges)
                : action.payload,
          },
        },
      };
    default:
      return state;
  }
};

const FlowContext = createContext();

export const FlowProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <FlowContext.Provider value={{ state, dispatch }}>
      {children}
    </FlowContext.Provider>
  );
};

export const useFlow = () => useContext(FlowContext);
