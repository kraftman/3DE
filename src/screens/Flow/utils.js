import { EditorNode } from '../../components/nodes/EditorNode';
import { PreviewNode } from '../../components/nodes/PreviewNode';
import { GroupNode } from '../../components/nodes/GroupNode';
import { SettingsNode } from '../../components/nodes/SettingsNode/SettingsNode';
export const getNodeTypes = (flow) => ({
  editor: (props) => (
    <EditorNode
      onTextChange={onTextChange}
      onFileNameChange={onFileNameChange}
      onSelectionChange={onSelectionChange}
      {...props}
    />
  ),
  preview: PreviewNode,
  group: GroupNode,
  settings: (props) => (
    <SettingsNode {...props} onSettingsChanged={onSettingsChanged} />
  ),
});
