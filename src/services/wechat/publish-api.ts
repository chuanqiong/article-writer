/**
 * 微信公众号发布 API
 * 参考: https://github.com/IanShaw027/wemp-operator
 */

import { wechatApi } from './api-client.js';

// 发布状态
export enum PublishStatus {
  SUCCESS = 0,       // 发布成功
  PROCESSING = 1,    // 发布中
  FAILED = -1,       // 发布失败
}

// 发布结果
export interface PublishResult {
  publishId: string;      // 发布任务 ID
  msgDataId?: string;     // 消息数据 ID（发布成功后返回）
  articleId?: string;     // 文章 ID（发布成功后返回）
}

// 发布状态详情
export interface PublishStatusDetail {
  publishStatus: PublishStatus;
  articleId?: string;
  articleDetail?: {
    count: number;
    item: Array<{
      articleId: string;
      content: any;
    }>;
  };
  failIdx?: number[];     // 失败的文章索引
}

// 已发布文章
export interface PublishedArticle {
  articleId: string;
  content: any;
  updateTime: number;
}

/**
 * 发布草稿
 * API: POST /cgi-bin/freepublish/submit
 *
 * @param mediaId 草稿 media_id
 * @returns publishId 发布任务 ID
 */
export async function publishDraft(mediaId: string): Promise<PublishResult> {
  const data = await wechatApi<{
    publish_id: string;
    msg_data_id?: string;
  }>('/cgi-bin/freepublish/submit', {
    media_id: mediaId,
  });

  return {
    publishId: data.publish_id,
    msgDataId: data.msg_data_id,
  };
}

/**
 * 查询发布状态
 * API: POST /cgi-bin/freepublish/get
 *
 * @param publishId 发布任务 ID
 * @returns 发布状态详情
 */
export async function getPublishStatus(publishId: string): Promise<PublishStatusDetail> {
  const data = await wechatApi<{
    publish_status: number;
    article_id?: string;
    article_detail?: any;
    fail_idx?: number[];
  }>('/cgi-bin/freepublish/get', {
    publish_id: publishId,
  });

  return {
    publishStatus: data.publish_status as PublishStatus,
    articleId: data.article_id,
    articleDetail: data.article_detail,
    failIdx: data.fail_idx,
  };
}

/**
 * 获取已发布文章列表
 * API: POST /cgi-bin/freepublish/batchget
 *
 * @param offset 偏移量
 * @param count 数量（最大 20）
 * @param noContent 是否不返回内容
 */
export async function listPublished(
  offset = 0,
  count = 20,
  noContent = true
): Promise<{ totalCount: number; items: any[] }> {
  const data = await wechatApi<{
    total_count: number;
    item_count: number;
    item: any[];
  }>('/cgi-bin/freepublish/batchget', {
    offset,
    count,
    no_content: noContent ? 1 : 0,
  });

  return {
    totalCount: data.total_count,
    items: data.item || [],
  };
}

/**
 * 获取已发布文章详情
 * API: POST /cgi-bin/freepublish/getarticle
 *
 * @param articleId 文章 ID
 */
export async function getPublishedArticle(articleId: string): Promise<PublishedArticle> {
  const data = await wechatApi<{
    news_item: any[];
  }>('/cgi-bin/freepublish/getarticle', {
    article_id: articleId,
  });

  return {
    articleId,
    content: data.news_item,
    updateTime: Date.now(),
  };
}

/**
 * 删除已发布文章
 * API: POST /cgi-bin/freepublish/delete
 *
 * @param articleId 文章 ID
 * @param index 文章索引（多图文时使用）
 */
export async function deletePublished(
  articleId: string,
  index = 0
): Promise<{ success: boolean }> {
  await wechatApi('/cgi-bin/freepublish/delete', {
    article_id: articleId,
    index,
  });

  return { success: true };
}
