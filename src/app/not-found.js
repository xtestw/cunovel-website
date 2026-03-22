import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
      <h1>404</h1>
      <p>页面不存在</p>
      <Link href="/">返回首页</Link>
    </div>
  );
}
