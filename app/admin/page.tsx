"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-red-100 text-red-800",
};

export default function AdminPage() {
  const bookings = useQuery(api.bookings.list);
  const updateStatus = useMutation(api.bookings.updateStatus);

  if (!bookings) {
    return <p className="p-8 text-center text-gray-500">Loading…</p>;
  }

  function handle(bookingId: Id<"bookings">, status: "confirmed" | "cancelled") {
    updateStatus({ bookingId, status });
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Admin Queue</h1>

      {bookings.length === 0 ? (
        <p className="text-gray-500">No bookings yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="border-b border-gray-200 text-gray-500">
              <tr>
                <th className="py-2 pr-4 font-medium">Slot</th>
                <th className="py-2 pr-4 font-medium">Customer</th>
                <th className="py-2 pr-4 font-medium">Party</th>
                <th className="py-2 pr-4 font-medium">Status</th>
                <th className="py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {bookings.map((b) => (
                <tr key={b._id}>
                  <td className="py-3 pr-4">
                    <div className="font-medium">{formatDate(b.date)}</div>
                    <div className="text-gray-500">
                      {b.time} &middot; Table #{b.tableId}
                    </div>
                  </td>
                  <td className="py-3 pr-4">
                    <div className="font-medium">{b.name}</div>
                    <div className="text-gray-500">{b.email}</div>
                  </td>
                  <td className="py-3 pr-4">{b.partySize ?? "—"}</td>
                  <td className="py-3 pr-4">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[b.status]}`}
                    >
                      {b.status}
                    </span>
                  </td>
                  <td className="py-3 space-x-2">
                    <button
                      disabled={b.status === "confirmed"}
                      onClick={() => handle(b._id, "confirmed")}
                      className="rounded bg-emerald-600 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                    >
                      Confirm
                    </button>
                    <button
                      disabled={b.status === "cancelled"}
                      onClick={() => handle(b._id, "cancelled")}
                      className="rounded bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                    >
                      Cancel
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
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
