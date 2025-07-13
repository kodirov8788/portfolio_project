import { createClient } from "@/lib/supabase/server";

export default async function AdminAnalyticsPage() {
  const supabase = await createClient();
  const { data: events, error } = await supabase
    .from("analytics_events")
    .select("id, event_type, entity_type, entity_id, user_id, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("Error fetching analytics events:", error);
  }

  // Process events for display
  const processedEvents =
    events?.map(
      (event: {
        id: string;
        event_type: string;
        entity_type: string;
        entity_id: string;
        user_id: string;
        created_at: string;
      }) => ({
        id: event.id,
        type: event.event_type,
        entity: `${event.entity_type}:${event.entity_id}`,
        userId: event.user_id,
        date: new Date(event.created_at).toLocaleDateString(),
      })
    ) || [];

  return (
    <main className="max-w-4xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-6">Analytics Events</h1>
      {error && <div className="text-red-500 mb-4">{error.message}</div>}
      <div className="overflow-x-auto">
        <table className="min-w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-4 py-2 text-left">Event Type</th>
              <th className="px-4 py-2 text-left">Entity Type</th>
              <th className="px-4 py-2 text-left">Entity ID</th>
              <th className="px-4 py-2 text-left">User ID</th>
              <th className="px-4 py-2 text-left">Created At</th>
            </tr>
          </thead>
          <tbody>
            {processedEvents && processedEvents.length > 0 ? (
              processedEvents.map((event) => (
                <tr key={event.id} className="border-t">
                  <td className="px-4 py-2">{event.type}</td>
                  <td className="px-4 py-2">{event.entity}</td>
                  <td className="px-4 py-2">{event.userId || "-"}</td>
                  <td className="px-4 py-2">{event.date}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                  No analytics events found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
