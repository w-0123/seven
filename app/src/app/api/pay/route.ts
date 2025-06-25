const { AlipaySdk } = require("alipay-sdk");
import { NextResponse } from 'next/server'; 
const alipaySdk = new AlipaySdk({
  appId: "9021000149680133",
  privateKey:
    "MIIEowIBAAKCAQEAug2qeZcdLEx8IFvczJph5ecxWfMxxQS2Ml8JrE/ejHCVxEcBWirO6Uwca7oflt8ofJu9D2Xr9csELfRy0pquO3JL1G43dH1sVO306413H3381KAXMQucrrOdJOmRbnJtuwDluBJlZUmGwx4B1m6PS7a0LRgvcSLJiKWyPhqbKbrDCUwJHHoLGonPEaPHS31/GcUFPE1X8YqJNGkNZJvw4HD5VnZk9GjWh0HSSyiKeovBZ9rfhIzyjEIN8Acd8D8Ssk2pIKLQamMRhh/KKaBJEVwgarnwmAABdRWTp9Q5JLsQZ0IBfIYuiYbQLoB1Op/Jx2Yu8dd2YNhGyB4z/D+StwIDAQABAoIBAF3B+UCg2EC0onCkGla5DdCPex07Ir+IKlCj9/nvndTj/3UT2yiXHgIPKttWxgh/mKWCzflugUQx9H88Coj7DgZDCNeaWzPG6Mq7x4rUlU03biuwKT+7/E9FkFFDqtgfrhBo2VqzWol6TgERpBdtS6T6Az4eS/oVb73+0h3dxod2CzTJ0xQZdCaJCnr5rKr/CKQF+yw1oa0codvNymVHYfxOcvUSfmhqsL38HDg7zWAYs+A+RepBjIGDVVxzGhijwngliu9d5ja3zW2K39Gr5YFmaUoREVRCwXX3C9aXfNcGXbmQMksUoOPIcW7ryAfj81qM6EssV69vg5TUsxE3P9ECgYEA8U9KSdRpobsLBw43m9tb1JWTcux+8yiqzhaofwilRFKAeSjgwlHOWgDWcYM/NlNUk9E0VckipypcdXofj7MEIx/s71kc3b+6wLEF3L8CGuSwUcC/es8UgDeusHNJp0Z/TAf+nGgxmDKVWM6WOa07BH0jKKK+sqZS+h/nh+zkyiUCgYEAxWE6oOV2F+uxzyEMJbJcxB55Wzpz05AZjKKRjLUnV+0jvl0ywvec8UHIBaLvz94Oe6tgdqjM4yHm6BHgP9+zvdrGxe04TAVRi3BIiMBtyV1GAniZRuDPLuH2LsT01NJBf1KVHKfBlrFodRnFMFCzJNSvff2zjgM8VbFPxavmnKsCgYA4nIByJ6oMbkQdCKHVJ7Y4fkrUSFVUGHNR3BD1lIKpL63CPuvTyrtddBrbEI5w4UXTU94yTfiaPR7p1Je476eF0gSU9lQGVeerMxyL+Ce3RXV0CIMjfZdyqR2LedCKtMhCfxGlgfA4o41UA0tNBq301KK98shIQyruUTPROKtIHQKBgQCUPlBQY8bsdGNZlBKRhYLS8ahn8mDn9wSZccgrjCt+iGceJNVpRZwkPynBwfynfLoX/EE5HdK0jNPmXPa2Qoe3AkfkhCSSRDRYq/5uZ0iNwnZAiN9mMpapOaEyw063QStcO2Qu33gwfBJeUPqfLR0/flZIJHHlKVz5Z3DooBFWfQKBgAL/rsQCOZdMDGTvPSIHVUrHIXptNayUY+3Za10psO+evFPRS99MUw7rNAzK8xGyldcgpB6Wpdr8d7echZguGShPInFzpXxZe8yxtwSyU30FaUJ7jt30DXiCsTHn+5tgzouROIuxUwOGLArmZ69l09jTQCo8KQff8io1e9zkviLf",
  alipayPublicKey:
    "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAiLDs1AB2nqpzZDNOWLQLNk3L8Fh2CnvGFULO8J4zD19/Oe1yUT7BBP4gyO75SDo67uL4aIsVK5j421FuXfd89YcNW2xGJKyHZ6gUsjfYF+5p6Y/NVHwVJJPyigL/Yy7Eu6DXpmfV0bJRD7Nl0fdiYYxKRjtNEC3D7HddJy8YEOedzRc5klzhgEaOI2g9n8cBLGYN+fxd8CA64WTufvOdAPPbXy3O6+nP15AL+0myxB1ys1ukXOMfhkwhCZpblS6Rp4hmxtbyumNz9ziiywCMvPi+53jOuLpIHDskFHATeUaRz0HDimE4Bc2oyld1e11DseCCDg6Aso+U0k1auv0oXwIDAQAB",
  gateway: "https://openapi-sandbox.dl.alipaydev.com/gateway.do"
})
export async function POST(request: Request) {
  try {
    // 正确解析请求体
    const { out_trade_no, total_amount, subject } = await request.json();

    // 参数验证
    if (!out_trade_no || !total_amount || !subject) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      );
    }

    // 调用支付宝接口
    const html = await alipaySdk.pageExec('alipay.trade.wap.pay', {
      bizContent: {
        out_trade_no,
        total_amount,
        subject,
        product_code: 'QUICK_WAP_WAY',
      },
      return_url: 'http://localhost:3000/admin/waitOrder',
      notify_url: 'http://localhost:3000/api/notify',
    });

    // 正确返回HTML响应
    return new Response(html, {
      headers: { 'Content-Type': 'text/html' },
    });

  } catch (error:any) {
    console.error('支付宝支付请求失败:', error);
    return NextResponse.json(
      { error: '支付请求失败', details: error.message },
      { status: 500 }
    );
  }
}