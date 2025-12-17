import db from "../../db/database.js";
import axios from "axios";

const insertHeartbeatSolo = async () => {
  try {
    const data = db
      .prepare("INSERT INTO heartbeat (date) VALUES (?)")
      .run(new Date().toISOString());

    const beats = [];

    const beat = db.prepare("SELECT * FROM heartbeat WHERE id = ?").get(data.lastInsertRowid);

    beats.push(beat);

    const camera = db.prepare("SELECT * FROM cameras WHERE mac is not null").get();

    const formattedBeats = beats.map((item) => {
      item.mac_address = camera.mac;
      item.type = 1;

      return item;
    });

    await axios
      .post(
        "https://raqamli-bozor.uz/services/platon-core/api/v1/pms/heartbeat",
        {
          data: formattedBeats,
        },
        {
          headers: {
            Authorization: "Basic cG1zXzMwNjU3Njg1MzphM2YxYzhkOTJiN2U0ZjY1",
            "Content-Type": "application/json",
          },
        }
      )
      .then((res) => {
        if (res.status == 200) {
          db.prepare("UPDATE heartbeat SET isSync = 1 WHERE id = ?").run(data.lastInsertRowid);
        }
      });

    return true;
  } catch (error) {
    console.error(error);
  }
};

const insertHeartbeat = async () => {
  try {
    const beats = db.prepare("SELECT * FROM heartbeat WHERE isSync = 0").all();
    const camera = db.prepare("SELECT * FROM cameras WHERE mac is not null").get();

    const formattedBeats = beats.map((item) => {
      item.mac_address = camera.mac;
      item.type = 2;

      return item;
    });

    await axios
      .post(
        "https://raqamli-bozor.uz/services/platon-core/api/v1/pms/heartbeat",
        {
          data: formattedBeats,
        },
        {
          headers: {
            Authorization: "Basic cG1zXzMwNjU3Njg1MzphM2YxYzhkOTJiN2U0ZjY1",
            "Content-Type": "application/json",
          },
        }
      )
      .then((res) => {
        if (res.status == 200) {
          db.prepare("UPDATE heartbeat SET isSync = 1").run();
        }
      });

    return true;
  } catch (error) {
    console.error(error);
  }
};

export { insertHeartbeat, insertHeartbeatSolo };
