import ClaudeTutorial from '@/screens/ClaudeTutorial/ClaudeTutorial';
import { getClaudeTutorialStaticParams } from '@/lib/staticExportParams';

export async function generateStaticParams() {
  return getClaudeTutorialStaticParams();
}

export default function Page() {
  return <ClaudeTutorial />;
}
