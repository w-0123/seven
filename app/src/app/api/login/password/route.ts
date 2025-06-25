import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(request: Request) {
  try {
    const { phone, password } = await request.json();

    // 基本验证
    if (!phone || !password) {
      return NextResponse.json({ error: '手机号和密码不能为空' }, { status: 400 });
    }

    // 手机号格式验证
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return NextResponse.json({ error: '无效的手机号码' }, { status: 400 });
    }

    // 新增：读取全局 userPasswords
    global.userPasswords = global.userPasswords || {};
    const savedPassword = global.userPasswords[phone];

    // 如果有重置过密码，优先用新密码校验
    if (savedPassword) {
      if (password !== savedPassword) {
        return NextResponse.json({ error: '密码错误' }, { status: 401 });
      }
    } else {
      // 没有重置过密码，仍然只认 123456
      if (password !== '123456') {
        return NextResponse.json({ error: '密码错误' }, { status: 401 });
      }
    }

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
      accessToken,
      refreshToken,
      user: {
        phone,
        role: 'user'
      }
    });

  } catch (error) {
    return NextResponse.json({ error: '登录失败，请稍后重试' }, { status: 500 });
  }
} 