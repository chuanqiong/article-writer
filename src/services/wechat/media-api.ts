/**
 * 微信公众号素材 API
 * 参考: https://github.com/IanShaw027/wemp-operator
 */

import { readFileSync, existsSync } from 'node:fs';
import { basename, extname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { randomBytes } from 'node:crypto';
import { getAccessToken } from './api-client.js';
import { downloadImage } from '../../utils/image-downloader.js';

// 内容类型映射
const CONTENT_TYPE_MAP: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  mp3: 'audio/mpeg',
  amr: 'audio/amr',
  mp4: 'video/mp4',
};

// 上传结果
export interface UploadResult {
  type: string;           // 媒体类型
  mediaId?: string;       // 临时素材 ID
  url?: string;           // 图片 URL（用于图文消息）
  createdAt?: number;     // 创建时间
}

// 素材信息
export interface MaterialInfo {
  mediaId: string;
  name: string;
  updateTime: number;
  url?: string;
  content?: any;
}

/**
 * 上传图文消息内的图片
 * API: POST /cgi-bin/media/uploadimg
 *
 * 返回的 URL 可直接用于图文消息正文中的 img 标签
 *
 * @param filePath 图片文件路径
 * @returns 图片 URL
 */
export async function uploadArticleImage(filePath: string): Promise<{ url: string }> {
  const token = await getAccessToken();
  const url = `https://api.weixin.qq.com/cgi-bin/media/uploadimg?access_token=${token}`;

  const result = await uploadMultipart(url, filePath, 'image');

  if (result.errcode) {
    throw new Error(`${result.errcode} - ${result.errmsg}`);
  }

  return { url: result.url };
}

/**
 * 上传临时素材
 * API: POST /cgi-bin/media/upload
 *
 * 临时素材有效期 3 天，适用于消息发送
 *
 * @param filePath 文件路径
 * @param type 媒体类型: image, voice, video, thumb
 * @returns 媒体 ID 和类型
 */
export async function uploadTempMedia(
  filePath: string,
  type: 'image' | 'voice' | 'video' | 'thumb' = 'image'
): Promise<UploadResult> {
  const token = await getAccessToken();
  const url = `https://api.weixin.qq.com/cgi-bin/media/upload?access_token=${token}&type=${type}`;

  const result = await uploadMultipart(url, filePath, type);

  if (result.errcode) {
    throw new Error(`${result.errcode} - ${result.errmsg}`);
  }

  return {
    type: result.type,
    mediaId: result.media_id,
    createdAt: result.created_at,
  };
}

/**
 * 上传永久素材
 * API: POST /cgi-bin/material/add_material
 *
 * 永久素材适用于图文消息封面等长期使用的资源
 *
 * @param filePath 文件路径
 * @param type 媒体类型: image, voice, video, thumb
 * @param options 附加选项（视频需要 title 和 introduction）
 * @returns 媒体 ID 和 URL
 */
export async function uploadPermanentMedia(
  filePath: string,
  type: 'image' | 'voice' | 'video' | 'thumb' = 'image',
  options?: { title?: string; introduction?: string }
): Promise<UploadResult> {
  const token = await getAccessToken();
  const url = `https://api.weixin.qq.com/cgi-bin/material/add_material?access_token=${token}&type=${type}`;

  const result = await uploadMultipart(url, filePath, type, options);

  if (result.errcode) {
    throw new Error(`${result.errcode} - ${result.errmsg}`);
  }

  return {
    type,
    mediaId: result.media_id,
    url: result.url,
  };
}

/**
 * 获取素材总数
 * API: GET /cgi-bin/material/get_materialcount
 */
export async function getMaterialCount(): Promise<{
  voice: number;
  video: number;
  image: number;
  news: number;
}> {
  const token = await getAccessToken();
  const url = `https://api.weixin.qq.com/cgi-bin/material/get_materialcount?access_token=${token}`;

  const response = await fetch(url);
  const data = await response.json() as any;

  if (data.errcode) {
    throw new Error(`${data.errcode} - ${data.errmsg}`);
  }

  return {
    voice: data.voice_count,
    video: data.video_count,
    image: data.image_count,
    news: data.news_count,
  };
}

/**
 * 获取素材列表
 * API: POST /cgi-bin/material/batchget_material
 *
 * @param type 素材类型: image, voice, video, news
 * @param offset 偏移量
 * @param count 数量（1-20）
 */
