import { app } from "electron";
import Store from "electron-store";
import { electronApp, optimizer } from "@electron-toolkit/utils";
import { createWindow } from "./window";
import { registerSessionEvents } from "./events/sessionEvents.js";
import { registerPrintEvent } from "./events/printEvent.js";
import db from "@/db/database.js";
import { startServer, stopServer } from "./serverControl";
import { updateMenu } from "./menu";
import { exec } from "child_process";
import path from "path";
import logger from "./utils/logger.js";

const store = new Store();
let mainWindow;

app.whenReady().then(() => {
  electronApp.setAppUserModelId("com.electron");
  
  logger.info("Electron app is ready");

  mainWindow = createWindow();
  logger.info("Main window created");

  if (!store.get("checkboxState", false)) {
    logger.info("Starting server...");
    startServer(mainWindow);
  } else {
    logger.info("Server autostart disabled by checkbox state");
  }

  updateMenu(mainWindow);
  logger.info("Application menu updated");

  logger.info(`Database path: ${db.name}`);

  app.on("browser-window-created", (_, window) => {
    optimizer.watchWindowShortcuts(window);
    logger.debug("Browser window created and shortcuts optimized");
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
      logger.info("All windows closed, quitting application");
      app.quit();
    } else {
      logger.debug("Window closed on macOS, keeping app alive");
    }
  });

  app.on("quit", async () => {
    logger.info("Application quitting, cleaning up resources");
    
    try {
      await stopServer();
      logger.info("Server stopped successfully");
    } catch (error) {
      logger.error("Failed to stop server:", { error: error.message });
    }
    
    try {
      await db.close();
      logger.info("Database connection closed");
    } catch (error) {
      logger.error("Failed to close database:", { error: error.message });
    }
    
    logger.info("Cleanup completed");
  });

  app.on("activate", () => {
    if (mainWindow === null) {
      logger.info("Activating app, creating new window");
      mainWindow = createWindow();
    } else {
      logger.debug("App activated, main window exists");
    }
  });

  try {
    registerSessionEvents();
    logger.info("Session events registered");
  } catch (error) {
    logger.error("Failed to register session events:", { error: error.message });
  }

  try {
    registerPrintEvent();
    logger.info("Print events registered");
  } catch (error) {
    logger.error("Failed to register print events:", { error: error.message });
  }

  logger.info("Application initialization completed");
});

app.on("before-quit", (event) => {
  logger.info("Application before-quit event fired");
});

process.on("uncaughtException", (error) => {
  logger.error("Uncaught exception:", { 
    error: error.message, 
    stack: error.stack 
  });
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled promise rejection:", { 
    reason: reason?.message || reason, 
    promise 
  });
});