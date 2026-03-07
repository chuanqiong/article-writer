---
description: 推送文章到微信公众号草稿箱
argument-hint: [文件路径] (默认: draft.md)
allowed-tools: Read, Bash, Write
scripts:
  sh: scripts/bash/push-draft.sh
---

# 推送草稿到公众号

## 功能说明

将当前文章推送到微信公众号草稿箱，自动完成：
- 图片上传到微信素材库
- 格式化为公众号兼容的 HTML
- 提取 frontmatter 元信息
- 创建草稿并返回 media_id

## ⚠️ 前置条件

**必须先完成以下配置：**

1. **环境变量** (推荐):
   ```bash
   export WECHAT_APP_ID="wx1234567890abcdef"
   export WECHAT_APP_SECRET="your_app_secret"
   ```

2. **或配置文件** `.content/config.json`:
   ```json
   {
     "wechat": {
       "appId": "wx1234567890abcdef",
       "appSecret": "your_app_secret"
     }
   }
   ```

3. **IP 白名单**: 将服务器 IP 添加到公众号后台

> 如果未配置，执行时会提示配置方法

---

## 使用方式

### 基本用法

```bash
/push-draft                    # 推送当前目录的 draft.md
/push-draft path/to/article.md # 推送指定文件
```

---

## 执行流程

### 1. 检查配置

首先检查微信 API 配置是否完整：

```bash
# 检查环境变量
echo $WECHAT_APP_ID
echo $WECHAT_APP_SECRET

# 或检查配置文件
cat .content/config.json | grep -A3 '"wechat"'
```

### 2. 读取文章

读取 Markdown 文件并解析 frontmatter：

```markdown
---
title: 文章标题     # 必填
author: 作者名     # 必填
digest: 文章摘要   # 必填，建议 50-120 字
cover: images/cover.png  # 必填
---

正文内容...
```

**必填字段说明：**

| 字段 | 说明 |
|------|------|
| `title` | 文章标题，最长 64 字 |
| `author` | 作者名称 |
| `digest` | 文章摘要，建议 50-120 字 |
| `cover` | 封面图路径（绝对路径或相对路径） |

### 3. 格式化内容

调用格式化器生成公众号兼容的 HTML：

```bash
# 使用现有的 WechatFormatter
# 自动跳过 h1 标题（与公众号标题重复）
```

### 4. 上传图片

自动检测并上传图片：

- **本地图片**: 直接上传到素材库
- **在线图片**: 下载后上传（TODO）
- **已上传图片**: 跳过（mmbiz.qpic.cn 域名）

### 5. 创建草稿

调用微信 API 创建草稿：

```javascript
// POST /cgi-bin/draft/add
{
  articles: [{
    title: "标题",
    author: "作者",
    digest: "摘要",
    content: "<HTML内容>",
    thumb_media_id: "封面图ID"
  }]
}
```

---

## 输出示例

### 成功

```
✅ 草稿创建成功！

📄 标题: Claude Code 深度评测
📊 字数: 3520
🖼️ 图片: 6 张上传成功
🆔 Media ID: media_id_xxx

💡 下一步：
1. 登录微信公众号后台
2. 进入"草稿箱"
3. 找到文章并编辑/发布

或使用命令直接发布：
/publish-draft media_id_xxx
```

### 失败

```
❌ 推送失败

原因: 40001 - invalid credential

解决方案:
1. 检查 WECHAT_APP_ID 和 WECHAT_APP_SECRET 是否正确
2. 确认服务器 IP 已添加到白名单
3. 重新生成 AppSecret 并更新配置
```

---

## 配置帮助

### 获取 AppID/AppSecret

1. 登录 [微信公众平台](https://mp.weixin.qq.com)
2. 进入 **开发** → **基本配置**
3. 复制"开发者ID"和"开发者密码"

### 配置 IP 白名单

```bash
# 查看本机公网 IP
curl -s ifconfig.me

# 然后在公众号后台添加
```

---

## 注意事项

1. **图片限制**:
   - 支持格式: jpg, png, gif
   - 大小限制: 2MB
   - 推荐尺寸: 900×500px

2. **封面图**:
   - 必填
   - 推荐尺寸: 900×500px
   - 格式: jpg 或 png

3. **内容限制**:
   - 标题: 最长 64 字
   - 摘要: 最长 120 字
   - 正文: 无限制

4. **API 限制**:
   - 草稿数量上限: 100
   - 每日调用次数: 根据公众号等级

---

## 常见问题

### Q: 提示 "invalid ip" 错误？
A: 服务器 IP 不在白名单，需要在公众号后台添加。

### Q: 图片上传失败？
A: 检查图片格式和大小，确保路径正确。

### Q: 草稿箱满了？
A: 删除一些旧草稿，上限 100 篇。

### Q: 如何查看已推送的草稿？
A: 登录公众号后台 → 草稿箱，或使用 `/list-drafts` 命令。
