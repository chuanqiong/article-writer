/**
 * 动态页面爬虫 - 使用 Puppeteer 处理 JavaScript 渲染的页面
 */

import * as cheerio from 'cheerio';
import type { CrawlerConfig } from './types.js';
import { DocumentationCrawler } from './doc-crawler.js';

// 动态导入 puppeteer（可选依赖）
type Browser = any;
type Page = any;

async function loadPuppeteer() {
  try {
    const pptr = await import('puppeteer');
    // puppeteer 模块导出 { launch, ... }，不是 default
    return pptr;
  } catch (err) {
    throw new Error(
      '❌ Puppeteer 未安装。请运行: npm install puppeteer\n' +
      '   或使用静态爬虫（移除 --dynamic 参数）'
    );
  }
}

export class DynamicCrawler extends DocumentationCrawler {
  private browser: Browser | null = null;
  private page: Page | null = null;

  constructor(config: CrawlerConfig) {
    super(config);
  }

  /**
   * 初始化浏览器
   */
  private async initBrowser(): Promise<void> {
    if (this.browser) return;

    const puppeteer = await loadPuppeteer();
    
    console.log('🌐 启动 Puppeteer 浏览器...');
    this.browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu'
      ]
    });

    this.page = await this.browser.newPage();
    
    // 设置视口
    await this.page.setViewport({
      width: 1920,
      height: 1080
    });

    // 设置 User-Agent
    await this.page.setUserAgent(
      'Mozilla/5.0 (compatible; ArticleWriter-Crawler/1.0)'
    );

    console.log('✅ 浏览器已启动');
  }

  /**
   * 爬取单个页面（覆盖父类方法）
   */
  protected async crawlPage(url: string): Promise<void> {
    if (!this.page || !this.browser) {
      await this.initBrowser();
    }

    try {
      console.log(`📄 爬取（动态）: ${url}`);
      
      // 导航到页面
      await this.page!.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      // 等待主内容加载
      try {
        const contentSelector = this.config.selectors?.mainContent || 'article, main';
        await this.page!.waitForSelector(contentSelector, { timeout: 5000 });
      } catch {
        // 如果没有找到主内容选择器，继续处理
        console.log(`⚠️  未找到主内容选择器，尝试提取整个页面`);
      }

      // 额外等待，确保 JS 完全执行
      await this.sleep(1000);

      // 获取渲染后的 HTML
      const htmlContent = await this.page!.content();
      const $ = cheerio.load(htmlContent);

      // 提取内容（使用父类方法）
      const title = this.extractTitle($ as any);
      const content = this.extractMainContent($ as any);
      const codeExamples = this.extractCodeExamples($ as any);
      const links = this.extractLinks($ as any, url);

      const page = {
        url,
        title,
        content,
        htmlContent,
        codeExamples,
        category: this.inferCategory(url, title),
        scrapedAt: new Date().toISOString(),
        links
      };

      // 直接添加到爬取结果
      (this as any).crawledPages.push(page);
      (this as any).visitedUrls.add(url);

      // 将新链接加入队列
      this.addLinksToQueue(links);

    } catch (error: any) {
      console.error(`❌ 动态爬取失败 ${url}: ${error.message}`);
      
      // 降级到静态爬取
      console.log(`🔄 尝试静态爬取...`);
      await super.crawlPage(url);
    }
  }

  /**
   * 关闭浏览器
   */
  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
      console.log('🔚 浏览器已关闭');
    }
  }

  /**
   * 覆盖爬取方法，确保最后关闭浏览器
   */
  async crawl(onProgress?: (progress: any) => void): Promise<any> {
    try {
      return await super.crawl(onProgress);
    } finally {
      await this.close();
    }
  }
}

