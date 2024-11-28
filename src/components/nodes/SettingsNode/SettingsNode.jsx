import React from 'react';
import { memo } from 'react';
import { Handle, Position, NodeResizer } from '@xyflow/react';
import { TabComponent } from './TabComponent';

const SettingsNodeInternal = ({ data, selected }) => {
  return (
    <div className="text-updater-node">
      <TabComponent data={data} />
    </div>
  );
};

export const SettingsNode = memo(SettingsNodeInternal);
