const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs");

const dataDir = path.join(__dirname, "data");
const localDataPath = path.join(dataDir, "sounds.local.json");
const exampleDataPath = path.join(dataDir, "sounds.example.json");
const defaultData = { sounds: [] };

function normalizeData(raw) {
  if (Array.isArray(raw)) {
    return { sounds: raw };
  }

  if (raw && Array.isArray(raw.sounds)) {
    return { sounds: raw.sounds };
  }

  return { sounds: [] };
}

function readDataFile(filePath) {
  if (!fs.existsSync(filePath)) return null;

  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    return normalizeData(JSON.parse(raw));
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
    return null;
  }
}

function writeLocalData(data) {
  fs.writeFileSync(localDataPath, JSON.stringify(data, null, 2));
}

function loadData() {
  const localData = readDataFile(localDataPath);
  if (localData) return localData;

  const exampleData = readDataFile(exampleDataPath);
  if (exampleData) return exampleData;

  writeLocalData(defaultData);
  return { sounds: [] };
}

function loadWritableData() {
  const localData = readDataFile(localDataPath);
  if (localData) return localData;

  const exampleData = readDataFile(exampleDataPath);
  return exampleData || { sounds: [] };
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1300,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js")
    }
  });

  win.loadFile("renderer/index.html");
}

ipcMain.handle("add-sound", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openFile"],
    filters: [
      { name: "Audio Files", extensions: ["mp3", "wav", "ogg"] }
    ]
  });

  if (result.canceled) return null;

  const filePath = result.filePaths[0];
  const name = path.basename(filePath);

  const data = loadWritableData();
  data.sounds.push({ name, filePath });

  writeLocalData(data);

  return { name, filePath };
});

ipcMain.handle("load-sounds", () => {
  const data = loadData();
  return data.sounds;
});

ipcMain.handle("remove-sound", (event, filePath) => {
  try {
    const data = loadWritableData();
    const index = data.sounds.findIndex(sound => sound.filePath === filePath);
    if (index === -1) return;
    data.sounds.splice(index, 1);

    writeLocalData(data);
  } catch (err) {
    console.error("Error removing sound:", err);
  }
});

ipcMain.handle("rename-sound", (event, filePath, newName) => {
  try {
    const data = loadWritableData();

    const sound = data.sounds.find(s => s.filePath === filePath);
    if (sound) {
      sound.name = newName;
    }

    writeLocalData(data);
  } catch (err) {
    console.error("Error renaming sound:", err);
  }
});

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
