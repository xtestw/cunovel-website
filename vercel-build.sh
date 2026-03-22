#!/usr/bin/env bash
# 若在 Vercel「Build Command」里填 ./vercel-build.sh，会用此脚本；默认用 vercel.json / 面板配置即可。
set -euo pipefail
npm ci
npm run build
