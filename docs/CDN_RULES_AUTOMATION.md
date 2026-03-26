# CDN 回源重写规则自动化

本仓库提供 `workflow_dispatch` 工作流，用于将「无后缀页面路径 -> .html 回源路径」规则批量同步到腾讯云 CDN（`Origin.PathRules`）。

## 文件

- `.github/workflows/apply-cdn-origin-rules.yml`
- `scripts/apply_cdn_origin_path_rules.py`
- `config/cdn/origin-path-rules.json`

## 使用方式

1. 在 GitHub 仓库配置 Secrets：
   - `TENCENT_SECRET_ID`
   - `TENCENT_SECRET_KEY`
2. 打开 Actions -> `Apply Tencent CDN Origin Rules`。
3. 先运行 `mode=plan` 检查变更。
4. 确认无误后运行 `mode=apply`。

## 规则维护

编辑 `config/cdn/origin-path-rules.json` 即可。

- `Path`: 待重写回源 URL（支持 `*`）
- `ForwardUri`: 目标回源 Path（必须 `/` 开头，可用 `$1`..`$5`）
- `Regex`: 是否开启通配符匹配
- `FullMatch`: 是否全路径匹配

## 注意

- 不要对 `/_next/static/*` 配置 `.html` 回源规则。
- `apply` 后请刷新 CDN 缓存（至少 `/tools/*`、`/prompt-tutorial/*`、`/agent-skill/*`、`/ai-daily/*`）。
- 脚本会保留未被本配置覆盖（Path 不同）的已有 PathRules。
