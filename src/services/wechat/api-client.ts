/**
 * 微信公众号 API 客户端
 * 负责认证、Token 管理和统一请求封装
 *
 * 参考: https://github.com/IanShaw027/wemp-operator
 */

import { getWechatConfig, type WechatConfig } from './config.js';

// Token 缓存结构
interface TokenCache {
  token: string;
  expiresAt: number;
}

// API 错误响应
interface WechatApiError {
  errcode: number;
  errmsg: string;
}

// 全局 Token 缓存
let tokenCache: TokenCache | null = null;

/**
 * 获取微信账号配置
 * 优先级: 环境变量 > 配置文件
 */
export function getWempAccount(): WechatConfig {
  return getWechatConfig();
}

/**
 * 获取 Access Token
 * - 内存缓存，提前 300 秒刷新
 * - 参考 wemp-operator 实现
 */
export async function getAccessToken(): Promise<string> {
  // 1. 检查缓存是否有效
  if (tokenCache && tokenCache.expiresAt > Date.now()) {
    return tokenCache.token;
  }

  // 2. 获取账号信息
  const account = getWempAccount();

  // 3. 调用微信 API 获取 token
  const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${account.appId}&secret=${account.appSecret}`;

  const response = await fetch(url);
  const data = await response.json() as WechatApiError & { access_token?: string; expires_in?: number };

  // 4. 检查错误
  if (data.errcode) {
    throw new Error(`获取 Token 失败: ${data.errcode} - ${data.errmsg}`);
  }

  // 5. 缓存 token（提前 300 秒刷新）
  tokenCache = {
    token: data.access_token!,
    expiresAt: Date.now() + (data.expires_in! - 300) * 1000,
  };

  return tokenCache.token;
}

/**
 * 统一微信 API 请求方法
 * @param path API 路径（如 /cgi-bin/draft/add）
 * @param body 请求体（POST 请求）
 * @param method HTTP 方法
 */
export async function wechatApi<T = any>(
  path: string,
  body: Record<string, any> | null = null,
  method: 'GET' | 'POST' = 'POST'
): Promise<T> {
  const token = await getAccessToken();
  const separator = path.includes('?') ? '&' : '?';
  const url = `https://api.weixin.qq.com${path}${separator}access_token=${token}`;

  const options: RequestInit = {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  };

  const response = await fetch(url, options);
  const data = await response.json() as T & WechatApiError;

  // 检查业务错误（errcode 为 0 表示成功）
  if ('errcode' in data && data.errcode !== 0) {
    throw new Error(`${data.errcode} - ${data.errmsg}`);
  }

  return data;
}

/**
 * 清除 Token 缓存（用于测试或强制刷新）
 */
export function clearTokenCache(): void {
  tokenCache = null;
}
