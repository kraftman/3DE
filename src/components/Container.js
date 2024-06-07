import React, { useCallback, useState } from 'react';
import { useDrop } from 'react-dnd';
import { DraggableBox } from './DraggableBox';
import { ItemTypes } from './ItemTypes.js';
import { Button, Box, TextField } from '@mui/material';

const styles = {
  width: 800,
  height: 800,
  border: '1px solid black',
  position: 'relative',
};

const tempCommand = {
  code: 'module.exports = () => {return 5}',
  test: `
    import { expect, test } from 'vitest'
    import code from './code'
    
    test('runs code', () => {
      expect(code()).toBe(5)
    })
  `,
};

export const Container = ({}) => {
  const handleCommandChange = (event) => {
    setCommand(event.target.value);
  };

  const handleRunCommand = () => {
    window.electronAPI.sendToMain('run-node-process', tempCommand);
  };

  const [command, setCommand] = useState('');
  const [boxes, setBoxes] = useState({
    a: { top: 20, left: 80, title: 'Drag me around' },
    b: { top: 180, left: 20, title: 'Drag me too' },
  });
  const moveBox = useCallback(
    (id, left, top) => {
      setBoxes((boxes) => ({
        ...boxes,
        [id]: {
          ...boxes[id],
          left,
          top,
        },
      }));
    },
    [boxes]
  );
  const [, drop] = useDrop(
    () => ({
      accept: ItemTypes.BOX,
      drop(item, monitor) {
        const delta = monitor.getDifferenceFromInitialOffset();
        let left = Math.round(item.left + delta.x);
        let top = Math.round(item.top + delta.y);

        moveBox(item.id, left, top);
        return undefined;
      },
    }),
    [moveBox]
  );
  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <TextField
          label="Enter a command"
          variant="outlined"
          value={command}
          onChange={handleCommandChange}
          sx={{ mr: 2 }}
        />
        <Button variant="contained" onClick={handleRunCommand}>
          Run Command
        </Button>
      </Box>
      <div ref={drop} style={styles}>
        {Object.keys(boxes).map((key) => (
          <DraggableBox key={key} id={key} {...boxes[key]} />
        ))}
      </div>
    </>
  );
};
