import { fetchHorseById, getHorses } from '@/actions/horse-action/horseAction';
import HorseDetailsClient from '@/components/horses/horse-details-cilent/horseDetailsClient';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic'; // IMPORTANT FIX

// Generate static params safely
export async function generateStaticParams() {
  try {
    const horses = await getHorses();

    return horses
      .filter((horse) => horse?.id)
      .map((horse) => ({
        horseId: String(horse.id),
      }));
  } catch (error) {
    console.error('generateStaticParams error:', error);
    return []; // NEVER break build
  }
}

export default async function HorseDetailsPage({ params }) {
  const { horseId } = params;

  const horse = await fetchHorseById(horseId);

  if (!horse) {
    return notFound(); // proper Next.js 404 page
  }

  return <HorseDetailsClient horse={horse} />;
}
