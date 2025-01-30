import { Router } from "express";
import { generateNewShortURL, handleGetAnalytics, shortURL } from "../controllers/url.controller.js";

const router_url = Router();

router_url.post("/", generateNewShortURL)
router_url.get("/:shortId", shortURL)
router_url.get('/analytics/:shortId', handleGetAnalytics)
export default router_url;