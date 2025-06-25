declare module 'alipay-sdk' {
  export class AlipaySdk {
    constructor(options: {
      appId: string;
      privateKey: string;
      alipayPublicKey: string;
      gateway: string;
      timeout?: number;
    });

    exec(
      method: string,
      params: Record<string, any>,
      options?: { isPage?: boolean }
    ): Promise<any>;
  }
} 