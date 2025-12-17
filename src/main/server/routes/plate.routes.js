import { Router } from "express";
import { inputCar, outputCar, outputCarById,printOrder } from "../services/plate.service.js";

const router = Router();

router.post("/input", inputCar);

router.post("/output", outputCar);

router.get("/output/:id", outputCarById);

router.post("/open", printOrder);

export default router;
