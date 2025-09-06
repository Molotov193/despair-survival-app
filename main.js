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
// ▼▼▼ この2つのブロックを main.js に追加してください ▼▼▼

// --- 設定ファイルのパス ---
const settingsPath = path.join(app.getPath('userData'), 'settings.json');

// --- 設定を保存する処理 ---
ipcMain.handle('save-settings', (event, settings) => {
  try {
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
    return { success: true };
  } catch (error) {
    console.error('設定ファイルの保存に失敗しました:', error);
    return { success: false, error: error.message };
  }
});

// --- 設定を読み込む処理 ---
ipcMain.handle('load-settings', (event) => {
  try {
    if (fs.existsSync(settingsPath)) {
      const data = fs.readFileSync(settingsPath, 'utf8');
      return JSON.parse(data);
    }
    return null; // 設定ファイルが存在しない場合はnullを返す
  } catch (error) {
    console.error('設定ファイルの読み込みに失敗しました:', error);
    return null;
  }
});

// ▲▲▲ 追加ここまで ▲▲▲
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