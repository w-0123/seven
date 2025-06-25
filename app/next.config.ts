import { config } from 'dotenv';
import path from 'path';

// 加载 aaa.env 文件
config({ path: path.resolve(process.cwd(), 'aaa.env') });

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    ALIYUN_SMS_ACCESS_KEY_ID: process.env.ALIYUN_SMS_ACCESS_KEY_ID,
    ALIYUN_SMS_ACCESS_KEY_SECRET: process.env.ALIYUN_SMS_ACCESS_KEY_SECRET,
    ALIYUN_SMS_SIGN_NAME: process.env.ALIYUN_SMS_SIGN_NAME,
    ALIYUN_SMS_TEMPLATE_CODE: process.env.ALIYUN_SMS_TEMPLATE_CODE,
  },
}

export default nextConfig
