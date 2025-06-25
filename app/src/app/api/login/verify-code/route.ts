import { NextResponse } from 'next/server';
import { SmsService } from '@/lib/sms';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// 声明全局类型
declare global {
  var verificationCodes: {
    [key: string]: {
      code: string;
      expiresAt: number;
      retries: number;
    };
  };
}

// 发送验证码
export async function POST(request: Request) {
  try {
    const { phone } = await request.json();

    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      return NextResponse.json({ error: '请输入正确的手机号码' }, { status: 400 });
    }

    // 检查是否存在未过期的验证码
    const existingCode = global.verificationCodes?.[phone];
    if (existingCode && Date.now() < existingCode.expiresAt) {
      const remainingTime = Math.ceil((existingCode.expiresAt - Date.now()) / 1000);
      return NextResponse.json({ 
        error: `请等待${remainingTime}秒后再试` 
      }, { status: 429 });
    }

    // 生成6位验证码
    const code = SmsService.generateVerificationCode();
    
    try {
      // 初始化短信服务
      const smsService = new SmsService();

      // 设置超时时间
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('短信服务连接超时')), 5000);
      });

      // 发送短信，带超时控制
      const sendSmsPromise = smsService.sendVerificationCode(phone, code);
      const success = await Promise.race([sendSmsPromise, timeoutPromise]);

      if (!success) {
        return NextResponse.json({ error: '验证码发送失败，请稍后重试' }, { status: 500 });
      }

      // 存储验证码到内存中
      global.verificationCodes = global.verificationCodes || {};
      global.verificationCodes[phone] = {
        code,
        expiresAt: Date.now() + 5 * 60 * 1000, // 5分钟后过期
        retries: 0 // 重试次数
      };

      return NextResponse.json({ message: '验证码已发送' });
    } catch (error: any) {
      console.error('发送验证码错误:', error);
      
      // 处理不同类型的错误
      if (error.message.includes('timeout') || error.message.includes('ConnectTimeout')) {
        return NextResponse.json({ 
          error: '短信服务连接超时，请检查网络后重试' 
        }, { status: 504 });
      }
      
      if (error.message.includes('InvalidAccessKeyId') || error.message.includes('SignatureDoesNotMatch')) {
        return NextResponse.json({ 
          error: '短信服务配置错误，请联系管理员' 
        }, { status: 500 });
      }

      return NextResponse.json({ 
        error: '短信服务暂时不可用，请稍后重试' 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('发送验证码错误:', error);
    return NextResponse.json({ error: '发送验证码失败' }, { status: 500 });
  }
}

// 验证码登录
export async function PUT(request: Request) {
  try {
    const { phone, code } = await request.json();

    if (!phone || !code) {
      return NextResponse.json({ error: '手机号和验证码不能为空' }, { status: 400 });
    }

    // 从内存中验证验证码
    const storedData = global.verificationCodes?.[phone];
    
    // 验证码不存在
    if (!storedData) {
      return NextResponse.json({ error: '请先获取验证码' }, { status: 400 });
    }

    // 验证码已过期
    if (Date.now() > storedData.expiresAt) {
      delete global.verificationCodes[phone];
      return NextResponse.json({ error: '验证码已过期，请重新获取' }, { status: 400 });
    }

    // 验证码错误，增加重试次数
    if (storedData.code !== code) {
      storedData.retries += 1;
      
      // 超过最大重试次数
      if (storedData.retries >= 5) {
        delete global.verificationCodes[phone];
        return NextResponse.json({ error: '验证码错误次数过多，请重新获取' }, { status: 400 });
      }

      return NextResponse.json({ 
        error: `验证码错误，还有${5 - storedData.retries}次机会` 
      }, { status: 400 });
    }

    // 验证成功，删除验证码
    delete global.verificationCodes[phone];

    // 生成访问令牌和刷新令牌
    const accessToken = jwt.sign(
      { phone, role: 'user' },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { phone, role: 'user' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // 返回成功响应
    return NextResponse.json({
      success: true,
      message: '登录成功',
      accessToken,
      refreshToken,
      user: {
        phone,
        role: 'user'
      }
    });
  } catch (error) {
    console.error('登录错误:', error);
    return NextResponse.json({ error: '登录失败' }, { status: 500 });
  }
}