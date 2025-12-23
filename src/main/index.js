import { app } from "electron";
import Store from "electron-store";
import { electronApp, optimizer } from "@electron-toolkit/utils";
import { createWindow } from "./window";
import { registerSessionEvents } from "./events/sessionEvents.js";
import { registerPrintEvent } from "./events/printEvent.js";
import db from "@/db/database.js";
import { startServer, stopServer } from "./serverControl";
import { updateMenu } from "./menu";
import logger from "./utils/logger.js";

const store = new Store();
let mainWindow;

const now = () =>
  new Date().toLocaleString("sv-SE", {
    timeZone: "Asia/Tashkent",
    hour12: false
  });

app.startTime = Date.now();
logger.info("APPLICATION_START_TIMESTAMP_SET", {
  startTime: now()
});

app.whenReady().then(() => {
  electronApp.setAppUserModelId("com.electron");

  logger.info("ELECTRON_APP_READY", {
    appName: app.getName(),
    version: app.getVersion(),
    time: now()
  });

  mainWindow = createWindow();
  logger.info("MAIN_WINDOW_CREATED", {
    windowId: mainWindow.id,
    time: now()
  });

  logger.logDatabaseEvent("connected", null, {
    path: db.name,
    connectionTime: now()
  });

  const checkboxState = store.get("checkboxState", false);
  logger.info("CHECKBOX_STATE", { state: checkboxState, time: now() });

  if (!checkboxState) {
    logger.logServerEvent("starting", {
      reason: "auto_start_enabled",
      timestamp: now()
    });

    try {
      startServer(mainWindow);
      logger.logServerEvent("started", {
        status: "running",
        startTime: now()
      });
    } catch (error) {
      logger.error("SERVER_START_FAILED", {
        error: error.message,
        stack: error.stack,
        time: now()
      });
    }
  } else {
    logger.info("SERVER_AUTOSTART_DISABLED", {
      reason: "checkbox_checked",
      action: "manual_start_required",
      time: now()
    });
  }

  updateMenu(mainWindow);
  logger.info("APPLICATION_MENU_UPDATED", { time: now() });

  app.on("browser-window-created", (_, window) => {
    optimizer.watchWindowShortcuts(window);
    logger.info("NEW_WINDOW_CREATED", {
      windowId: window.id,
      type: "browser_window",
      time: now()
    });
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
      logger.info("ALL_WINDOWS_CLOSED", {
        action: "quitting_application",
        platform: process.platform,
        time: now()
      });
      app.quit();
    } else {
      logger.info("WINDOWS_CLOSED_MACOS", {
        action: "keeping_app_active",
        windowsCount: 0,
        time: now()
      });
    }
  });

  app.on("quit", async () => {
    logger.info("APPLICATION_QUIT_INITIATED", { time: now() });

    try {
      logger.logServerEvent("stopping", { action: "cleanup", time: now() });
      await stopServer();
      logger.logServerEvent("stopped", {
        status: "success",
        stopTime: now()
      });
    } catch (error) {
      logger.error("SERVER_STOP_ERROR", {
        error: error.message,
        stack: error.stack,
        time: now()
      });
    }

    try {
      await db.close();
      logger.logDatabaseEvent("disconnected", null, {
        status: "closed",
        closeTime: now()
      });
    } catch (error) {
      logger.error("DATABASE_CLOSE_ERROR", {
        error: error.message,
        stack: error.stack,
        time: now()
      });
    }

    logger.info("CLEANUP_COMPLETED", { endTime: now() });
  });

  app.on("activate", () => {
    if (mainWindow === null) {
      logger.info("APP_REACTIVATED", {
        action: "creating_new_window",
        reason: "no_active_windows",
        time: now()
      });
      mainWindow = createWindow();
    } else {
      logger.info("APP_ACTIVATED", {
        action: "focusing_existing_window",
        windowId: mainWindow.id,
        time: now()
      });
      mainWindow.focus();
    }
  });

  registerSessionEvents();
  logger.info("SESSION_EVENTS_REGISTERED", {
    status: "success",
    registrationTime: now()
  });

  registerPrintEvent();
  logger.info("PRINT_EVENTS_REGISTERED", {
    status: "success",
    registrationTime: now()
  });

  logger.info("APPLICATION_INITIALIZATION_COMPLETED", {
    timestamp: now(),
    initDuration: Date.now() - app.startTime
  });
});

app.on("before-quit", () => {
  logger.info("BEFORE_QUIT_EVENT", {
    eventType: "before_quit",
    time: now()
  });
});

process.on("uncaughtException", error => {
  logger.error("UNCAUGHT_EXCEPTION", {
    error: error.message,
    stack: error.stack,
    name: error.name,
    processUptime: process.uptime(),
    time: now()
  });
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error("UNHANDLED_PROMISE_REJECTION", {
    reason: reason?.message || reason,
    promise: promise?.toString()?.substring(0, 100),
    processUptime: process.uptime(),
    time: now()
  });
});

app.on("browser-window-focus", (_, window) => {
  logger.info("WINDOW_FOCUSED", {
    windowId: window.id,
    time: now()
  });
});

app.on("browser-window-blur", (_, window) => {
  logger.info("WINDOW_BLURRED", {
    windowId: window.id,
    time: now()
  });
});
