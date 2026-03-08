/**
 * 微信公众号服务模块
 *
 * 提供微信公众号 API 集成，支持：
 * - 草稿管理（创建、更新、删除、列表）
 * - 发布管理（发布、状态查询）
 * - 素材管理（图片上传）
 * - Token 管理（自动刷新）
 * - 配置管理（环境变量 + 配置文件）
 *
 * 参考: https://github.com/IanShaw027/wemp-operator
 */

// 配置管理
export {
  loadWechatConfig,
  getWechatConfig,
  isWechatConfigured,
  validateAppId,
  validateAppSecret,
  getConfigSource,
  type WechatConfig,
} from './config.js';

// API 客户端
export {
  getAccessToken,
  getWempAccount,
  wechatApi,
  clearTokenCache,
} from './api-client.js';

// 草稿 API
export {
  addDraft,
  updateDraft,
  getDraft,
  listDrafts,
  deleteDraft,
  getDraftCount,
  type DraftArticle,
  type DraftItem,
} from './draft-api.js';

// 发布 API
export {
  publishDraft,
  getPublishStatus,
  listPublished,
  getPublishedArticle,
  deletePublished,
  PublishStatus,
  type PublishResult,
  type PublishStatusDetail,
  type PublishedArticle,
} from './publish-api.js';

// 素材 API
export {
  uploadArticleImage,
  uploadTempMedia,
  uploadPermanentMedia,
  getMaterialCount,
  getMaterialList,
  deleteMaterial,
  type UploadResult,
  type MaterialInfo,
} from './media-api.js';

// 草稿推送服务
export {
  pushToDraft,
  pushHtmlToDraft,
  parseHtmlFrontmatter,
  isHtmlFile,
  extractImageUrls,
  processImages,
  uploadCoverImage,
  type ArticleFrontmatter,
  type PushResult,
} from './draft-service.js';
