import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import { autoUpdater } from 'electron-updater';
import path from 'path';
import { fileURLToPath } from 'url';

autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;
autoUpdater.logger = console;

autoUpdater.setFeedURL({
  provider: 'github',
  owner: 'behruzz140',
  repo: 'prime',
  private: false // Agar repo public bo'lsa
});

autoUpdater.on('checking-for-update', () => {
  console.log('Yangilanish tekshirilmoqda...');
});

autoUpdater.on('update-available', (info) => {
  console.log('Yangi versiya mavjud:', info.version);
  dialog.showMessageBox({
    type: 'info',
    title: 'Yangilanish mavjud',
    message: `Yangi versiya ${info.version} mavjud. Yuklab olinmoqda...`,
    buttons: ['OK']
  });
});

autoUpdater.on('update-not-available', () => {
  console.log('Yangilanish mavjud emas');
});

autoUpdater.on('download-progress', (progressObj) => {
  console.log(`Yuklab olinmoqda: ${progressObj.percent}%`);
});

autoUpdater.on('update-downloaded', (info) => {
  console.log('Yangilanish yuklab olindi');
  dialog.showMessageBox({
    type: 'info',
    title: 'Yangilanish tayyor',
    message: 'Yangilanish yuklab olindi. Ilova qayta ishga tushadi...',
    buttons: ['OK']
  }).then(() => {
    setImmediate(() => autoUpdater.quitAndInstall());
  });
});

autoUpdater.on('error', (err) => {
  console.log('Yangilanishda xato:', err);
});

function checkForUpdates() {
  console.log('Yangilanish tekshirilmoqda...');
  autoUpdater.checkForUpdates();
}

app.whenReady().then(() => {
  createWindow();
  
  setTimeout(() => {
    checkForUpdates();
  }, 5000);
  
  setInterval(() => {
    checkForUpdates();
  }, 60 * 60 * 1000);
});
