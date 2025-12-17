import { Router } from "express";
import {
  deleteOperators,
  getOperators,
  postOperators,
  getMac,
  putMac,
  putOperators,
  putMarket,
  putPrinter,
} from "../services/operator.service.js";

const router = Router();

router.get("/operator", getOperators);

router.post("/operator", postOperators);

router.put("/operator/:id", putOperators);

router.get("/mac", getMac);

router.put("/mac", putMac);

router.put("/printer", putPrinter);

router.put("/market", putMarket);

router.delete("/operator/:id", deleteOperators);

export default router;
