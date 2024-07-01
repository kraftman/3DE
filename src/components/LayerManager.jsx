import React, { useState } from 'react';

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

function getRandomDarkHexColorWithAlpha() {
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
}

const LayerPreview = ({ index, layer, onLayerSelected, selectedLayer }) => {
  const { color = '#ffffffff' } = layer;
  let outlineColor = lightenColor(color, 20); // Lighten by 20%

  if (selectedLayer === index) {
    outlineColor = '#ffffffff';
  }
  return (
    <div
      onClick={() => onLayerSelected(index)}
      style={{
        width: '100px',
        height: '100px',
        background: color,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: '10px', // Rounded edges
        border: `2px solid ${outlineColor}`, // Slightly lighter outline
        color: 'white', // Text color for better contrast
        fontWeight: 'bold', // Bold text
      }}
    >
      {index}
    </div>
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

  const onLayerSelected = (index) => {
    setCurrentLayer(index);
  };

  const layerComponents = [];
  for (const [index, layer] of Object.entries(layers)) {
    layerComponents.push(
      <LayerPreview
        key={index}
        index={index}
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
