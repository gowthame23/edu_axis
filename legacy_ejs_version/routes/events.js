const express = require("express");
const router = express.Router();
const Event = require("../models/events");
const thisGuy = require("../middleware/authentications"); // add guards

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

// Route to get all events (only today and future, soonest first)
router.get("/events", async (req, res) => {
  try {
    const events = await Event.find({ eventDate: { $gte: startOfToday() } }).sort({
      eventDate: 1,
    });
    res.status(200).json(events);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Route to get a specific event by ID
router.get("/events/:id", async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (event) {
      res.status(200).json(event);
    } else {
      res.status(404).json({ message: "Event not found" });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Route to insert one event (admin only; date must be today/future)
router.post(
  "/events",
  thisGuy.hasAccess,
  thisGuy.isAdmin,
  async (req, res) => {
    function getCurrentDate() {
      const months = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];
      const today = new Date();
      const day = String(today.getDate()).padStart(2, "0");
      const month = months[today.getMonth()];
      const year = today.getFullYear();
      return `${day}, ${month}, ${year}`;
    }

    // Validate title is not only numbers (allow letters or alphanumeric)
    const rawTitle = (req.body.title || '').trim();
    const titleNoSpaces = rawTitle.replace(/\s+/g, '');
    if (!rawTitle || /^\d+$/.test(titleNoSpaces)) {
      return res.status(400).json({ message: "Event title cannot be only numbers" });
    }

    const eventDate = new Date(req.body.eventDate);
    if (isNaN(eventDate.getTime())) {
      return res.status(400).json({ message: "Invalid eventDate" });
    }
    const eventDay = new Date(eventDate);
    eventDay.setHours(0, 0, 0, 0);
    if (eventDay < startOfToday()) {
      return res.status(400).json({
        message: "Event date must be today or a future date",
      });
    }

    const event = new Event({
      author: req.user.username,
      published: getCurrentDate(),
      title: rawTitle,
      description: req.body.description,
      eventDate: eventDate,
    });

    try {
      const saved = await event.save();
      return res.status(201).json({ message: "Event created", event: saved });
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }
  }
);

// Route to delete one event by ID (admin only)
router.post(
  "/events/delete/:id",
  thisGuy.hasAccess,
  thisGuy.isAdmin,
  async (req, res) => {
    try {
      const event = await Event.findByIdAndDelete(req.params.id);
      if (event) {
        return res.status(200).json({ message: "Event deleted" });
      } else {
        return res.status(404).json({ message: "Event not found" });
      }
    } catch (err) {
      if (err && err.kind === "ObjectId") {
        return res.status(400).json({ message: "Invalid Event ID" });
      }
      return res.status(500).json({ message: err?.message || 'Server error' });
    }
  }
);

// Route to update an event (admin only; validate date if provided)
router.patch(
  "/events/:id",
  thisGuy.hasAccess,
  thisGuy.isAdmin,
  async (req, res) => {
    try {
      const event = await Event.findById(req.params.id);
      if (!event) return res.status(404).json({ message: "Event not found" });

      if (req.body.title != null) event.title = req.body.title;
      if (req.body.published != null) event.published = req.body.published;
      if (req.body.description != null) event.description = req.body.description;
      if (req.body.eventDate != null) {
        const d = new Date(req.body.eventDate);
        if (isNaN(d.getTime()))
          return res.status(400).json({ message: "Invalid eventDate" });
        const day = new Date(d);
        day.setHours(0, 0, 0, 0);
        if (day < startOfToday()) {
          return res.status(400).json({
            message: "Event date must be today or a future date",
          });
        }
        event.eventDate = d;
      }

      const updatedEvent = await event.save();
      res.status(200).json(updatedEvent);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }
);

module.exports = router;
