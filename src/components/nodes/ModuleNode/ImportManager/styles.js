export const handleTextStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, 5px)',
  fontSize: '10px',
  pointerEvents: 'none',
  color: 'white',
  backgroundColor: 'black',
  border: '1px solid grey',
  padding: '2px 2px',
  boxSizing: 'border-box',
  borderRadius: '4px',
  whiteSpace: 'nowrap',
  textAlign: 'center',
};

// Base button style that all import-related button
export const baseButtonStyle = {
  position: 'absolute',
  display: 'inline-flex',
  justifyContent: 'center',
  alignItems: 'center',
  transform: 'translate(50%, 0)',
  fontSize: '10px',
  backgroundColor: 'black',
  padding: '2px 4px',
  boxSizing: 'border-box',
  borderRadius: '4px',
  textAlign: 'center',
};

// Variants for different scenarios
export const missingImportButtonStyle = {
  ...baseButtonStyle,
  color: 'red',
  border: '1px solid red',
};

export const fileImportButtonStyle = {
  ...baseButtonStyle,
  color: 'white',
  border: '1px solid white',
};

export const moduleImportButtonStyle = {
  ...baseButtonStyle,
  color: 'grey',
  border: '1px solid white',
};
