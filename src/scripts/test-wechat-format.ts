#!/usr/bin/env node

/**
 * 测试微信格式化效果
 * 读取 Markdown 文件，格式化为微信 HTML，输出到控制台
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { WechatFormatter } from '../formatters/wechat-formatter.js';

async function testFormatter(markdownPath) {
  console.log('======================================');
  console.log('  微信格式化测试');
  console.log('======================================');
  console.log('');
  console.log(`📄 文件：${markdownPath}`);
  console.log('');

  try {
    // 读取 Markdown
    const content = readFileSync(markdownPath, 'utf-8');

    // 解析 frontmatter
    const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    const body = match ? match[2] : content;

    // 格式化
    const formatter = new WechatFormatter();
    const html = await formatter.format(body);

    console.log('✅ 格式化完成！');
    console.log('');
    console.log('📊 统计:');
    console.log(`- 原始字数：${body.length}`);
    console.log(`- HTML 字数：${html.length}`);
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('HTML 预览 (前 2000 字符):');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(html.substring(0, 2000));
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('💡 完整 HTML 已保存到 test-output.html');

    // 保存完整 HTML
    writeFileSync('test-output.html', html);

  } catch (error) {
    console.error('❌ 格式化失败:', error);
    process.exit(1);
  }
}

const args = process.argv.slice(2);
const filePath = args[0] || 'draft.md';
testFormatter(filePath);
