/**
 * 可选依赖的类型声明
 * 这些模块是可选的，可能未安装
 */

declare module 'puppeteer' {
  interface PuppeteerLaunchOptions {
    headless?: boolean | 'new';
    args?: string[];
    executablePath?: string;
  }
  interface Page {
    goto(url: string, options?: { waitUntil?: string | string[]; timeout?: number }): Promise<void>;
    content(): Promise<string>;
    close(): Promise<void>;
    waitForSelector(selector: string, options?: { timeout?: number }): Promise<void>;
    evaluate<T>(fn: () => T): Promise<T>;
    screenshot(options?: { fullPage?: boolean; path?: string }): Promise<Buffer>;
    setViewport(viewport: { width: number; height: number }): Promise<void>;
  }
  interface Browser {
    newPage(): Promise<Page>;
    close(): Promise<void>;
    pages(): Promise<Page[]>;
  }
  export function launch(options?: PuppeteerLaunchOptions): Promise<Browser>;
  export function createCursor(): any;
  export { Page, Browser, PuppeteerLaunchOptions };
}

declare module 'cos-nodejs-sdk-v5' {
  interface COSOptions {
    SecretId: string;
    SecretKey: string;
    XCosSecurityToken?: string;
  }
  interface PutObjectParams {
    Bucket: string;
    Region: string;
    Key: string;
    Body: Buffer | NodeJS.ReadableStream | string;
    ContentLength?: number;
    ContentType?: string;
  }
  interface PutObjectResult {
    Location: string;
    ETag: string;
    statusCode: number;
  }
  interface GetObjectParams {
    Bucket: string;
    Region: string;
    Key: string;
  }
  interface GetObjectResult {
    Body: Buffer;
    statusCode: number;
  }
  interface DeleteObjectParams {
    Bucket: string;
    Region: string;
    Key: string;
  }
  interface HeadObjectParams {
    Bucket: string;
    Region: string;
    Key: string;
  }
  interface HeadObjectResult {
    ContentLength: number;
    ContentType: string;
    ETag: string;
    LastModified: string;
  }

  interface COSMethods {
    putObject(params: PutObjectParams, callback: (err: Error | null, data: PutObjectResult) => void): void;
    getObject(params: GetObjectParams, callback: (err: Error | null, data: GetObjectResult) => void): void;
    deleteObject(params: DeleteObjectParams, callback: (err: Error | null) => void): void;
    headObject(params: HeadObjectParams, callback: (err: Error | null, data: HeadObjectResult) => void): void;
    headBucket(params: { Bucket: string; Region: string }, callback: (err: Error | null, data: { statusCode: number }) => void): void;
    putObjectCopy(params: any, callback: (err: Error | null, data: any) => void): void;
    uploadFile(params: {
      Bucket: string;
      Region: string;
      Key: string;
      FilePath: string;
      SliceSize?: number;
    }, callback: (err: Error | null, data: PutObjectResult) => void): void;
  }

  interface COSConstructor {
    new (options: COSOptions): COSMethods;
    (options: COSOptions): COSMethods;
  }

  const COS: COSConstructor;
  export = COS;
}

declare module '@aws-sdk/client-s3' {
  interface S3ClientConfig {
    region: string;
    credentials?: {
      accessKeyId: string;
      secretAccessKey: string;
    };
    endpoint?: string;
    forcePathStyle?: boolean;
  }
  interface PutObjectCommandInput {
    Bucket: string;
    Key: string;
    Body: Buffer | string | Uint8Array;
    ContentType?: string;
    ContentLength?: number;
  }
  interface GetObjectCommandInput {
    Bucket: string;
    Key: string;
  }
  interface DeleteObjectCommandInput {
    Bucket: string;
    Key: string;
  }
  interface HeadBucketCommandInput {
    Bucket: string;
  }
  interface GetObjectCommandOutput {
    Body?: {
      transformToByteArray(): Promise<Uint8Array>;
      transformToString(): Promise<string>;
    };
    ContentLength?: number;
    ContentType?: string;
    ETag?: string;
  }
  interface HeadBucketCommandOutput {
    BucketRegion?: string;
  }

  class S3Client {
    constructor(config: S3ClientConfig);
    send(command: PutObjectCommand): Promise<{ ETag?: string }>;
    send(command: GetObjectCommand): Promise<GetObjectCommandOutput>;
    send(command: DeleteObjectCommand): Promise<void>;
    send(command: HeadBucketCommand): Promise<HeadBucketCommandOutput>;
    destroy(): void;
  }
  class PutObjectCommand {
    constructor(input: PutObjectCommandInput);
  }
  class GetObjectCommand {
    constructor(input: GetObjectCommandInput);
  }
  class DeleteObjectCommand {
    constructor(input: DeleteObjectCommandInput);
  }
  class HeadBucketCommand {
    constructor(input: HeadBucketCommandInput);
  }

  export {
    S3Client,
    PutObjectCommand,
    GetObjectCommand,
    DeleteObjectCommand,
    HeadBucketCommand,
  };
}
