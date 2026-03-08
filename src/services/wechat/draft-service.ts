/**
 * 草稿推送服务
 * 支持从 Typora 导出的 HTML 文件推送到微信公众号草稿箱
 */

import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import {
  uploadArticleImage,
  uploadPermanentMedia,
  downloadAndUploadImage,
} from './media-api.js';
import { addDraft, type DraftArticle } from './draft-api.js';

// Frontmatter 元信息
export interface ArticleFrontmatter {
  title: string;
  author?: string;
  digest?: string;
  cover?: string;
  contentSourceUrl?: string;
  needOpenComment?: number;
  onlyFansCanComment?: number;
}

// 推送结果
export interface PushResult {
  success: boolean;
  mediaId?: string;
  title: string;
  message?: string;
}

/**
 * 解析 HTML 注释块中的 frontmatter
 * 格式:
 * <!--
 * ---
 * title: 文章标题
 * author: 作者名
 * digest: 文章摘要
 * cover: images/cover.png
 * ---
 * -->
 */
export function parseHtmlFrontmatter(content: string): {
  frontmatter: ArticleFrontmatter;
  body: string;
} {
  // 匹配 HTML 注释块中的 frontmatter
  const match = content.match(/<!--\n---\n([\s\S]*?)\n---\n-->\n?([\s\S]*)/);

  if (!match) {
    return {
      frontmatter: { title: '' },
      body: content,
    };
  }

  const yaml = match[1];
  const body = match[2];
  const frontmatter: ArticleFrontmatter = { title: '' };

  // 简单 YAML 解析
  const lines = yaml.split('\n');
  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;

    const key = line.slice(0, colonIndex).trim();
    let value = line.slice(colonIndex + 1).trim();

    // 移除引号
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    switch (key) {
      case 'title':
        frontmatter.title = value;
        break;
      case 'author':
        frontmatter.author = value;
        break;
      case 'digest':
      case 'description':
      case 'summary':
        frontmatter.digest = value;
        break;
      case 'cover':
      case 'thumb':
      case 'image':
        frontmatter.cover = value;
        break;
      case 'content_source_url':
        frontmatter.contentSourceUrl = value;
        break;
    }
  }

  return { frontmatter, body };
}

/**
 * 检查文件是否为 HTML 文件
 */
export function isHtmlFile(filePath: string): boolean {
  return filePath.toLowerCase().endsWith('.html');
}

/**
 * 提取 HTML 中的图片 URL
 */
export function extractImageUrls(html: string): string[] {
  const regex = /<img[^>]+src=["']([^"']+)["']/g;
  const urls: string[] = [];
  let match;

  while ((match = regex.exec(html)) !== null) {
    urls.push(match[1]);
  }

  return urls;
}

/**
 * 判断是否为本地图片
 */
export function isLocalImage(url: string): boolean {
  return !url.startsWith('http://') &&
         !url.startsWith('https://') &&
         !url.startsWith('data:');
}

/**
 * 移除 HTML 中的 base64 图片标签
 */
export function removeBase64Images(html: string): string {
  // 移除包含 base64 图片的 img 标签
  return html.replace(/<img[^>]+src=["']data:image[^"']+["'][^>]*\/?>/gi, '<!-- base64 图片已移除 -->');
}

/**
 * 批量上传图片并替换 URL
 */
export async function processImages(
  html: string,
  basePath: string
): Promise<{ html: string; uploaded: number; failed: string[] }> {
  // 先移除 base64 图片
  let processedHtml = removeBase64Images(html);

  const urls = extractImageUrls(processedHtml);
  const urlMap = new Map<string, string>();
  const failed: string[] = [];
  let uploaded = 0;

  for (const url of urls) {
    // 跳过已经上传过的图片（mmbiz.qpic.cn）
    if (url.includes('mmbiz.qpic.cn')) {
      continue;
    }

    // 跳过 data: URL（已经在 removeBase64Images 中处理）
    if (url.startsWith('data:')) {
      continue;
    }

    try {
      let newUrl: string;

      if (isLocalImage(url)) {
        // 本地图片
        const absolutePath = url.startsWith('/')
          ? url
          : join(basePath, url);

        if (!existsSync(absolutePath)) {
          console.warn(`图片不存在：${absolutePath}`);
          failed.push(url);
          continue;
        }

        const result = await uploadArticleImage(absolutePath);
        newUrl = result.url;
      } else {
        // 在线图片：下载后上传
        const result = await downloadAndUploadImage(url);
        newUrl = result.url;
      }

      urlMap.set(url, newUrl);
      uploaded++;
      console.log(`✓ 图片上传成功：${url.substring(0, 50)}...`);
    } catch (error) {
      console.error(`图片上传失败：${url}`, error);
      failed.push(url);
    }
  }

  // 替换 URL
  for (const [oldUrl, newUrl] of urlMap) {
    processedHtml = processedHtml.split(oldUrl).join(newUrl);
  }

  return { html: processedHtml, uploaded, failed };
}

