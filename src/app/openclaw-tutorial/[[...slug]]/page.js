import OpenClawTutorial from '@/screens/OpenClawTutorial/OpenClawTutorial';
import { getOpenclawTutorialStaticParams } from '@/lib/staticExportParams';

export async function generateStaticParams() {
  return getOpenclawTutorialStaticParams();
}

export default function Page() {
  return <OpenClawTutorial />;
}
