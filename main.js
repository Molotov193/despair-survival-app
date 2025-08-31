const { app, BrowserWindow, shell, ipcMain, dialog } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');
const log = require('electron-log'); // electron-logを読み込む

// --- ログ設定 ---
// アップデーターのログを有効化し、分かりやすい場所に保存する
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';
log.info('App starting...');

let store;

// --- セーブ＆ロード処理はそのまま ---
ipcMain.handle('save-game', (event, data) => {
  if (store) store.set('saveData', data);
});
ipcMain.handle('load-game', () => {
  return store ? store.get('saveData') : null;
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
}

// --- アプリのライフサイクル ---
app.whenReady().then(async () => {
  const { default: Store } = await import('electron-store');
  store = new Store();
  createWindow();

  // ▼▼▼ 自動アップデートの処理をデバッグモードで実行 ▼▼▼
  dialog.showMessageBox({ title: '起動', message: 'アプリが起動しました。これからアップデートを確認します。' });
  try {
    autoUpdater.checkForUpdates();
  } catch (error) {
    dialog.showErrorBox('アップデート確認エラー', error.toString());
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// --- 自動アップデートのイベント監視（各ステップでダイアログを出す） ---
autoUpdater.on('checking-for-update', () => {
  dialog.showMessageBox({ title: '確認中', message: 'アップデートを確認しています…' });
});

autoUpdater.on('update-not-available', (info) => {
  dialog.showMessageBox({ title: '最新です', message: 'アップデートはありません。現在が最新バージョンです。' });
});

autoUpdater.on('error', (err) => {
  dialog.showErrorBox('アップデートエラー', err.toString());
});

autoUpdater.on('update-available', (info) => {
  dialog.showMessageBox({ title: 'アップデートあり', message: '新しいバージョンが見つかりました。ダウンロードを開始します。' });
});

autoUpdater.on('update-downloaded', (info) => {
  dialog.showMessageBox({
    type: 'info',
    buttons: ['再起動', '後で'],
    title: 'アップデート',
    message: '新しいバージョンがダウンロードされました。アプリケーションを再起動してアップデートを適用します。'
  }).then((returnValue) => {
    if (returnValue.response === 0) autoUpdater.quitAndInstall();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});