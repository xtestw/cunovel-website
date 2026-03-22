/** AI 日报详情走查询参数，静态导出只需生成 /ai-daily/day、/ai-daily/article 两个页面，无需按每条记录预渲染 */

export function aiDailyDayHref(date) {
  return `/ai-daily/day?date=${encodeURIComponent(String(date))}`;
}

export function aiDailyArticleHref(date, newsId) {
  const d = encodeURIComponent(String(date));
  const n = encodeURIComponent(String(newsId));
  return `/ai-daily/article?date=${d}&newsId=${n}`;
}

export function aiDailyDayCanonical(origin, date) {
  return `${origin.replace(/\/$/, '')}/ai-daily/day?date=${encodeURIComponent(String(date))}`;
}

export function aiDailyArticleCanonical(origin, date, newsId) {
  const base = origin.replace(/\/$/, '');
  const d = encodeURIComponent(String(date));
  const n = encodeURIComponent(String(newsId));
  return `${base}/ai-daily/article?date=${d}&newsId=${n}`;
}
