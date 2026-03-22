import AgentSkill from '@/screens/AgentSkill/AgentSkill';
import { getAgentSkillStaticParams } from '@/lib/staticExportParams';

export async function generateStaticParams() {
  return getAgentSkillStaticParams();
}

export default function Page() {
  return <AgentSkill />;
}
