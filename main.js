const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');
const fs = require('fs');

app.setPath('userData', path.join(app.getPath('appData'), 'Fuchsia Todo List'));
app.commandLine.appendSwitch('disk-cache-dir', path.join(app.getPath('userData'), 'Cache'));

const dataPath = path.join(app.getPath('userData'), 'todolist.json');
const lofiDir = path.join(app.getPath('userData'), 'lofi');

function ensureFolders() {
  if (!fs.existsSync(lofiDir)) fs.mkdirSync(lofiDir, { recursive: true });
  if (!fs.existsSync(dataPath)) fs.writeFileSync(dataPath, '[]');
}

function createWindow() {
  const { width } = screen.getPrimaryDisplay().bounds;
  const win = new BrowserWindow({
    width: 700,
    height: 450,
    x: width - 700,
    y: 0,
    resizable: false,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    hasShadow: false,
    icon: path.join(__dirname, 'assets', 'icons', 'Fufuhooked.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    }
  });

  win.loadFile('index.html');

  ipcMain.on('close-app', () => win.close());
  win.on('blur', () => win.setAlwaysOnTop(false));
  win.on('focus', () => win.setAlwaysOnTop(true));
}

ipcMain.handle('getLofiTracks', async () => {
  try {
    if (!fs.existsSync(lofiDir)) fs.mkdirSync(lofiDir, { recursive: true });
    const files = await fs.promises.readdir(lofiDir);
    return files.filter(f => f.endsWith('.mp3')).map(f => path.join(lofiDir, f));
  } catch {
    return [];
  }
});

ipcMain.handle('save-tasks', async (_, tasks) => {
  try {
    await fs.promises.writeFile(dataPath, JSON.stringify(tasks, null, 2));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('load-tasks', async () => {
  try {
    if (!fs.existsSync(dataPath)) await fs.promises.writeFile(dataPath, '[]');
    const data = await fs.promises.readFile(dataPath, 'utf8');
    return JSON.parse(data);
  } catch {
    return [];
  }
});

app.whenReady().then(() => {
  ensureFolders();
  createWindow();
});

app.on('window-all-closed', () => app.quit());
