// ▼▼▼ このファイル全体をコピーして、既存の main.js と置き換えてください ▼▼▼

const { app, BrowserWindow, shell, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs'); // Node.jsのファイルシステムモジュールを追加
const { autoUpdater } = require('electron-updater');
const log = require('electron-log');

// --- ログ設定 ---
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';
log.info('App starting...');

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

// main.js の該当部分

ipcMain.handle('load-language-file', (event, lang) => {
  try {
    // 修正点：'locals' を正しいフォルダ名 'locales' に変更
    const filePath = path.join(__dirname, 'locales', `${lang}.json`);

    const fileContent = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(fileContent); // JSONオブジェクトとして返す
  } catch (error) {
    console.error(`言語ファイル(${lang}.json)の読み込みに失敗:`, error);
    dialog.showErrorBox('ファイル読み込みエラー', `言語ファイル(${lang}.json)が見つからないか、破損しています。`);
    return null; // 失敗した場合はnullを返す
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

  // 自動アップデートの処理
  autoUpdater.checkForUpdates();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// --- 自動アップデートのイベント監視 ---
autoUpdater.on('update-available', () => {
  dialog.showMessageBox({
    type: 'info',
    title: 'アップデートがあります',
    message: '新しいバージョンが見つかりました。ダウンロードを開始します。'
  });
});

autoUpdater.on('update-downloaded', () => {
  dialog.showMessageBox({
    type: 'info',
    buttons: ['再起動', '後で'],
    title: 'アップデート準備完了',
    message: '新しいバージョンがダウンロードされました。アプリケーションを再起動してアップデートを適用します。',
    detail: '再起動しない場合、次回起動時に自動でアップデートされます。'
  }).then(returnValue => {
    if (returnValue.response === 0) {
      autoUpdater.quitAndInstall();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});