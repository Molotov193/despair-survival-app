const { app, BrowserWindow, shell, ipcMain } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater'); // 自動アップデート機能を追加

// ストア（セーブデータ管理）をグローバルスコープで宣言
let store;

// --- セーブ＆ロード処理の受付窓口 ---
ipcMain.handle('save-game', (event, data) => {
  if (store) {
    store.set('saveData', data);
    console.log('Game data saved successfully.');
  }
});

ipcMain.handle('load-game', () => {
  if (store) {
    const data = store.get('saveData');
    console.log('Game data loaded.');
    return data;
  }
  return null;
});

ipcMain.handle('has-save-file', () => {
  return store ? store.has('saveData') : false;
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
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

// --- アプリのライフサイクル ---
app.whenReady().then(async () => {
  // ストアを初期化
  const { default: Store } = await import('electron-store');
  store = new Store();

  // ウィンドウを作成
  createWindow();
  
  // ★★★ ここで自動アップデートをチェックします ★★★
  autoUpdater.checkForUpdatesAndNotify();

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