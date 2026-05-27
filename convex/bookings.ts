import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const bookings = await ctx.db.query("bookings").order("desc").collect();

    return Promise.all(
      bookings.map(async (b) => {
        const slot = await ctx.db.get(b.slotId);
        return {
          _id: b._id,
          _creationTime: b._creationTime,
          name: b.name,
          email: b.email,
          partySize: b.partySize,
          status: b.status,
          date: slot?.date ?? "—",
          time: slot?.time ?? "—",
          tableId: slot?.tableId ?? 0,
        };
      })
    );
  },
});

export const updateStatus = mutation({
  args: {
    bookingId: v.id("bookings"),
    status: v.union(v.literal("confirmed"), v.literal("cancelled")),
  },
  handler: async (ctx, { bookingId, status }) => {
    const booking = await ctx.db.get(bookingId);
    if (!booking) throw new Error("Booking not found");

    await ctx.db.patch(bookingId, { status });

    if (status === "cancelled") {
      await ctx.db.patch(booking.slotId, { status: "open" });
    }
  },
});
