#!/usr/bin/env bash
# 在已 `cd` 到 Next 静态导出目录（如 out/）后执行。
# 先上传体积较大的 wasm，再全量同步，并对 UserNetworkTooSlow 等失败重试。
set -euo pipefail

retry_cmd() {
  local desc="$1"
  local max="$2"
  local sleep_s="$3"
  shift 3
  local n=0
  while [ "$n" -lt "$max" ]; do
    if "$@"; then
      return 0
    fi
    n=$((n + 1))
    if [ "$n" -lt "$max" ]; then
      echo "⚠️  ${desc} 失败 (${n}/${max})，${sleep_s}s 后重试…"
      sleep "$sleep_s"
    fi
  done
  echo "❌ ${desc} 在 ${max} 次尝试后仍失败"
  return 1
}

if [ -d "_next/static/wasm" ]; then
  echo "📤 优先上传 _next/static/wasm/（避免大文件在全量队列末尾触发 UserNetworkTooSlow）…"
  retry_cmd "wasm 目录上传" 4 60 coscmd upload -rs _next/static/wasm/ /_next/static/wasm/ --skipmd5
fi

echo "📤 全量同步到 COS 根路径…"
retry_cmd "全量同步" 6 60 coscmd upload -rs ./ / --skipmd5

echo "✅ COS 同步完成"
