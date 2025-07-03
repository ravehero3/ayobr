const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  selectOutputDirectory: () => ipcRenderer.invoke('select-output-directory'),
  writeFile: (filePath, buffer) => ipcRenderer.invoke('write-file', filePath, buffer),
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
  createDirectory: (dirPath) => ipcRenderer.invoke('create-directory', dirPath)
});
