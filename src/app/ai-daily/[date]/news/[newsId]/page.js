import NewsDetail from '@/screens/AIDaily/NewsDetail';
import { getAiDailyNewsParams } from '@/lib/staticExportParams';

export async function generateStaticParams() {
  return getAiDailyNewsParams();
}

export default function Page() {
  return <NewsDetail />;
}
