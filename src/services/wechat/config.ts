/**
 * 微信公众号配置管理
 * 支持环境变量和配置文件两种方式
 */

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

// 微信配置接口
export interface WechatConfig {
  appId: string;
  appSecret: string;
}

// 配置验证结果
export interface ConfigValidationResult {
  valid: boolean;
  errors: string[];
  config?: WechatConfig;
}

/**
 * 从环境变量读取配置
 */
function loadFromEnv(): WechatConfig | null {
  const appId = process.env.WECHAT_APP_ID;
  const appSecret = process.env.WECHAT_APP_SECRET;

  if (appId && appSecret) {
    return { appId, appSecret };
  }

  return null;
}

/**
 * 从配置文件读取配置
 * 按优先级尝试多个路径
 */
function loadFromFile(): WechatConfig | null {
  const configPaths = [
    // 1. 当前项目的 .content/config.json
    join(process.cwd(), '.content', 'config.json'),
    // 2. 全局配置
    join(homedir(), '.article-writer', 'config.json'),
  ];

  for (const configPath of configPaths) {
    if (!existsSync(configPath)) continue;

    try {
      const content = readFileSync(configPath, 'utf-8');
      const config = JSON.parse(content);

      if (config.wechat?.appId && config.wechat?.appSecret) {
        return {
          appId: config.wechat.appId,
          appSecret: config.wechat.appSecret,
        };
      }
    } catch (error) {
      // 忽略解析错误，继续尝试下一个路径
    }
  }

  return null;
}

/**
 * 验证 AppID 格式
 * - 必须以 'wx' 开头
 * - 长度为 18 位
 */
export function validateAppId(appId: string): { valid: boolean; error?: string } {
  if (!appId) {
    return { valid: false, error: 'AppID 不能为空' };
  }

  if (!appId.startsWith('wx')) {
    return { valid: false, error: 'AppID 必须以 "wx" 开头' };
  }

  if (appId.length !== 18) {
    return { valid: false, error: 'AppID 长度必须为 18 位' };
  }

  return { valid: true };
}

/**
 * 验证 AppSecret 格式
 * - 长度为 32 位
 * - 只包含字母和数字
 */
export function validateAppSecret(appSecret: string): { valid: boolean; error?: string } {
  if (!appSecret) {
    return { valid: false, error: 'AppSecret 不能为空' };
  }

  if (appSecret.length !== 32) {
    return { valid: false, error: 'AppSecret 长度必须为 32 位' };
  }

  if (!/^[a-zA-Z0-9]+$/.test(appSecret)) {
    return { valid: false, error: 'AppSecret 只能包含字母和数字' };
  }

  return { valid: true };
}

/**
 * 加载并验证配置
 * 优先级: 环境变量 > 配置文件
 */
export function loadWechatConfig(): ConfigValidationResult {
  const errors: string[] = [];

  // 1. 尝试从环境变量加载
  let config = loadFromEnv();
  const source = config ? '环境变量' : null;

  // 2. 如果环境变量没有，尝试从配置文件加载
  if (!config) {
    config = loadFromFile();
  }

  // 3. 没有找到配置
  if (!config) {
    return {
      valid: false,
      errors: [
        '未找到微信公众号配置',
        '',
        '请选择以下任一方式配置：',
        '',
        '方式一：环境变量（推荐）',
        '  export WECHAT_APP_ID="wx1234567890abcdef"',
        '  export WECHAT_APP_SECRET="your_app_secret_here"',
        '',
        '方式二：配置文件',
        '  在 .content/config.json 中添加：',
        '  {',
        '    "wechat": {',
        '      "appId": "wx1234567890abcdef",',
        '      "appSecret": "your_app_secret_here"',
        '    }',
        '  }',
        '',
        '获取凭证：',
        '1. 登录 https://mp.weixin.qq.com',
        '2. 进入 开发 → 基本配置',
        '3. 复制 AppID 和 AppSecret',
      ],
    };
  }

  // 4. 验证配置
  const appIdResult = validateAppId(config.appId);
  if (!appIdResult.valid) {
    errors.push(`AppID 无效: ${appIdResult.error}`);
  }

  const appSecretResult = validateAppSecret(config.appSecret);
  if (!appSecretResult.valid) {
    errors.push(`AppSecret 无效: ${appSecretResult.error}`);
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    errors: [],
    config,
  };
}

/**
 * 获取配置（简化版，直接返回或抛错）
 */
export function getWechatConfig(): WechatConfig {
  const result = loadWechatConfig();

  if (!result.valid || !result.config) {
    throw new Error(result.errors.join('\n'));
  }

  return result.config;
}

/**
 * 检查配置是否可用
 */
export function isWechatConfigured(): boolean {
  const result = loadWechatConfig();
  return result.valid;
}

/**
 * 获取配置来源描述
 */
export function getConfigSource(): string {
  if (process.env.WECHAT_APP_ID && process.env.WECHAT_APP_SECRET) {
    return '环境变量';
  }

  const configPaths = [
    join(process.cwd(), '.content', 'config.json'),
    join(homedir(), '.article-writer', 'config.json'),
  ];

  for (const configPath of configPaths) {
    if (existsSync(configPath)) {
      try {
        const content = readFileSync(configPath, 'utf-8');
        const config = JSON.parse(content);
        if (config.wechat?.appId && config.wechat?.appSecret) {
          return configPath.includes('.content') ? '项目配置文件' : '全局配置文件';
        }
      } catch {
        // 忽略
      }
    }
  }

  return '未配置';
}
