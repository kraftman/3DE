const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('node:path');
const fs = require('fs');
const { exec } = require('child_process');
const util = require('util');
const runTest = require('./run-tests');

const execPromise = util.promisify(exec);

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    fullscreen: true,
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
    },
  });

  // and load the index.html of the app.
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
  return mainWindow;
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  ipcMain.on('run-node-process', async (event, arg) => {
    console.log(`Received data from renderer: ${arg}`);
    try {
      const res = await runTest(arg.code, arg.test);
      event.reply('process-response', {
        id: arg.id,
        status: 'success',
        detail: res,
      });
    } catch (e) {
      console.log('==== error in main ', e);
      event.reply('process-response', {
        id: arg.id,
        status: 'error',
        detail: e.message,
      });
    }
  });

  const mainWindow = createWindow();

  ipcMain.handle('load-file', async (event, filePath) => {
    const fileContents = fs.readFileSync(filePath, 'utf8');
    return fileContents;
  });

  ipcMain.handle('select-folder', async (event, arg) => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory'],
    });
    return result.filePaths[0];
  });

  ipcMain.handle('load-folder-tree', async (event, folderPath) => {
    const readDirectory = (directory) => {
      const items = fs.readdirSync(directory);
      const basePath = path.resolve(directory);
      return items
        .filter((item) => item !== '.git' && item !== 'node_modules')
        .map((item) => {
          const fullPath = path.join(basePath, item);
          const isDirectory = fs.statSync(fullPath).isDirectory();
          const newData = {
            name: item,
            path: fullPath,
            isDirectory,
            contents: isDirectory ? readDirectory(fullPath) : null,
          };
          return newData;
        });
    };

    const full = readDirectory(folderPath);
    const fullRootPath = path.resolve(folderPath);
    return { fullRootPath, folderTree: full };
  });

  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
