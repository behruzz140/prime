import db from "@/db/database.js";
import { getIO } from "@/utils/socket.js";
import { getCameraOperator } from "./camera.service.js";
import { postInfo } from "@/utils/postInfo.js";
import { checkInternetConnection } from "@/utils/checkInternet.js";
import { getSnapshotSession, getParkStats, sendParkStats } from "@/utils/sessionFunctions.js";
import { setInner } from "@/utils/plateFunctions.js";
import generateOfd from "../../utils/generateOfd.js";
import { uploadOldInfos } from "../../utils/postInfo.js";
import { sendSessions } from "../../utils/sessionFunctions.js";

const registerSession = async (req, res) => {
  try {
    console.log("=== registerSession ===")
    const { number, plateImage, fullImage, eventName, tariffType, paymentMethod, cameraIp } =
      req.body;

    if (!number) {
      return await getSnapshotSession(eventName, 5, paymentMethod, cameraIp, res);
    }

    const stmt = db.prepare(`
      INSERT INTO sessions
        (plateNumber, inputPlateImage, inputFullImage, startTime, tariffType, duration, inputCost, inputPaymentMethod,cameraIp,lastActivity)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      new Date().toISOString()
    );

    const insertedData = db
      .prepare("SELECT * FROM sessions WHERE id = ?")
      .get(result.lastInsertRowid);
    const camera = await getCameraOperator(cameraIp);
    insertedData.operatorId = camera.operatorId;

    await getIO().emit("newSession", insertedData);
    await sendParkStats();

    if (await checkInternetConnection()) {
      insertedData.event = "input";
      await postInfo({
        type: "insert",
        data: insertedData,
        event: "input",
      });
    }

    res.status(201).send(insertedData);
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
};

const outputSession = async (req, res) => {
  try {
    const { number, plateImage, fullImage, paymentMethod, outputCost, cameraIp, id } = req.body;

    if (!number) {
      const info = await closeSnapshotSession(
        id,
        plateImage,
        fullImage,
        paymentMethod,
        outputCost,
        cameraIp
      );

      await uploadOldInfos();

      return res.status(201).send(info);
    }

    const stmt = db.prepare(`
      UPDATE sessions
      SET outputPlateImage = ?,
          outputFullImage = ?,
          endTime = ?,
          duration = ?,
          outputCost = ?,
          outputPaymentMethod = ?,
          cameraIp = ?,
          isUpdated = 1
      WHERE id = ? AND endTime IS NULL
    `);

    const result = stmt.run(
      null,
      fullImage || null,
      new Date().toISOString(),
      null,
      outputCost,
      paymentMethod,
      cameraIp,
      id
    );

    let fullCheck = null;

    if (await checkInternetConnection()) {
      const { url, full } = await generateOfd(id, outputCost);

      fullCheck = full;

      db.prepare(
        `
      UPDATE sessions
      SET ofd_output = ?
      WHERE id = ?
    `
      ).run(url, id);
    }

    const insertedData = db.prepare("SELECT * FROM sessions WHERE id = ?").get(id);

    await setInner(id, 0, "id");

    insertedData.checkInfo = fullCheck;

    if (await checkInternetConnection()) {
      await sendSessions();
    }

    res.status(200).send(insertedData);
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
};

const outputSessionHandle = async ({
  number,
  plateImage,
  fullImage,
  paymentMethod,
  outputCost,
  cameraIp,
  id,
  mac,
}) => {
  try {
    const stmt = db.prepare(`
      UPDATE sessions
      SET outputPlateImage = ?,
          outputFullImage = ?,
          endTime = ?,
          duration = ?,
          outputCost = ?,
          outputPaymentMethod = ?,
          cameraIp = ?,
          mac = ?,
          isUpdated = 1
      WHERE id = ? AND endTime IS NULL
    `);

    const result = stmt.run(
      null,
      fullImage || null,
      new Date().toISOString(),
      null,
      outputCost,
      paymentMethod,
      cameraIp,
      mac,
      id
    );

    const insertedData = db.prepare("SELECT * FROM sessions WHERE id = ?").get(id);

    const camera = await getCameraOperator(cameraIp);
    insertedData.operatorId = camera.operatorId;

    await setInner(id, 0, "id");

    await sendParkStats();

    if (await checkInternetConnection()) {
      insertedData.event = "output";
      await postInfo({
        type: "insert",
        data: insertedData,
        event: "output",
      });
    }

    return insertedData;
  } catch (error) {
    console.log(error);
    throw new Error(error);
  }
};

const outputWithoutSessionHandle = async ({
  number,
  plateImage,
  fullImage,
  paymentMethod,
  outputCost,
  cameraIp,
  mac,
}) => {
  try {
    const stmt = db.prepare(`
      INSERT INTO sessions
       (outputPlateImage,outputFullImage,endTime,duration,outputCost,outputPaymentMethod,cameraIp,mac,plateNumber)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      null,
      fullImage || null,
      new Date().toISOString(),
      null,
      outputCost,
      paymentMethod,
      cameraIp,
      mac,
      number
    );

    const insertedData = db
      .prepare("SELECT * FROM sessions WHERE id = ?")
      .get(result.lastInsertRowid);

    const camera = await getCameraOperator(cameraIp);
    insertedData.operatorId = camera.operatorId;

    await setInner(result.lastInsertRowid, 0, "id");

    await sendParkStats();

    if (await checkInternetConnection()) {
      insertedData.event = "output";
      await postInfo({
        type: "insert",
        data: insertedData,
        event: "output",
      });
    }

    return insertedData;
  } catch (error) {
    console.log(error);
    throw new Error(error);
  }
};

