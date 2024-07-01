import React, { useState } from 'react';
import IconButton from '@mui/material/IconButton';
import SettingsIcon from '@mui/icons-material/Settings';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';

import { ChromePicker } from 'react-color';
import { useLayer } from '../screens/Flow/useLayer';

const lightenColor = (color, percent) => {
  let r, g, b, a;

  if (color.length === 7) {
    // HEX color
    r = parseInt(color.slice(1, 3), 16);
    g = parseInt(color.slice(3, 5), 16);
    b = parseInt(color.slice(5, 7), 16);
    a = 1;
  } else if (color.length === 9) {
    // HEXA color
    r = parseInt(color.slice(1, 3), 16);
    g = parseInt(color.slice(3, 5), 16);
    b = parseInt(color.slice(5, 7), 16);
    a = parseInt(color.slice(7, 9), 16) / 255;
  } else {
    throw new Error('Invalid color format. Use #RRGGBB or #RRGGBBAA');
  }

  // Lighten the color
  r = Math.min(255, Math.floor(r * (1 + percent / 100)));
  g = Math.min(255, Math.floor(g * (1 + percent / 100)));
  b = Math.min(255, Math.floor(b * (1 + percent / 100)));

  if (a === 1) {
    return `#${r.toString(16).padStart(2, '0')}${g
      .toString(16)
      .padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  } else {
    const alphaHex = Math.floor(a * 255)
      .toString(16)
      .padStart(2, '0');
    return `#${r.toString(16).padStart(2, '0')}${g
      .toString(16)
      .padStart(2, '0')}${b.toString(16).padStart(2, '0')}${alphaHex}`;
  }
};

export const getRandomDarkHexColorWithAlpha = () => {
  // Generate random values for R, G, B between 0 and 100 for darker shades
  const r = Math.floor(Math.random() * 100);
  const g = Math.floor(Math.random() * 100);
  const b = Math.floor(Math.random() * 100);

  // Convert the values to hexadecimal
  const hexR = r.toString(16).padStart(2, '0');
  const hexG = g.toString(16).padStart(2, '0');
  const hexB = b.toString(16).padStart(2, '0');

  // Alpha value for slight transparency (0.7 in this case)
  const alpha = Math.floor(0.7 * 255)
    .toString(16)
    .padStart(2, '0');

  // Combine to form the hex color with alpha
  const hexColorWithAlpha = `#${hexR}${hexG}${hexB}${alpha}`;

  return hexColorWithAlpha;
};

const LayerPreview = ({ layerName, layer, onLayerSelected, selectedLayer }) => {
  const { color = '#ffffffff' } = layer;
  const [hover, setHover] = useState(false);
  const [open, setOpen] = useState(false);

  const { nodes, edges, currentLayer, layers, setLayers, setCurrentLayer } =
    useLayer();

  let outlineColor = lightenColor(color, 20); // Lighten by 20%

  if (selectedLayer === layerName) {
    outlineColor = '#ffffffff';
  }

  const handleOpen = (e) => {
    e.stopPropagation(); // Prevent the parent div's onClick from firing
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const onLayerNameChange = (e) => {
    const newName = e.target.value;
    let found;
    setLayers((layers) => {
      const newLayers = {};
      for (const [key, layer] of Object.entries(layers)) {
        if (!key === layerName) {
          newLayers[key] = value;
        } else {
          found = layer;
        }
      }
      newLayers[newName] = { ...found };
      console.log('new layrse', newLayers);
      return newLayers;
    });
    setCurrentLayer(newName);
  };

  return (
    <>
      <div
        onClick={() => onLayerSelected(layerName)}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          width: '100px',
          height: '100px',
          background: color,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative', // Position relative for absolute positioning of the icon
          borderRadius: '10px', // Rounded edges
          border: `2px solid ${outlineColor}`, // Slightly lighter outline
          color: 'white', // Text color for better contrast
          fontWeight: 'bold', // Bold text
        }}
      >
        {layerName}
        {hover && (
          <IconButton
            onClick={handleOpen}
            style={{
              position: 'absolute',
              top: '5px',
              right: '5px',
            }}
            size="small"
          >
            <SettingsIcon style={{ color: 'white' }} />
          </IconButton>
        )}
      </div>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
      >
        <Box
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 400,
            backgroundColor: 'white',
            border: '2px solid #000',
            boxShadow: 24,
            padding: '16px',
          }}
        >
          <h2 id="modal-title">Settings</h2>
          <TextField
            id="standard-basic"
            label="Layer Name"
            variant="standard"
            value={layerName}
            onChange={onLayerNameChange}
          />
          <ChromePicker color={layer.color} />
        </Box>
      </Modal>
    </>
  );
};

export const LayerManager = ({}) => {
  const { nodes, edges, currentLayer, layers, setLayers, setCurrentLayer } =
    useLayer();

  const onNewLayer = () => {
    setLayers((layers) => {
      const layerCount = Object.keys(layers).length;
      return {
        ...layers,
        [layerCount]: {
          nodes: [],
          edges: [],
          color: getRandomDarkHexColorWithAlpha(),
        },
      };
    });
  };

  const onLayerSelected = (layerName) => {
    setCurrentLayer(layerName);
  };

  const layerComponents = [];
  for (const [index, layer] of Object.entries(layers)) {
    layerComponents.push(
      <LayerPreview
        key={index}
        layerName={index}
        layer={layer}
        onLayerSelected={onLayerSelected}
        selectedLayer={currentLayer}
      />
    );
  }

  return (
    <div>
      <h1>LayerManager</h1>
      {layerComponents}
      <div
        onClick={onNewLayer}
        style={{
          width: '100px',
          height: '100px',
          background: '#aaaaaaaa',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          borderRadius: '10px', // Rounded edges
          border: `2px solid #cccccccc`, // Slightly lighter outline
          color: 'white', // Text color for better contrast
          fontWeight: 'bold', // Bold text
        }}
      >
        +
      </div>
    </div>
  );
};
