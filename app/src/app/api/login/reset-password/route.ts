import { NextResponse } from 'next/server';
import { SmsService } from '@/lib/sms';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// 声明全局类型
declare global {
  var resetPasswordCodes: {
    [key: string]: {
      code: string;
      expiresAt: number;
      retries: number;
    };
  };
  var userPasswords: {
    [key: string]: string;
  };
}

// 发送重置密码验证码
export async function POST(request: Request) {
  try {
    const { phone } = await request.json();

    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      return NextResponse.json({ error: '请输入正确的手机号码' }, { status: 400 });
    }

    // 检查是否存在未过期的验证码
    const existingCode = global.resetPasswordCodes?.[phone];
    if (existingCode && Date.now() < existingCode.expiresAt) {
      const remainingTime = Math.ceil((existingCode.expiresAt - Date.now()) / 1000);
      return NextResponse.json({ 
        error: `请等待${remainingTime}秒后再试` 
      }, { status: 429 });
    }

    // 生成验证码
    const code = SmsService.generateVerificationCode();
    
    // 初始化短信服务
    const smsService = new SmsService();

    // 发送验证码
    const success = await smsService.sendVerificationCode(phone, code);

    if (!success) {
      return NextResponse.json({ error: '验证码发送失败' }, { status: 500 });
    }

    // 存储验证码到内存中
    global.resetPasswordCodes = global.resetPasswordCodes || {};
    global.resetPasswordCodes[phone] = {
      code,
      expiresAt: Date.now() + 5 * 60 * 1000, // 5分钟后过期
      retries: 0 // 重试次数
    };

    return NextResponse.json({ message: '验证码已发送' });
  } catch (error) {
    console.error('发送重置密码验证码错误:', error);
    return NextResponse.json({ error: '发送验证码失败' }, { status: 500 });
  }
}

// 重置密码
export async function PUT(request: Request) {
  try {
    const { phone, newPassword } = await request.json();

    if (!phone || !newPassword) {
      return NextResponse.json({ error: '手机号和新密码不能为空' }, { status: 400 });
    }

    // 验证密码强度
    if (newPassword.length < 6) {
      return NextResponse.json({ error: '密码长度不能小于6位' }, { status: 400 });
    }

    // 更新内存中的密码
    global.userPasswords = global.userPasswords || {};
    global.userPasswords[phone] = newPassword;

    return NextResponse.json({ 
      message: '密码重置成功',
      redirectUrl: '/admin/password-login'
    });
  } catch (error) {
    console.error('重置密码错误:', error);
    return NextResponse.json({ error: '重置密码失败' }, { status: 500 });
  }
} 