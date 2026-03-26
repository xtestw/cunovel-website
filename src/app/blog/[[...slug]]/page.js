import Blog from '@/screens/Blog/Blog';
import { getBlogStaticParams } from '@/lib/staticExportParams';

export async function generateStaticParams() {
  return getBlogStaticParams();
}

export default function Page() {
  return <Blog />;
}
