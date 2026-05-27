import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

const TIME_SLOTS = ["12:00", "13:00", "14:00", "18:00", "19:00", "20:00"];
const TABLES = [1, 2, 3, 4];

export const getSlots = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("slots").collect();
  },
});

export const createBooking = mutation({
  args: {
    date: v.string(),
    time: v.string(),
    name: v.string(),
    email: v.string(),
    partySize: v.optional(v.number()),
  },
  handler: async (ctx, { date, time, name, email, partySize }) => {
    const openSlot = await ctx.db
      .query("slots")
      .withIndex("by_date", (q) => q.eq("date", date))
      .filter((q) =>
        q.and(q.eq(q.field("time"), time), q.eq(q.field("status"), "open"))
      )
      .first();
    if (!openSlot) throw new Error("No open tables for this slot");

    await ctx.db.patch(openSlot._id, { status: "booked" });

    const bookingId = await ctx.db.insert("bookings", {
      slotId: openSlot._id,
      name,
      email,
      partySize,
      status: "pending",
    });

    return { bookingId, date, time, name, email, partySize, tableId: openSlot.tableId };
  },
});

export const seedSlots = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("slots").first();
    if (existing) return;

    const today = new Date();
    for (let d = 0; d < 7; d++) {
      const date = new Date(today);
      date.setDate(today.getDate() + d);
      const dateStr = date.toISOString().split("T")[0];
      for (const time of TIME_SLOTS) {
        for (const tableId of TABLES) {
          await ctx.db.insert("slots", {
            date: dateStr,
            time,
            tableId,
            status: "open",
          });
        }
      }
    }
  },
});
