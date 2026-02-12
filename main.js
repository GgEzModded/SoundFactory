const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs");

const dataPath = path.join(__dirname, "data", "sounds.json");

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

  const sounds = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
  sounds.push({ name, filePath });

  fs.writeFileSync(dataPath, JSON.stringify(sounds, null, 2));

  return { name, filePath };
});

ipcMain.handle("load-sounds", () => {
  if (!fs.existsSync(dataPath)) return [];
  return JSON.parse(fs.readFileSync(dataPath, "utf-8"));
});
ipcMain.handle("remove-sound", (event, filePath) => {
  try {
    if (!fs.existsSync(dataPath)) return;

    const sounds = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
    const index = sounds.findIndex(sound => sound.filePath === filePath);
    if (index === -1) return;
    sounds.splice(index, 1);

    fs.writeFileSync(dataPath, JSON.stringify(sounds, null, 2));
  } catch (err) {
    console.error("Error removing sound:", err);
  }
});


ipcMain.handle("rename-sound", (event, filePath, newName) => {
  try {
    if (!fs.existsSync(dataPath)) return;

    const sounds = JSON.parse(fs.readFileSync(dataPath, "utf-8"));

    const sound = sounds.find(s => s.filePath === filePath);
    if (sound) {
      sound.name = newName;
    }

    fs.writeFileSync(dataPath, JSON.stringify(sounds, null, 2));
  } catch (err) {
    console.error("Error renaming sound:", err);
  }
});


app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

