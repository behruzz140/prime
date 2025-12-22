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

  mainWindow.on("blur", () => {
    const focused = BrowserWindow.getFocusedWindow();

    if (!focused || !BrowserWindow.getAllWindows().includes(focused)) {
      mainWindow.setAlwaysOnTop(true);
      mainWindow.focus();
      mainWindow.setAlwaysOnTop(false); 
    }
  });

  mainWindow.on("close", (event) => {
  });

  return mainWindow;
}