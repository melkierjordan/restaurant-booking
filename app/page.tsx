"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Fragment, useEffect, useState } from "react";

const TIME_SLOTS = ["12:00", "13:00", "14:00", "18:00", "19:00", "20:00"];

type SelectedSlot = { date: string; time: string };
type BookingResult = {
  date: string;
  time: string;
  name: string;
  email: string;
  partySize?: number;
  tableId: number;
};

type View =
  | { kind: "grid" }
  | { kind: "form"; slot: SelectedSlot }
  | { kind: "confirmation"; booking: BookingResult };

export default function Home() {
  const slots = useQuery(api.slots.getSlots);
  const seed = useMutation(api.slots.seedSlots);
  const [view, setView] = useState<View>({ kind: "grid" });

  useEffect(() => {
    seed();
  }, [seed]);

  if (!slots) {
    return <p className="p-8 text-center text-gray-500">Loading…</p>;
  }
  if (slots.length === 0) {
    return <p className="p-8 text-center text-gray-500">Seeding slots…</p>;
  }

  if (view.kind === "form") {
    return (
      <BookingForm
        slot={view.slot}
        onBack={() => setView({ kind: "grid" })}
        onBooked={(booking) => setView({ kind: "confirmation", booking })}
      />
    );
  }

  if (view.kind === "confirmation") {
    return (
      <Confirmation
        booking={view.booking}
        onBack={() => setView({ kind: "grid" })}
      />
    );
  }

  return (
    <AvailabilityGrid
      slots={slots}
      onSlotClick={(slot) => setView({ kind: "form", slot })}
    />
  );
}

function AvailabilityGrid({
  slots,
  onSlotClick,
}: {
  slots: { date: string; time: string; status: string }[];
  onSlotClick: (slot: SelectedSlot) => void;
}) {
  const dates = [...new Set(slots.map((s) => s.date))].sort();

  const availability = new Map<string, number>();
  for (const s of slots) {
    const key = `${s.date}|${s.time}`;
    availability.set(key, (availability.get(key) ?? 0) + (s.status === "open" ? 1 : 0));
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Restaurant Booking</h1>

      <div className="grid grid-cols-[auto_repeat(7,1fr)] gap-2">
        <div />
        {dates.map((date) => (
          <div key={date} className="text-center text-xs font-semibold pb-2">
            {formatDate(date)}
          </div>
        ))}

        {TIME_SLOTS.map((time) => (
          <Fragment key={time}>
            <div className="text-sm font-medium pr-3 flex items-center justify-end">
              {time}
            </div>
            {dates.map((date) => {
              const key = `${date}|${time}`;
              const open = availability.get(key) ?? 0;
              const isOpen = open > 0;
              return (
                <button
                  key={key}
                  disabled={!isOpen}
                  onClick={() => onSlotClick({ date, time })}
                  className={`rounded-lg py-2 px-1 text-xs font-medium transition-colors ${
                    isOpen
                      ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 cursor-pointer"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  {isOpen ? `${open} open` : "Full"}
                </button>
              );
            })}
          </Fragment>
        ))}
      </div>
    </main>
  );
}

function BookingForm({
  slot,
  onBack,
  onBooked,
}: {
  slot: SelectedSlot;
  onBack: () => void;
  onBooked: (booking: BookingResult) => void;
}) {
  const createBooking = useMutation(api.slots.createBooking);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [partySize, setPartySize] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const result = await createBooking({
        date: slot.date,
        time: slot.time,
        name,
        email,
        partySize: partySize ? Number(partySize) : undefined,
      });
      onBooked(result);
    } catch {
      setError("This slot was just taken. Please go back and pick another.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="max-w-md mx-auto px-4 py-8">
      <button
        onClick={onBack}
        className="text-sm text-gray-500 hover:text-gray-800 mb-4 cursor-pointer"
      >
        &larr; Back to grid
      </button>

      <h1 className="text-2xl font-bold mb-1">Book a Table</h1>
      <p className="text-gray-500 mb-6">
        {formatDate(slot.date)} at {slot.time}
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1">
            Name
          </label>
          <input
            id="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div>
          <label htmlFor="partySize" className="block text-sm font-medium mb-1">
            Party size <span className="text-gray-400">(optional)</span>
          </label>
          <input
            id="partySize"
            type="number"
            min={1}
            max={10}
            value={partySize}
            onChange={(e) => setPartySize(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50 cursor-pointer"
        >
          {submitting ? "Booking…" : "Confirm Booking"}
        </button>
      </form>
    </main>
  );
}

function Confirmation({
  booking,
  onBack,
}: {
  booking: BookingResult;
  onBack: () => void;
}) {
  return (
    <main className="max-w-md mx-auto px-4 py-8 text-center">
      <div className="mb-6 text-emerald-600 text-5xl">&#10003;</div>
      <h1 className="text-2xl font-bold mb-2">Booking Confirmed!</h1>
      <p className="text-gray-500 mb-6">
        Your reservation is pending confirmation.
      </p>

      <div className="bg-gray-50 rounded-lg p-4 text-left text-sm space-y-2 mb-6">
        <div className="flex justify-between">
          <span className="text-gray-500">Name</span>
          <span className="font-medium">{booking.name}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Email</span>
          <span className="font-medium">{booking.email}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Date</span>
          <span className="font-medium">{formatDate(booking.date)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Time</span>
          <span className="font-medium">{booking.time}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Table</span>
          <span className="font-medium">#{booking.tableId}</span>
        </div>
        {booking.partySize && (
          <div className="flex justify-between">
            <span className="text-gray-500">Party size</span>
            <span className="font-medium">{booking.partySize}</span>
          </div>
        )}
      </div>

      <button
        onClick={onBack}
        className="rounded-lg bg-gray-900 px-6 py-2 text-sm font-medium text-white hover:bg-gray-800 cursor-pointer"
      >
        Back to Grid
      </button>
    </main>
  );
}

function formatDate(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}
