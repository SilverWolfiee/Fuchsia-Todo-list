const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');
const fs = require('fs');

// ✅ Path to save todo tasks
const dataPath = path.join(__dirname, 'todolist.json');

// ✅ Path to lofi audio folder
const lofiDir = path.join(__dirname, 'assets', 'lofi');

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

  // Handle close request from renderer
  ipcMain.on('close-app', () => {
    win.close();
  });

  // Maintain always-on-top behavior dynamically
  win.on('blur', () => {
    win.setAlwaysOnTop(false);
  });

  win.on('focus', () => {
    win.setAlwaysOnTop(true);
  });
}

// ✅ Save tasks to file
ipcMain.handle('save-tasks', async (_, tasks) => {
  try {
    await fs.promises.writeFile(dataPath, JSON.stringify(tasks, null, 2));
    console.log('[SAVE] Tasks written to', dataPath);
    return { success: true };
  } catch (error) {
    console.error('[SAVE ERROR]', error);
    return { success: false, error: error.message };
  }
});

// ✅ Load tasks from file (create empty one if missing)
ipcMain.handle('load-tasks', async () => {
  try {
    if (!fs.existsSync(dataPath)) {
      await fs.promises.writeFile(dataPath, '[]'); // create empty todo file
      console.log('[INIT] Created new todolist.json at', dataPath);
    }

    const data = await fs.promises.readFile(dataPath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('[LOAD ERROR]', err);
    return [];
  }
});

// ✅ Return list of .mp3 files in /assets/lofi/
ipcMain.handle('getLofiTracks', async () => {
  try {
    const files = await fs.promises.readdir(lofiDir);
    const mp3Files = files
      .filter(file => file.toLowerCase().endsWith('.mp3'))
      .map(file => path.join('assets', 'lofi', file)); // Relative path for renderer
    return mp3Files;
  } catch (err) {
    console.error('Error reading lofi directory:', err);
    return [];
  }
});

// App ready
app.whenReady().then(createWindow);

// Quit when all windows closed
app.on('window-all-closed', () => {
  app.quit();
});
