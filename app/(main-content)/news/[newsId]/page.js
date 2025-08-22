import { getAllNews } from '@/actions/news-actions/newsAction';
import NewsDetailsClient from '@/components/news/news-details-client/NewsDetailsClient';

export async function generateStaticParams() {
  const newsItems = await getAllNews();

  return newsItems.map((news) => ({
    newsId: String(news.id),
  }));
}

export default async function NewsDetailsPage({ params }) {
  const newsId = params?.newsId;
  return <NewsDetailsClient newsId={newsId} />;
}
