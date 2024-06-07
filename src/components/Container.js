import React, { useCallback, useState } from 'react';
import { useDrop } from 'react-dnd';
import { DraggableBox } from './DraggableBox';
import { ItemTypes } from './ItemTypes.js';

const styles = {
  width: 800,
  height: 800,
  border: '1px solid black',
  position: 'relative',
};
export const Container = ({}) => {
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
    <div ref={drop} style={styles}>
      {Object.keys(boxes).map((key) => (
        <DraggableBox key={key} id={key} {...boxes[key]} />
      ))}
    </div>
  );
};
