const { app, BrowserWindow, shell, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let store;

// --- セーブ＆ロード処理 ---
ipcMain.handle('save-game', (event, data) => {
  if (store) store.set('saveData', data);
});

ipcMain.handle('load-game', () => {
  return store ? store.get('saveData') : null;
});

ipcMain.handle('has-save-file', () => {
  return store ? store.has('saveData') : false;
});

ipcMain.handle('load-language-file', (event, lang) => {
  try {
    const filePath = path.join(__dirname, 'locales', `${lang}.json`);
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(fileContent);
  } catch (error) {
    console.error(`言語ファイル(${lang}.json)の読み込みに失敗:`, error);
    dialog.showErrorBox('ファイル読み込みエラー', `言語ファイル(${lang}.json)が見つからないか、破損しています。`);
    return null;
  }
});

// --- ウィンドウ作成 ---
function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 760,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    }
  });
  mainWindow.loadFile('index.html');
}

// --- アプリのライフサイクル ---
app.whenReady().then(async () => {
  const { default: Store } = await import('electron-store');
  store = new Store();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});