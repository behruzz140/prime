import axios from "axios";
import cron from "node-cron";
import db from "../../db/database.js";
import { checkInternetConnection } from "@/utils/checkInternet.js";
import { isPayedToday } from "@/utils/calculatePrice.js";
import { deleteSession } from "@/utils/sessionFunctions.js";
import { insertHeartbeatSolo, insertHeartbeat } from "../services/heartbeat.service.js";

const startCronJob = () => {
  cron.schedule("*/10 * * * *", async () => {
    try {
      if (!(await checkInternetConnection())) return;
      console.log("CRON STARTED ===================================");

      const cameras = db.prepare("SELECT * from cameras").all();

      const stmt = db.prepare("SELECT * FROM sessions where isUpdated = 1 or isSync = 0");
      const sessions = stmt.all();
      for (const item of sessions) {
        if (!item.plateNumber) {
          item.plateNumber = item.id;
        }

        if (item.cameraIp) {
          item.operatorId = cameras.find((camera) => camera.ip == item.cameraIp).operatorId;
        }
      }

      const sessionCount = Math.ceil(sessions.length / 30);

      for (let i = 1; i <= sessionCount; i++) {
        await postBulkOld(sessions, i);
      }
    } catch (error) {
      console.log(error);
    }
  });

  const postBulkOld = async (sessions, sessionCount) => {
    const is_market = db.prepare("SELECT * from config ORDER BY id ASC").get()?.is_market;

    if (is_market == 1) {
      await axios
        .post(
          `https://raqamli-bozor.uz/services/platon-core/api/v2/desktop/market/vehicles`,
          {
            type: "bulk_insert",
            data: sessions.slice((sessionCount - 1) * 30, sessionCount * 30),
          },
          {
            headers: {
              Authorization: "Basic cG1zXzMwNjU3Njg1MzphM2YxYzhkOTJiN2U0ZjY1",
            },
          }
        )
        .then((res) => {
          if (res.status != 200) return;

          const sessionIds = sessions.map((session) => session.id);
          if (sessionIds.length > 0) {
            const placeholders = sessionIds.map(() => "?").join(",");
            db.prepare(
              `UPDATE sessions SET isSync = 1, isUpdated = 0 WHERE id IN (${placeholders})`
            ).run(...sessionIds);
          }
        });
    } else {
      await axios
        .post(
          `https://raqamli-bozor.uz/services/platon-core/api/v2/desktop/parking/vehicles`,
          {
            type: "bulk_insert",
            data: sessions.slice((sessionCount - 1) * 30, sessionCount * 30),
          },
          {
            headers: {
              Authorization: "Basic cG1zXzMwNjU3Njg1MzphM2YxYzhkOTJiN2U0ZjY1",
            },
          }
        )
        .then((res) => {
          if (res.status != 200) return;

          const sessionIds = sessions.map((session) => session.id);
          if (sessionIds.length > 0) {
            const placeholders = sessionIds.map(() => "?").join(",");
            db.prepare(
              `UPDATE sessions SET isSync = 1, isUpdated = 0 WHERE id IN (${placeholders})`
            ).run(...sessionIds);
          }
        });
    }
  };
  cron.schedule("50 23 * * *", () => {
    const outputCamera = db.prepare("SELECT * from cameras where type = 'output'").get();

    const sessions = db.prepare(`SELECT * FROM sessions where endTime is null`).all();

    for (let i = 0; i < sessions.length; i++) {
      const cost = null;

      db.prepare(
        `
        UPDATE sessions
          set outputCost = ?,
          cameraIp = ?,
          mac = ?,
          endTime = ?,
          outputPaymentMethod = 1,
          isInner = 0
        WHERE id = ?`
      ).run(cost, outputCamera.ip, outputCamera.mac, new Date().toISOString(), sessions[i].id);
    }
  });

  cron.schedule("0 0 * * *", () => {
    const stmt = db.prepare(
      `SELECT * FROM sessions where isUpdated = 0 and isSync = 1 and endTime is not null and isInner = 0`
    );

    const sessions = stmt.all();

    for (const session of sessions) {
      const isPayed = isPayedToday(
        session.plateNumber || session.id,
        session.plateNumber ? "number" : "id"
      );

      if (!isPayed) {
        deleteSession(session.id);
      }
    }
  });

  cron.schedule("* * * * *", async () => {
    await insertHeartbeatSolo(1);
    await insertHeartbeat(2);
  });
};

export default startCronJob;
