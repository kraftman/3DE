// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  sendToMain: (channel, data) => {
    ipcRenderer.send(channel, data);
  },
  receiveFromMain: (channel, func) => {
    ipcRenderer.on(channel, (event, ...args) => func(...args));
  },
  invokeMain: (channel, data) => {
    return ipcRenderer.invoke(channel, data);
  },
});
