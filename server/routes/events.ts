import { Router } from "express";
import { storage } from "../storage";
import { insertEventSchema } from "@shared/schema";
import { requireAuth, parseId } from "./helpers";

// ========================================
// Public Routes
// ========================================
export const publicEventsRouter = Router();

publicEventsRouter.get("/", async (req, res) => {
  try {
    const events = await storage.getEvents();
    const now = new Date();
    
    const visibleEvents = events.filter(event => {
      if (!event.active || !event.posterUrl) return false;
      
      if (event.visibilityMode === "ACTIVE_ONLY") {
        return true;
      }
      
      if (event.visibilityMode === "UNTIL_DAYS_AFTER" && event.startAt && event.visibilityDaysAfter) {
        const hideAfterDate = new Date(event.startAt);
        hideAfterDate.setDate(hideAfterDate.getDate() + event.visibilityDaysAfter);
        return now <= hideAfterDate;
      }
      
      return true;
    });
    
    visibleEvents.sort((a, b) => a.sortOrder - b.sortOrder);
    res.json(visibleEvents);
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({ error: "Failed to fetch events" });
  }
});

publicEventsRouter.get("/:id", async (req, res) => {
  try {
    const event = await storage.getEvent(parseId(req.params.id));
    if (!event || !event.active) {
      res.status(404).json({ error: "Event not found" });
      return;
    }
    res.json(event);
  } catch (error) {
    console.error("Error fetching event:", error);
    res.status(500).json({ error: "Failed to fetch event" });
  }
});

// ========================================
// Admin Routes
// ========================================
export const adminEventsRouter = Router();

adminEventsRouter.get("/", requireAuth, async (req, res) => {
  try {
    const events = await storage.getEvents();
    res.json(events);
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({ error: "Failed to fetch events" });
  }
});

adminEventsRouter.post("/", requireAuth, async (req, res) => {
  try {
    const body = { ...req.body };
    if (body.startAt && typeof body.startAt === 'string') {
      body.startAt = new Date(body.startAt);
    }
    const parsed = insertEventSchema.safeParse(body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid data", details: parsed.error.flatten() });
      return;
    }
    const event = await storage.createEvent(parsed.data);
    res.status(201).json(event);
  } catch (error) {
    console.error("Error creating event:", error);
    res.status(500).json({ error: "Failed to create event" });
  }
});

adminEventsRouter.patch("/:id", requireAuth, async (req, res) => {
  try {
    const body = { ...req.body };
    if (body.startAt && typeof body.startAt === 'string') {
      body.startAt = new Date(body.startAt);
    }
    const parsed = insertEventSchema.partial().safeParse(body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid data", details: parsed.error.flatten() });
      return;
    }
    const event = await storage.updateEvent(parseId(req.params.id), parsed.data);
    if (!event) {
      res.status(404).json({ error: "Event not found" });
      return;
    }
    res.json(event);
  } catch (error) {
    console.error("Error updating event:", error);
    res.status(500).json({ error: "Failed to update event" });
  }
});

adminEventsRouter.delete("/:id", requireAuth, async (req, res) => {
  try {
    const deleted = await storage.deleteEvent(parseId(req.params.id));
    if (!deleted) {
      res.status(404).json({ error: "Event not found" });
      return;
    }
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting event:", error);
    res.status(500).json({ error: "Failed to delete event" });
  }
});
