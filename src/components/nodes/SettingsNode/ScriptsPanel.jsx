import React, { useState } from 'react';

const scripts = {
  start: 'electron-forge start',
  package: 'electron-forge package',
  make: 'electron-forge make',
  publish: 'electron-forge publish',
  lint: 'echo "No linting configured"',
  test: 'echo "No test configured"',
};

export const ScriptsPanel = () => {
  const [scriptList, setScriptList] = useState(scripts);

  const handleNameChange = (oldName, newName) => {
    if (newName.trim() === '') return;
    const updatedScripts = { ...scriptList };
    updatedScripts[newName] = updatedScripts[oldName];
    delete updatedScripts[oldName];
    setScriptList(updatedScripts);
  };

  const handleContentChange = (name, newContent) => {
    const updatedScripts = { ...scriptList, [name]: newContent };
    setScriptList(updatedScripts);
  };

  return (
    <div
      style={{
        backgroundColor: '#121212',
        color: '#ffffff',
        padding: '20px',
        borderRadius: '8px',
      }}
    >
      <h2>Scripts</h2>
      {Object.entries(scriptList).map(([name, content]) => (
        <div key={name} style={{ marginBottom: '20px' }}>
          <input
            type="text"
            value={name}
            onChange={(e) => handleNameChange(name, e.target.value)}
            style={{
              backgroundColor: '#1e1e1e',
              color: '#ffffff',
              border: '1px solid #444',
              padding: '8px',
              marginBottom: '8px',
              width: '100%',
              boxSizing: 'border-box',
            }}
          />
          <textarea
            value={content}
            onChange={(e) => handleContentChange(name, e.target.value)}
            style={{
              backgroundColor: '#1e1e1e',
              color: '#ffffff',
              border: '1px solid #444',
              padding: '8px',
              width: '100%',
              boxSizing: 'border-box',
            }}
            rows="3"
          />
        </div>
      ))}
    </div>
  );
};
