import dynamic from 'next/dynamic';
import { getToolsStaticParams } from '@/lib/staticExportParams';

/** 工具链里有 react-json-view 等在 import 阶段访问 document；静态预渲染时禁用 SSR，仅客户端挂载 */
const Tools = dynamic(() => import('@/screens/Tools'), {
  ssr: false,
  loading: () => (
    <div style={{ padding: 24, textAlign: 'center', color: '#666' }}>加载工具中…</div>
  ),
});

export async function generateStaticParams() {
  return getToolsStaticParams();
}

export default function ToolsPage() {
  return <Tools />;
}
