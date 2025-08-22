import { fetchHorseById, getHorses } from '@/actions/horse-action/horseAction';
import HorseDetailsClient from '@/components/horses/horse-details-cilent/horseDetailsClient';

export async function generateStaticParams() {
  const horses = await getHorses();

  return horses
    .filter((horse) => typeof horse.id !== 'undefined' && horse.id !== null)
    .map((horse) => ({
      horseId: String(horse.id),
    }));
}

export default async function HorseDetailsPage({ params }) {
  const { horseId } = params;

  // Fetch horse details by ID
  const horse = await fetchHorseById(horseId);

  if (!horse) {
    return <div>Horse not found</div>;
  }

  return <HorseDetailsClient horse={horse} />;
}
