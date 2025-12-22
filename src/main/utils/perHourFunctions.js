import db from "../db/database";
import { getCameraOperator } from "../server/services/camera.service";
import { checkInternetConnection, checkInternetConnectionWithFallback } from "./checkInternet";
import generateOfd from "./generateOfd";
import { postInfo } from "./postInfo";
import { sendParkStats } from "./sessionFunctions";
import { getIO } from "./socket";

const registerHourly = async ({ plateImage, fullImage, number, cameraIp, tariffType, mac }) => {
  try {
    console.log("=== start work registerHourly ===")
    const stmt = db.prepare(`
    INSERT INTO sessions
      (plateNumber, inputPlateImage, inputFullImage, startTime, tariffType, duration, inputCost, inputPaymentMethod,cameraIp,lastActivity,mac)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?)
  `);

    const result = stmt.run(
      number,
      null,
      fullImage || null,
      new Date().toISOString(),
      tariffType,
      null,
      null,
      null,
      cameraIp,
      new Date().toISOString(),
      mac
    );

    const insertedData = db
      .prepare("SELECT * FROM sessions WHERE id = ?")
      .get(result.lastInsertRowid);
    const camera = await getCameraOperator(cameraIp);
    insertedData.operatorId = camera.operatorId;

    await getIO().emit("newSession", insertedData);
    await sendParkStats();
    console.log("=== before checkInternetConnection ===")
    // let checkInternet = true
    let checkInternet = await checkInternetConnection()
    // let checkInternet = await checkInternetConnectionWithFallback()
    console.log("=== checkInternetConnection = ", checkInternet)
    if (checkInternet) {
      console.log("=== after checkInternetConnection ===")
      insertedData.event = "input";
      await postInfo({
        type: "insert",
        data: insertedData,
        event: "input",
      });
    }

    return insertedData;
  } catch (error) {
    throw new Error(`Error in registerHourly: ${error.message}`);
  }
};

export { registerHourly };
