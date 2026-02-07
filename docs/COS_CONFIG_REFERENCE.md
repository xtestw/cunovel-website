# COS 配置信息参考

## 当前配置

- **存储桶名称**: `cutool-1254002056`
- **地域**: `广州` (`ap-guangzhou`)
- **存储桶地址**: `cutool-1254002056.cos.ap-guangzhou.myqcloud.com`
- **静态网站地址**: `https://cutool-1254002056.cos-website.ap-guangzhou.myqcloud.com`

## GitHub Secrets 配置值

在 GitHub 仓库的 Settings > Secrets and variables > Actions 中配置：

```
TENCENT_SECRET_ID = <你的SecretId>
TENCENT_SECRET_KEY = <你的SecretKey>
COS_BUCKET_NAME = cutool-1254002056
COS_REGION = ap-guangzhou
```

## 本地 coscmd 配置

```bash
coscmd config -a <你的SecretId> -s <你的SecretKey> -b cutool-1254002056 -r ap-guangzhou
```

## CDN 配置

- **加速域名**: `cutool.online`
- **源站类型**: COS 源
- **源站地址**: `cutool-1254002056.cos.ap-guangzhou.myqcloud.com`
- **回源协议**: HTTPS

## 快速命令

### 测试 COS 直接访问
```bash
curl https://cutool-1254002056.cos-website.ap-guangzhou.myqcloud.com
```

### 修复 HTML Content-Type
```bash
./scripts/fix-html-content-type.sh
```

### 部署到 COS
```bash
./scripts/deploy-to-cos.sh
```

## 相关文档

- [国内部署方案](./DEPLOY_TO_CHINA.md)
- [GitHub Secrets 配置](./GITHUB_SECRETS_SETUP.md)
- [COS AccessDenied 错误修复](./COS_ACCESS_DENIED_FIX.md)




