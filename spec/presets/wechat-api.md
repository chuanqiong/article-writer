# 微信公众号 API 配置规范

## 配置方式

### 方式一：环境变量（推荐）

```bash
# 在 ~/.zshrc 或 ~/.bashrc 中添加
export WECHAT_APP_ID="wx1234567890abcdef"
export WECHAT_APP_SECRET="your_app_secret_here"
```

### 方式二：配置文件

在项目根目录的 `.content/config.json` 中添加：

```json
{
  "workspace": "wechat",
  "wechat": {
    "appId": "wx1234567890abcdef",
    "appSecret": "your_app_secret_here"
  }
}
```

> ⚠️ **安全提示**: 不要将 `appSecret` 提交到 Git。建议使用环境变量。

## 配置字段说明

| 字段 | 必填 | 说明 |
|------|------|------|
| `appId` | ✅ | 公众号 AppID，以 `wx` 开头 |
| `appSecret` | ✅ | 公众号 AppSecret，32 位字符串 |

## 获取方式

1. 登录 [微信公众平台](https://mp.weixin.qq.com)
2. 进入 **开发** → **基本配置**
3. 复制"开发者ID(AppID)"和"开发者密码(AppSecret)"

## IP 白名单

调用 API 的服务器 IP 需要添加到公众号白名单：

1. 进入 **开发** → **基本配置**
2. 点击"IP白名单" → "修改"
3. 添加服务器 IP（支持多个，用换行分隔）

### 本地开发

```bash
# 查看本机公网 IP
curl -s ifconfig.me
```

## 配置加载优先级

```
环境变量 > 配置文件
```

如果同时配置了环境变量和配置文件，优先使用环境变量。

## 验证配置

```bash
# 测试配置是否正确
node -e "
const { getWempAccount } = require('./dist/services/wechat/api-client.js');
try {
  const account = getWempAccount();
  console.log('✅ 配置正确:', account.appId);
} catch (e) {
  console.error('❌ 配置错误:', e.message);
}
"
```

## 错误排查

| 错误信息 | 原因 | 解决方案 |
|---------|------|---------|
| `未找到微信公众账号配置` | 未配置 AppID/AppSecret | 设置环境变量或配置文件 |
| `40001 - invalid credential` | AppSecret 错误 | 检查 AppSecret 是否正确 |
| `40164 - invalid ip` | IP 不在白名单 | 添加服务器 IP 到白名单 |
| `40013 - invalid appid` | AppID 格式错误 | 检查 AppID 是否以 wx 开头 |
