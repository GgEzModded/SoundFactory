const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  addSound: () => ipcRenderer.invoke("add-sound"),
  loadSounds: () => ipcRenderer.invoke("load-sounds"),
  removeSound: (filePath) => ipcRenderer.invoke("remove-sound", filePath),
  renameSound: (filePath, newName) =>
    ipcRenderer.invoke("rename-sound", filePath, newName)
});
