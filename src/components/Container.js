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
    a: { top: 20, left: 80, value: 'Drag me around', type: 'code' },
    b: {
      top: 180,
      left: 20,
      value: 'module.exports = () => {return 5}',
      type: 'code',
      tests: 'c',
    },
    c: {
      top: 180,
      left: 250,
      value: `
      import { expect, test } from 'vitest'
      import code from './code'
      
      test('runs code', () => {
        expect(code()).toBe(5)
      })
    `,
      type: 'test',
      parent: 'b',
      hidden: false,
    },
  });

  const showTest = (id) => {
    const thisBox = boxes[id];
    const testBoxId = thisBox.tests;
    const hidden = boxes[testBoxId].hidden;
    setBoxes((boxes) => ({
      ...boxes,
      [testBoxId]: {
        ...boxes[testBoxId],
        hidden: !hidden,
      },
    }));
  };

  const onTextChange = (id, value) => {
    setBoxes((boxes) => ({
      ...boxes,
      [id]: {
        ...boxes[id],
        value,
      },
    }));
  };

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

  const onTest = (id) => {
    console.log('==== id', id);
    const thisBox = boxes[id];
    const parentBox = boxes[thisBox.parent];
    window.electronAPI.sendToMain('run-node-process', {
      id: id,
      test: thisBox.value,
      code: parentBox.value,
    });
  };

  window.electronAPI.receiveFromMain('process-response', (response) => {
    console.log('==== response', response);

    const id = response.id;
    const testBox = boxes[id];
    console.log('==== set passing to ', response.status === 'success');
    const newBox = {
      ...boxes[id],
      passing: response.status === 'success',
    };
    setBoxes((boxes) => ({
      ...boxes,
      [id]: newBox,
    }));
    //do the same for parent box
    const newParentBox = {
      ...boxes[testBox.parent],
      passing: response.status === 'success',
    };
    setBoxes((boxes) => ({
      ...boxes,
      [testBox.parent]: newParentBox,
    }));
  });

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
        {Object.keys(boxes).map(
          (key) =>
            (!boxes[key].hidden && (
              <DraggableBox
                key={key}
                id={key}
                {...boxes[key]}
                type={boxes[key].type}
                onShowTest={showTest}
                passing={boxes[key].passing}
                onTextChange={onTextChange}
                onTest={onTest}
              />
            )) ||
            null
        )}
      </div>
    </>
  );
};
