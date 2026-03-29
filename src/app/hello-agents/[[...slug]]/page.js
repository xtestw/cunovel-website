import HelloAgents from '@/screens/HelloAgents/HelloAgents';
import { getHelloAgentsStaticParams } from '@/lib/staticExportParams';

export async function generateStaticParams() {
  return getHelloAgentsStaticParams();
}

export default function Page() {
  return <HelloAgents />;
}
