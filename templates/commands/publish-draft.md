---
description: 发布草稿到公众号（从草稿箱发布）
argument-hint: <media_id>
allowed-tools: Read, Bash
---

# 发布草稿

## 功能说明

将已创建的草稿发布到公众号，支持：
- 提交发布请求
- 查询发布状态
- 返回文章链接

## ⚠️ 重要提示

**发布是不可逆操作！** 建议先用 `/push-draft` 推送到草稿箱，在公众号后台预览确认后再发布。

---

## 使用方式

### 发布草稿

```bash
/publish-draft media_id_xxx
```

### 查询发布状态

```bash
/publish-status publish_id_xxx
```

---

## 执行流程

### 1. 提交发布

调用微信发布 API：

```bash
# POST /cgi-bin/freepublish/submit
curl -X POST "https://api.weixin.qq.com/cgi-bin/freepublish/submit?access_token=TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"media_id": "media_id_xxx"}'
```

返回：
```json
{
  "publish_id": "2247483647",
  "msg_data_id": "2247483648"
}
```

### 2. 检查状态

发布是异步的，需要轮询状态：

```bash
# 等待 3 秒
sleep 3

# 查询状态
# POST /cgi-bin/freepublish/get
```

状态码：
- `0` - 发布成功
- `1` - 发布中
- 其他 - 发布失败

### 3. 返回结果

成功时返回文章链接：

```
✅ 发布成功！

🔗 文章链接: https://mp.weixin.qq.com/s/xxx
📊 阅读量: 实时更新中
```

---

## 输出示例

### 成功

```
✅ 草稿发布成功！

📄 发布 ID: publish_id_xxx
🔗 文章链接: https://mp.weixin.qq.com/s/xxxxx
📅 发布时间: 2025-03-07 17:30:00

💡 提示：
- 文章已推送给所有关注者
- 可在后台查看详细数据
- 如需修改，请删除后重新发布
```

### 发布中

```
⏳ 发布处理中...

发布 ID: publish_id_xxx
状态: 处理中（通常需要 5-10 秒）

请稍后使用以下命令查询状态：
/publish-status publish_id_xxx
```

### 失败

```
❌ 发布失败

原因: 40125 - invalid appsecret

解决方案:
1. 检查 AppSecret 是否正确
2. 重新获取 access_token
```

---

## 注意事项

1. **不可撤销**: 发布后无法撤回，只能删除
2. **推送通知**: 会推送给所有关注者
3. **限流**: 每天发布次数有限制
4. **审核**: 敏感内容可能被拦截

---

## 相关命令

- `/push-draft` - 推送文章到草稿箱
- `/list-drafts` - 查看草稿列表
- `/list-published` - 查看已发布文章
