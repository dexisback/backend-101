import express from "express";
import type { Request, Response } from "express";
import { getEventById, listEvents } from "../services/event.service.js";

const router = express.Router();

/**
 * GET /status/event/:eventId
 * Query the status of a webhook event by eventId
 */
router.get("/event/:eventId", async (req: Request, res: Response) => {
  try {
    const eventId = Array.isArray(req.params.eventId) ? req.params.eventId[0] : req.params.eventId;
    
    if (!eventId) {
      return res.status(400).json({ error: "missing eventId" });
    }

    const event = await getEventById(eventId);
    
    if (!event) {
      return res.status(404).json({ error: "event not found" });
    }

    res.status(200).json({
      eventId: event.eventId,
      provider: event.provider,
      type: event.type,
      status: event.status,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
      alertCount: event.alerts?.length || 0,
      alerts: event.alerts || []
    });
  } catch (err) {
    console.error("Error fetching event", err);
    res.status(500).json({ error: "internal server error" });
  }
});

/**
 * GET /status/events
 * List recent webhook events, optionally filtered by provider
 */
router.get("/events", async (req: Request, res: Response) => {
  try {
    const provider = Array.isArray(req.query.provider) ? req.query.provider[0] : req.query.provider;
    const limit = Array.isArray(req.query.limit) ? req.query.limit[0] : req.query.limit;
    const limitNum = limit ? Math.min(parseInt(limit as string), 1000) : 100;
    
    const events = await listEvents(provider as string | undefined, limitNum);

    res.status(200).json({
      count: events.length,
      events: events.map(e => ({
        eventId: e.eventId,
        provider: e.provider,
        type: e.type,
        status: e.status,
        createdAt: e.createdAt
      }))
    });
  } catch (err) {
    console.error("Error listing events", err);
    res.status(500).json({ error: "internal server error" });
  }
});

export default router;
