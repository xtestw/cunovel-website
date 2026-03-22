import AIDailyDetail from '@/screens/AIDaily/AIDailyDetail';
import { getAiDailyDateParams } from '@/lib/staticExportParams';

export async function generateStaticParams() {
  return getAiDailyDateParams();
}

export default function Page() {
  return <AIDailyDetail />;
}
