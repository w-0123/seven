import Dysmsapi20170525, * as $Dysmsapi20170525 from '@alicloud/dysmsapi20170525';
import * as $OpenApi from '@alicloud/openapi-client';
import * as $Util from '@alicloud/tea-util';

export class SmsService {
  private client: Dysmsapi20170525;
  private isTestMode: boolean;

  constructor() {
    // 关闭测试模式，使用真实短信发送
    this.isTestMode = false;

    // 阿里云访问密钥配置
    const config = new $OpenApi.Config({
      // 使用你的阿里云访问密钥
      accessKeyId: process.env.ALIYUN_SMS_ACCESS_KEY_ID || '',
      accessKeySecret: process.env.ALIYUN_SMS_ACCESS_KEY_SECRET || ''
    });

    // 访问的域名
    config.endpoint = 'dysmsapi.aliyuncs.com';
    this.client = new Dysmsapi20170525(config);
  }

  // 生成6位验证码
  static generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // 发送验证码
  async sendVerificationCode(phone: string, code: string): Promise<boolean> {
    try {
      if (this.isTestMode) {
        // 真实环境下不打印验证码
        return true;
      }
      // 打印验证码到控制台
      console.log(`[调试] 发送给 ${phone} 的验证码是: ${code}`);
      const sendSmsRequest = new $Dysmsapi20170525.SendSmsRequest({
        phoneNumbers: phone,
        signName: process.env.ALIYUN_SMS_SIGN_NAME || '',
        templateCode: process.env.ALIYUN_SMS_TEMPLATE_CODE || '',
        templateParam: JSON.stringify({ code }),
      });
      const runtime = new $Util.RuntimeOptions({});
      const result = await this.client.sendSmsWithOptions(sendSmsRequest, runtime);
      if (result?.body?.code === 'OK') {
        return true;
      }
      // 记录详细错误信息
      console.error('短信发送失败:', {
        errorCode: result?.body?.code,
        errorMessage: result?.body?.message,
        requestId: result?.body?.requestId
      });
      return false;
    } catch (error) {
      console.error('短信发送异常:', {
        error,
        errorMessage: error instanceof Error ? error.message : '未知错误'
      });
      return false;
    }
  }
} 