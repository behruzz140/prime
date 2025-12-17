import { BrowserWindow, shell, Menu } from "electron";
import { join } from "path";
import { is } from "@electron-toolkit/utils";

function getAppURL() {
  return is.dev && process.env["ELECTRON_RENDERER_URL"]
    ? process.env["ELECTRON_RENDERER_URL"]
    : join(__dirname, "../renderer/index.html");
}

export function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    title: "Parkly",
    fullscreen: false,
    kiosk: false,
    webPreferences: {
      nodeIntegration: false,
      preload: join(__dirname, "../preload/index.mjs"),
      sandbox: false,
      contextIsolation: true,
      allowRunningInsecureContent: false,
    },
  });

  if (is.dev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.maximize();

  mainWindow.on("ready-to-show", () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: "deny" };
  });

  mainWindow.loadURL(getAppURL());

  const EXIT_PASSWORD = "Waterman1$";

  async function showPasswordPrompt(parentWindow) {
    return new Promise((resolve) => {
      const prompt = new BrowserWindow({
        width: 350,
        height: 180,
        parent: parentWindow,
        modal: true,
        show: false,
        resizable: false,
        minimizable: false,
        maximizable: false,
        title: "Введите пароль для выхода",
        webPreferences: {
          nodeIntegration: true,
          contextIsolation: false,
        },
      });
      prompt.loadURL(
        "data:text/html;charset=utf-8," +
          encodeURIComponent(`
        <html>
        <body style="font-family:sans-serif;padding:20px;">
          <h3>Введите пароль для выхода</h3>
          <form id="form">
            <input id="password" type="password" autofocus style="width:100%;padding:8px;font-size:16px;" />
            <div style="margin-top:16px;text-align:right;">
              <button type="submit" style="padding:6px 16px;font-size:16px;">OK</button>
              <button type="button" id="cancel" style="padding:6px 16px;font-size:16px;">Отмена</button>
            </div>
          </form>
          <script>
            const { ipcRenderer } = require('electron');
            document.getElementById('form').onsubmit = (e) => {
              e.preventDefault();
              ipcRenderer.send('password-prompt-response', document.getElementById('password').value);
            };
            document.getElementById('cancel').onclick = () => {
              ipcRenderer.send('password-prompt-response', null);
            };
          </script>
        </body>
        </html>
      `)
      );
      prompt.once("ready-to-show", () => prompt.show());
      const { ipcMain } = require("electron");
      ipcMain.once("password-prompt-response", (event, password) => {
        resolve(password);
        prompt.close();
      });
      prompt.on("closed", () => {
        resolve(null);
      });
    });
  }

  mainWindow.on("blur", () => {
    const focused = BrowserWindow.getFocusedWindow();

    // Если ни одно окно не сфокусировано (или сфокусировано НЕ наше)
    if (!focused || !BrowserWindow.getAllWindows().includes(focused)) {
      // Фокус ушёл из нашего приложения — вернуть его
      mainWindow.setAlwaysOnTop(true); // иногда нужно
      mainWindow.focus();
    }
  });

  mainWindow.on("close", async (event) => {
    event.preventDefault();
    const password = await showPasswordPrompt(mainWindow);
    if (password === EXIT_PASSWORD) {
      mainWindow.destroy();
    } else if (password !== null) {
      await dialog.showMessageBox(mainWindow, {
        type: "error",
        message: "Неверный пароль!",
      });
    }
  });

  return mainWindow;
}
