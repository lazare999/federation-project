import { getEvents } from '@/actions/event-actions/eventActions';
import EventDetailsClient from '@/components/event/event-details/event-details-client/eventDetailsClient';

// ✅ Required when using `output: export`
export async function generateStaticParams() {
  const events = await getEvents();

  return events.map((event) => ({
    eventId: String(event.id),
  }));
}

export default function EventDetailsPage({ params }) {
  const { eventId } = params;

  return <EventDetailsClient eventId={eventId} />;
}