/**
 * 上传封面图并获取 media_id
 */
export async function uploadCoverImage(
  coverPath: string
): Promise<string> {
  if (!existsSync(coverPath)) {
    throw new Error(`封面图不存在：${coverPath}`);
  }

  const result = await uploadPermanentMedia(coverPath, 'thumb');
  return result.mediaId!;
}

/**
 * 推送 HTML 文章到草稿箱
 */
export async function pushHtmlToDraft(
  htmlPath: string
): Promise<PushResult> {
  try {
    // 1. 检查文件类型
    if (!isHtmlFile(htmlPath)) {
      return {
        success: false,
        title: '',
        message: `仅支持 .html 文件格式，当前文件为：${htmlPath}\n\n请在 Typora 中将 Markdown 导出为 HTML，然后使用：\n/push-draft article.html`,
      };
    }

    // 2. 读取 HTML 文件
    if (!existsSync(htmlPath)) {
      return {
        success: false,
        title: '',
        message: `文件不存在：${htmlPath}`,
      };
    }

    const content = readFileSync(htmlPath, 'utf-8');
    const { frontmatter, body } = parseHtmlFrontmatter(content);
    const basePath = dirname(htmlPath);

    // 验证必填字段
    if (!frontmatter.title) {
      return {
        success: false,
        title: '',
        message: '❌ 缺少必填字段：title（标题）\n\n请在 HTML 文件头部添加 frontmatter 注释块：\n<!--\n---\ntitle: 文章标题\n---\n-->',
      };
    }

    if (!frontmatter.author) {
      return {
        success: false,
        title: frontmatter.title,
        message: '❌ 缺少必填字段：author（作者）\n\n请在 HTML 文件 frontmatter 中添加：\nauthor: 作者名',
      };
    }

    if (!frontmatter.digest) {
      return {
        success: false,
        title: frontmatter.title,
        message: '❌ 缺少必填字段：digest（摘要）\n\n请在 HTML 文件 frontmatter 中添加：\ndigest: 文章摘要（建议 50-120 字）',
      };
    }

    if (!frontmatter.cover) {
      return {
        success: false,
        title: frontmatter.title,
        message: '❌ 缺少必填字段：cover（封面图）\n\n请在 HTML 文件 frontmatter 中添加：\ncover: images/cover.jpg',
      };
    }

    // 3. 使用 HTML 正文（已经是 HTML 格式，无需转换）
    let html = body;

    // 4. 上传图片并替换 URL
    const { html: processedHtml, uploaded, failed } = await processImages(html, basePath);

    if (failed.length > 0) {
      console.warn(`⚠️ ${failed.length} 张图片上传失败`);
    }

    // 5. 上传封面图（必填）
    let thumbMediaId: string;
    const coverPath = frontmatter.cover.startsWith('/')
      ? frontmatter.cover
      : join(basePath, frontmatter.cover);

    try {
      thumbMediaId = await uploadCoverImage(coverPath);
      console.log(`✓ 封面图上传成功：${thumbMediaId}`);
    } catch (error) {
      console.error('封面图上传失败:', error);
      return {
        success: false,
        title: frontmatter.title,
        message: `封面图上传失败：${error}`,
      };
    }

    // 6. 构建草稿数据
    const article: DraftArticle = {
      title: frontmatter.title,
      author: frontmatter.author,
      digest: frontmatter.digest,
      content: processedHtml,
      thumb_media_id: thumbMediaId,
    };

    if (frontmatter.contentSourceUrl) {
      article.content_source_url = frontmatter.contentSourceUrl;
    }

    // 7. 推送草稿
    const result = await addDraft([article]);

    return {
      success: true,
      mediaId: result.mediaId,
      title: frontmatter.title,
      message: `✅ 草稿创建成功！\n\n📄 标题：${frontmatter.title}\n📊 字数：${processedHtml.replace(/<[^>]+>/g, '').length}\n🖼️ 图片：${uploaded} 张上传成功\n🆔 Media ID: ${result.mediaId}`,
    };
  } catch (error) {
    return {
      success: false,
      title: '',
      message: `推送失败：${error}`,
    };
  }
}

// 兼容导出：推送到草稿箱的主函数
export const pushToDraft = pushHtmlToDraft;
