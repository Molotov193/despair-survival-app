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
// main.js にこのコードブロックを追加してください

// UIレイアウトをファイルに保存する処理（コールバック形式に修正）
ipcMain.handle('save-ui-layout', (event, uiSettings) => {
  return new Promise((resolve, reject) => {
    console.log('--- main.js: save-ui-layout受信 ---');
    const layoutPath = path.join(app.getPath('userData'), 'ui-layout.json');

    console.log('受信したUI設定:', uiSettings);
    console.log('保存先ファイルパス:', layoutPath);

    fs.writeFile(layoutPath, JSON.stringify(uiSettings, null, 2), (error) => {
      if (error) {
        console.error('ファイル書き込みエラー:', error);
        resolve({ success: false, error: error.message }); // エラー情報を返す
      } else {
        console.log('ファイル書き込み成功！');
        resolve({ success: true }); // 成功したことを返す
      }
    });
  });
});

// UIレイアウトをファイルから読み込む処理（コールバック形式に修正）
ipcMain.handle('load-ui-layout', (event) => {
  return new Promise((resolve, reject) => {
    const layoutPath = path.join(app.getPath('userData'), 'ui-layout.json');
    
    // fs.readFileを使用して非同期にファイルを読み込む
    fs.readFile(layoutPath, 'utf8', (error, data) => {
      if (error) {
        // ENOENTはファイルが存在しないエラーなので、これは正常なケースとして扱う
        if (error.code === 'ENOENT') {
          console.log('UIレイアウトファイルはまだ存在しません。');
          resolve(null); // ファイルがない場合はnullを返す
        } else {
          console.error('UIレイアウトの読み込みに失敗しました:', error);
          resolve(null); // その他のエラーの場合もnullを返す
        }
      } else {
        try {
          console.log('UIレイアウトを読み込みました。');
          resolve(JSON.parse(data)); // 読み込んだデータを返す
        } catch (parseError) {
          console.error('UIレイアウトファイルの解析に失敗しました:', parseError);
          resolve(null);
        }
      }
    });
  });
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