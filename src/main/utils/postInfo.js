const url = "https://raqamli-bozor.uz/services/platon-core/api";
import db from "@/db/database.js";
import fs from "fs";
import axios from "axios";
import FormData from "form-data";
import { checkInternetConnection } from "@/utils/checkInternet.js";

const postInfo = async (data) => {
  try {
    if (data.type == "insert") {
      if (!data.data.plateNumber) {
        data.data.plateNumber = data.data.id;
      }
    }

    const is_market = db.prepare("SELECT * from config ORDER BY id ASC").get()?.is_market;

    // console.log("postInfo data:", data);
    console.log("postInfo is_market:", is_market);

    if (is_market == 1) {
      const response = await axios.post(`${url}/v2/desktop/market/vehicles`, data, {
        headers: {
          Authorization: "Basic cG1zXzMwNjU3Njg1MzphM2YxYzhkOTJiN2U0ZjY1",
        },
      });

      if (data.type == "insert") {
        db.prepare("UPDATE sessions SET isSync = 1, isUpdated = 0 WHERE id = ?").run(data.data.id);
      } else {
        for (let i = 0; i < data.data.length; i++) {
          db.prepare("UPDATE sessions SET isSync = 1, isUpdated = 0 WHERE id = ?").run(
            data.data[i].id
          );
        }
      }

      return response.data;
    } else {
      console.log("Posting to parking endpoint");
      const response = await axios.post(`${url}/v2/desktop/parking/vehicles`, data, {
        headers: {
          Authorization: "Basic cG1zXzMwNjU3Njg1MzphM2YxYzhkOTJiN2U0ZjY1",
        },
      });

      // console.log("Posting to parking endpoint response:", response);

      if (data.type == "insert") {
        db.prepare("UPDATE sessions SET isSync = 1, isUpdated = 0 WHERE id = ?").run(data.data.id);
      } else {
        for (let i = 0; i < data.data.length; i++) {
          db.prepare("UPDATE sessions SET isSync = 1, isUpdated = 0 WHERE id = ?").run(
            data.data[i].id
          );
        }
      }

      return response.data;
    }
  } catch (error) {
    throw error;
  }
};

const uploadImage = async (filePath) => {
  try {
    if (!filePath) {
      return null;
    }
    const formDataOriginal = new FormData();
    const fileStream = fs.createReadStream(filePath);

    if (!fs.existsSync(filePath)) {
      throw new Error(`Файл ${filePath} не найден`);
    }
    formDataOriginal.append("file", fileStream);
    const original = await uploadMedia(formDataOriginal);
    return original.id;
  } catch (error) {
    throw error;
  }
};

const uploadMedia = async (config) => {
  try {
    const res = await axios.post(
      "https://raqamli-bozor.uz/services/platon-core/web/v1/public/files/upload/category/universal",
      config,
      {
        maxBodyLength: Infinity,
        headers: {
          "Content-Type": "multipart/form-data;",
        },
      }
    );

    return res.data;
  } catch (error) {
    throw error;
  }
};

const uploadOldInfos = async () => {
  try {
    if (!(await checkInternetConnection())) return;
    console.log("CRON STARTED ===================================");

    const stmt = db.prepare("SELECT * FROM sessions where isUpdated = 1 or isSync = 0");
    const sessions = stmt.all();
    for (const item of sessions) {
      if (!item.plateNumber) {
        item.plateNumber = item.id;
      }
    }

    axios.post(
      `${url}/v2/desktop/market/vehicles`,
      {
        data: sessions,
      },
      {
        headers: {
          Authorization: "Basic cG1zXzMwNjU3Njg1MzphM2YxYzhkOTJiN2U0ZjY1",
        },
      }
    );

    const sessionIds = sessions.map((session) => session.id);
    if (sessionIds.length > 0) {
      const placeholders = sessionIds.map(() => "?").join(",");
      db.prepare(`UPDATE sessions SET isSync = 1, isUpdated = 0 WHERE id IN (${placeholders})`).run(
        ...sessionIds
      );
    }
  } catch (error) {
    console.log(error);
  }
};

export { postInfo, uploadImage, uploadOldInfos };
