import EventDetailsClient from '@/components/event/event-details/event-details-client/eventDetailsClient';

export const dynamic = 'force-dynamic';

export default async function EventDetailsPage({ params }) {
  const { eventId } = await params;

  return <EventDetailsClient eventId={eventId} />;
}
