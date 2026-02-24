const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  addSound: () => ipcRenderer.invoke("add-sound"),
  loadSounds: () => ipcRenderer.invoke("load-sounds"),
  removeSound: (filePath) => ipcRenderer.invoke("remove-sound", filePath),
  renameSound: (filePath, newName) =>
    ipcRenderer.invoke("rename-sound", filePath, newName),
  closeWindow: () => ipcRenderer.send("window-close"),
  minimizeWindow: () => ipcRenderer.send("window-minimize"),
  toggleMaximize: () => ipcRenderer.send("window-toggle-maximize"),
  getIsMaximized: () => ipcRenderer.invoke("window-is-maximized"),
  onWindowMaximized: (callback) =>
    ipcRenderer.on("window-maximized", (event, isMaximized) => callback(isMaximized))
});
