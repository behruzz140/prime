import { getIO } from "@/utils/socket";
import { getCamera, getCameraOperator } from "./camera.service.js";
import { tariffs } from "@/config";
import { isEnoughTime, isInner } from "@/utils/plateFunctions.js";
import { getSnapshot } from "@/utils/getSnapshot.js";
import { getLastSession, getLastSessionUniversal } from "@/utils/calculatePrice.js";
import { registerHourly } from "../../utils/perHourFunctions.js";
import { calculateParkingCostHour } from "../../utils/calculatePerHour.js";
import { getLastSessions } from "../../utils/calculatePrice.js";
import { outputSessionHandle, outputWithoutSessionHandle } from "./sessions.service.js";
import db from "../../db/database.js";
import axios from "axios";
import { checkInternetConnection } from "../../utils/checkInternet.js";
import generateOfd from "../../utils/generateOfd.js";

const inputCar = async (req, res) => {
  try {
    if (!req.body) {
      res.status(400).send("No body in request");
      throw new Error("No body in request");
    }

    const operator = await getCameraOperator(req.headers.host);

    const camera = await getCamera(req.headers.host);

    if (!operator) return res.status(200).send("Operator not found");

    const { fullImage, plateImage, number } = req.body;

    const base64Clean = fullImage.replace(/^data:image\/\w+;base64,/, "");

    if (number.length < 8) {
      return res.status(200).send("number not valid");
    }

    const check = await isEnoughTime(number, "number");

    if (!check) {
      return res.status(200).send("Not 30 sec yet");
    }

    const isInnerCheck = await isInner(number, "number");

    if (isInnerCheck) {
      db.prepare(
        `
        DELETE FROM sessions WHERE id = ?`
      ).run(isInnerCheck.id);
    }

    const data = await registerHourly({
      cameraIp: req.headers.host,
      mac: camera.mac,
      fullImage: base64Clean,
      plateImage: plateImage,
      number: number,
      tariffType: 5,
    });

    res.status(200).send(data);
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
};

const outputCar = async (req, res) => {
  try {
    if (!req.body) {
      res.status(400).send("No body in request");
      throw new Error("No body in request");
    }

    const { fullImage, plateImage, number } = req.body;

    const base64Clean = fullImage.replace(/^data:image\/\w+;base64,/, "");

    const check = await isEnoughTime(number, "number");

    if (!check) {
      return res.status(200).send("Not 30 sec yet");
    }

    if (number.length < 8) {
      return res.status(200).send("number not valid");
    }

    const operator = await getCameraOperator(req.headers.host);

    if (!operator) return res.status(200).send("Operator not found");

    const mac_address = db.prepare("SELECT mac FROM config ORDER BY id ASC").get().mac;

    const camera = await getCamera(req.headers.host);

    const session = await getLastSessionUniversal(number, "number");

    console.log(session, "OUTPUT CARRR");

    if (JSON.stringify(session) > 10) {
      const cost = null;
      console.log(session, "OUTPUT CARRR SESSION");

      const insertedData = await outputSessionHandle({
        number,
        plateImage,
        fullImage: base64Clean,
        cameraIp: req.headers.host,
        operatorId: operator.operatorId,
        session,
        eventName: "output",
        id: session.id,
        outputCost: cost,
        paymentMethod: 1,
        mac: camera.mac,
      });

      const { data } = await axios.get(
        `https://raqamli-bozor.uz/services/platon-core/api/v1/desktop/pms/car/sum?mac_address=${mac_address}&car_number=${number}`,
        {
          headers: {
            Authorization: "Basic cG1zXzMwNjU3Njg1MzphM2YxYzhkOTJiN2U0ZjY1",
          },
        }
      );

      session.price = data.data.sum;
      insertedData.price = data.data.sum;
      insertedData.startTime = data.data.enter_time;
      session.startTime = data.data.enter_time;

      getIO().emit(`outputCar-1`, {
        number,
        plateImage,
        fullImage: base64Clean,
        price: cost,
        cameraIp: req.headers.host,
        operatorId: operator.operatorId,
        session,
        eventName: "output",
        mac: camera.mac,
        insertedData: insertedData,
      });

      res.status(200).send({
        number,
        plateImage,
        fullImage: base64Clean,
        price: data.data.sum,
        cameraIp: req.headers.host,
        operatorId: operator.operatorId,
        session,
        eventName: "output",
      });
    } else {
      const cost = null;

      console.log(session, "OUTPUT CARRR SESSION WITHOUT");

      const insertedData = await outputWithoutSessionHandle({
        number,
        plateImage,
        fullImage: base64Clean,
        cameraIp: req.headers.host,
        operatorId: operator.operatorId,
        session,
        eventName: "output",
        outputCost: cost,
        paymentMethod: 1,
        mac: camera.mac,
      });

      const newSession = await getLastSession(number, "number");

      const { data } = await axios.get(
        `https://raqamli-bozor.uz/services/platon-core/api/v1/desktop/pms/car/sum?mac_address=${mac_address}&car_number=${number}`,
        {
          headers: {
            Authorization: "Basic cG1zXzMwNjU3Njg1MzphM2YxYzhkOTJiN2U0ZjY1",
          },
        }
      );

      newSession.price = data.data.sum;
      insertedData.price = data.data.sum;
      insertedData.startTime = data.data.enter_time;
      newSession.startTime = data.data.enter_time;

      getIO().emit(`outputCar-1`, {
        number,
        plateImage,
        fullImage: base64Clean,
        price: cost,
        cameraIp: req.headers.host,
        operatorId: operator.operatorId,
        session: newSession,
        eventName: "output",
        mac: camera.mac,
        insertedData: insertedData,
      });

      res.status(200).send({
        number,
        plateImage,
        fullImage: base64Clean,
        price: data.data.sum,
        cameraIp: req.headers.host,
        operatorId: operator.operatorId,
        session: newSession,
        eventName: "output",
      });
    }
  } catch (error) {
    console.log(error);

    res.status(400).send(error);
  }
};

const outputCarById = async (req, res) => {
  try {
    if (!req.body) {
      res.status(400).send("No body in request");
      throw new Error("No body in request");
    }

    const { cameraIp } = req.query;

    const { id } = req.params;

    let tempItem = null;
    let tempArray = [];

    tempItem = (await getLastSessions(id, "number")) || [];

    const operator = await getCameraOperator(cameraIp);

    if (tempItem) {
      for (let i = 0; i < tempItem.length; i++) {
        const check = await isEnoughTime(tempItem[i].id, "id");

        if (!check) {
          return res.status(200).send("Not 30 sec yet");
        }

        if (!operator) return res.status(200).send("Operator not found");

        const snapImage = await getSnapshot(cameraIp, operator.login, operator.password);

        const session = await getLastSessionUniversal(tempItem[i].id, "id");

        const cost = await calculateParkingCostHour(
          session.startTime,
          tariffs.find((item) => item.id == session.tariffType).pricePerDay
        );

        tempArray.push({
          number: null,
          plateImage: null,
          fullImage: snapImage,
          price: cost,
          cameraIp: cameraIp,
          operatorId: operator.operatorId,
          session,
          eventName: "output",
        });
      }
    }
    if (Number(id)) {
      const check = await isEnoughTime(id, "id");

      if (!check) {
        return res.status(200).send("Not 30 sec yet");
      }

      if (!operator) return res.status(200).send("Operator not found");

      const snapImage = await getSnapshot(cameraIp, operator.login, operator.password);

      const session = await getLastSessionUniversal(id, "id");

      if (session) {
        const cost = await calculateParkingCostHour(
          session.startTime,
          tariffs.find((item) => item.id == session.tariffType).pricePerDay
        );

        tempArray.push({
          number: null,
          plateImage: null,
          fullImage: snapImage,
          price: cost,
          cameraIp: cameraIp,
          operatorId: operator.operatorId,
          session,
          eventName: "output",
        });
      }
    }

    getIO().emit(`outputCar-1`, tempArray);

    res.status(200).send(tempArray);
  } catch (error) {
    res.status(400).send(error);
  }
};

const printOrder = async (req, res) => {
  try {
    const { insertedData } = req.body;

    const mac_address = db.prepare("SELECT mac FROM config ORDER BY id ASC").get().mac;

    if ((await checkInternetConnection()) && insertedData.price > 0) {
      insertedData.event = "output";
      const data = await generateOfd(mac_address, insertedData.price, insertedData.number);
      insertedData.checkInfo = data.data;

      await getIO().emit("printEvent", insertedData);
    }

    res.status(200).send(insertedData);
  } catch (error) {
    console.log(error, "XATOLIKKKKK");
    res.status(400).send(error);
  }
};
export { inputCar, outputCar, outputCarById, printOrder };
