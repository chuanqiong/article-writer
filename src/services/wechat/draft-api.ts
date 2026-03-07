/**
 * 微信公众号草稿 API
 * 参考: https://github.com/IanShaw027/wemp-operator
 */

import { wechatApi } from './api-client.js';

// 草稿文章结构
export interface DraftArticle {
  title: string;                    // 标题
  author: string;                   // 作者
  digest: string;                   // 摘要
  content: string;                  // 正文 HTML
  content_source_url?: string;      // 原文链接
  thumb_media_id?: string;          // 封面图素材 ID（可选）
  need_open_comment?: number;       // 是否开启评论（0/1）
  only_fans_can_comment?: number;   // 仅粉丝可评论（0/1）
}

// 草稿列表项
export interface DraftItem {
  media_id: string;
  content: {
    news_item: DraftArticle[];
    create_time: number;
    update_time: number;
  };
}

/**
 * 创建草稿
 * API: POST /cgi-bin/draft/add
 */
export async function addDraft(articles: DraftArticle[]): Promise<{ mediaId: string }> {
  const data = await wechatApi<{ media_id: string }>('/cgi-bin/draft/add', {
    articles,
  });
  return { mediaId: data.media_id };
}

/**
 * 更新草稿
 * API: POST /cgi-bin/draft/update
 */
export async function updateDraft(
  mediaId: string,
  index: number,
  article: DraftArticle
): Promise<{ success: boolean }> {
  await wechatApi('/cgi-bin/draft/update', {
    media_id: mediaId,
    index,
    articles: article,
  });
  return { success: true };
}

/**
 * 获取草稿内容
 * API: POST /cgi-bin/draft/get
 */
export async function getDraft(mediaId: string): Promise<{ items: DraftArticle[] }> {
  const data = await wechatApi<{ news_item: DraftArticle[] }>('/cgi-bin/draft/get', {
    media_id: mediaId,
  });
  return { items: data.news_item || [] };
}

/**
 * 获取草稿列表
 * API: POST /cgi-bin/draft/batchget
 */
export async function listDrafts(
  offset: number = 0,
  count: number = 20,
  noContent: boolean = false
): Promise<{ totalCount: number; items: DraftItem[] }> {
  const data = await wechatApi<{
    total_count: number;
    item: DraftItem[];
  }>('/cgi-bin/draft/batchget', {
    offset,
    count,
    no_content: noContent ? 1 : 0,
  });
  return { totalCount: data.total_count, items: data.item || [] };
}

/**
 * 删除草稿
 * API: POST /cgi-bin/draft/delete
 */
export async function deleteDraft(mediaId: string): Promise<{ success: boolean }> {
  await wechatApi('/cgi-bin/draft/delete', {
    media_id: mediaId,
  });
  return { success: true };
}

/**
 * 获取草稿数量
 * API: POST /cgi-bin/draft/count
 */
export async function getDraftCount(): Promise<{ count: number }> {
  const data = await wechatApi<{ total_count: number }>('/cgi-bin/draft/count', {});
  return { count: data.total_count };
}