const closeSnapshotSession = async (
  id,
  plateImage,
  fullImage,
  paymentMethod,
  outputCost,
  cameraIp
) => {
  try {
    const stmt = db.prepare(`
      UPDATE sessions
      SET outputPlateImage = ?,
          outputFullImage = ?,
          endTime = ?,
          duration = ?,
          outputCost = ?,
          outputPaymentMethod = ?,
          cameraIp = ?,
          isUpdated = 1
      WHERE id = ? AND endTime IS NULL
    `);

    const result = stmt.run(
      null,
      fullImage || null,
      new Date().toISOString(),
      null,
      outputCost,
      paymentMethod,
      cameraIp,
      id
    );

    let fullCheck = null;

    if (await checkInternetConnection()) {
      const { url, full } = await generateOfd(id, outputCost);

      fullCheck = full;

      db.prepare(
        `
      UPDATE sessions
      SET ofd_output = ?
      WHERE id = ?
    `
      ).run(url, id);
    }

    const insertedData = db.prepare("SELECT * FROM sessions WHERE id = ?").get(id);

    await setInner(id, 0, "id");

    insertedData.checkInfo = fullCheck;

    return insertedData;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

const getSessions = (req, res) => {
  const { page = 1, size = 10, search } = req.query;
  const offset = (page - 1) * size;

  let query = "SELECT * FROM sessions";
  let countQuery = "SELECT COUNT(*) as total FROM sessions";
  let params = [];

  if (search) {
    query += " WHERE LOWER(plateNumber) LIKE LOWER(?)";
    countQuery += " WHERE LOWER(plateNumber) LIKE LOWER(?)";
    params.push(`%${search}%`);
  }

  query += " ORDER BY startTime DESC LIMIT ? OFFSET ?";
  params.push(Number(size), offset);

  const data = db.prepare(query).all(...params);
  const total = db.prepare(countQuery).get(...params.slice(0, -2));

  res.status(200).send({
    data,
    total: total.total,
    page: Number(page),
    size: Number(size),
    totalPages: Math.ceil(total.total / size),
  });
};

const getSessionsInfo = async (req, res) => {
  try {
    const data = await getParkStats();
    res.status(200).send(data);
  } catch (error) {
    res.status(400).send(error);
  }
};

export {
  registerSession,
  getSessions,
  outputSession,
  getSessionsInfo,
  outputSessionHandle,
  outputWithoutSessionHandle,
};