export async function getMaterialList(
  type: 'image' | 'voice' | 'video' | 'news' = 'image',
  offset = 0,
  count = 20
): Promise<{ totalCount: number; items: MaterialInfo[] }> {
  const token = await getAccessToken();
  const url = `https://api.weixin.qq.com/cgi-bin/material/batchget_material?access_token=${token}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, offset, count }),
  });

  const data = await response.json() as any;

  if (data.errcode) {
    throw new Error(`${data.errcode} - ${data.errmsg}`);
  }

  const items = (data.item || []).map((item: any) => ({
    mediaId: item.media_id,
    name: item.name,
    updateTime: item.update_time,
    url: item.url,
    content: item.content,
  }));

  return {
    totalCount: data.total_count,
    items,
  };
}

/**
 * 删除永久素材
 * API: POST /cgi-bin/material/del_material
 *
 * @param mediaId 素材 ID
 */
export async function deleteMaterial(mediaId: string): Promise<{ success: boolean }> {
  const token = await getAccessToken();
  const url = `https://api.weixin.qq.com/cgi-bin/material/del_material?access_token=${token}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ media_id: mediaId }),
  });

  const data = await response.json() as any;

  if (data.errcode && data.errcode !== 0) {
    throw new Error(`${data.errcode} - ${data.errmsg}`);
  }

  return { success: true };
}

/**
 * 下载在线图片并上传到微信
 * 用于处理文章中的外链图片
 *
 * @param imageUrl 在线图片 URL
 * @returns 上传后的微信图片 URL
 */
export async function downloadAndUploadImage(imageUrl: string): Promise<{ url: string }> {
  // 1. 下载图片到临时目录
  const tempDir = tmpdir();
  const ext = imageUrl.split('.').pop()?.split('?')[0] || 'png';
  const filename = `wechat-img-${Date.now()}-${randomBytes(4).toString('hex')}.${ext}`;
  const tempPath = join(tempDir, filename);

  try {
    // 使用现有的下载工具
    const result = await downloadImage({
      url: imageUrl,
      savePath: tempPath,
      timeout: 15000,
    });

    if (!result.success) {
      throw new Error(`图片下载失败: ${result.error}`);
    }

    // 2. 上传到微信
    const uploadResult = await uploadArticleImage(tempPath);

    // 3. 删除临时文件
    try {
      const { unlinkSync } = await import('node:fs');
      unlinkSync(tempPath);
    } catch {
      // 忽略删除失败
    }

    return uploadResult;
  } catch (error) {
    // 清理临时文件
    try {
      const { unlinkSync } = await import('node:fs');
      if (existsSync(tempPath)) {
        unlinkSync(tempPath);
      }
    } catch {
      // 忽略
    }
    throw error;
  }
}

// ============ 内部方法 ============

/**
 * Multipart/form-data 上传
 * 参考 wemp-operator 实现
 */
async function uploadMultipart(
  url: string,
  filePath: string,
  type: string,
  options?: { title?: string; introduction?: string }
): Promise<any> {
  const fileBuffer = readFileSync(filePath);
  const filename = basename(filePath);
  const ext = extname(filePath).toLowerCase().slice(1);
  const contentType = CONTENT_TYPE_MAP[ext] || 'application/octet-stream';

  // 生成 boundary
  const boundary = '----WebKitFormBoundary' + randomBytes(16).toString('hex');

  // 构建 multipart body
  const parts: Buffer[] = [];

  // 文件部分
  parts.push(
    Buffer.from(
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="media"; filename="${filename}"\r\n` +
      `Content-Type: ${contentType}\r\n\r\n`
    )
  );
  parts.push(fileBuffer);
  parts.push(Buffer.from('\r\n'));

  // 视频需要额外的描述信息
  if (type === 'video' && options?.title) {
    const desc = JSON.stringify({
      title: options.title,
      introduction: options.introduction || '',
    });
    parts.push(
      Buffer.from(
        `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="description"\r\n\r\n` +
        `${desc}\r\n`
      )
    );
  }

  // 结束 boundary
  parts.push(Buffer.from(`--${boundary}--\r\n`));

  const body = Buffer.concat(parts);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
    },
    body,
  });

  return response.json();
}
