const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: false // Needed for local file access
    },
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#050A13',
    show: false
  });

  // Load the React app
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile('index.html');
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC handlers for file operations
ipcMain.handle('select-output-directory', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: 'Select Output Directory'
  });
  
  if (!result.canceled) {
    return result.filePaths[0];
  }
  return null;
});

ipcMain.handle('write-file', async (event, filePath, buffer) => {
  try {
    await fs.promises.writeFile(filePath, buffer);
    return { success: true };
  } catch (error) {
    console.error('File write error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('read-file', async (event, filePath) => {
  try {
    const buffer = await fs.promises.readFile(filePath);
    return { success: true, data: buffer };
  } catch (error) {
    console.error('File read error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('create-directory', async (event, dirPath) => {
  try {
    await fs.promises.mkdir(dirPath, { recursive: true });
    return { success: true };
  } catch (error) {
    console.error('Directory creation error:', error);
    return { success: false, error: error.message };
  }
});
