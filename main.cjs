const { app, BrowserWindow } = require('electron');
const path = require('node:path');

const isWidget = process.argv.includes('--widget')
  || /widget/i.test(path.basename(process.execPath));

function createWindow() {
  const window = new BrowserWindow({
    width: isWidget ? 440 : 1440,
    height: isWidget ? 760 : 1000,
    minWidth: isWidget ? 360 : 900,
    minHeight: isWidget ? 600 : 700,
    show: false,
    alwaysOnTop: isWidget,
    backgroundColor: '#f5f1e8',
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  window.loadFile(path.join(__dirname, 'index.html'), {
    query: isWidget ? { widget: '1' } : {},
  });

  window.once('ready-to-show', () => window.show());
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
