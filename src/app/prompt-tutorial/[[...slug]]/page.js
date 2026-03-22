import PromptTutorial from '@/screens/PromptTutorial/PromptTutorial';
import { getPromptTutorialStaticParams } from '@/lib/staticExportParams';

export async function generateStaticParams() {
  return getPromptTutorialStaticParams();
}

export default function Page() {
  return <PromptTutorial />;
}
