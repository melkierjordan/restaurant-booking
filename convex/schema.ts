import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  slots: defineTable({
    date: v.string(),
    time: v.string(),
    tableId: v.number(),
    status: v.union(v.literal("open"), v.literal("booked")),
  }).index("by_date", ["date"]),

  bookings: defineTable({
    slotId: v.id("slots"),
    name: v.string(),
    email: v.string(),
    partySize: v.optional(v.number()),
    status: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("cancelled")
    ),
  }).index("by_status", ["status"]),
});
