'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { IoChevronBack } from 'react-icons/io5';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

const LoginPage = () => {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  // 处理返回
  const handleBack = () => {
    router.back();
  };

  // 处理倒计时
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    }
    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [countdown]);

  // 验证手机号格式
  const isValidPhone = (phone: string) => {
    return /^1[3-9]\d{9}$/.test(phone);
  };

  // 处理手机号输入
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 11);
    setPhone(value);
    setError('');
  };

  // 发送验证码
  const handleGetVerificationCode = async () => {
    if (!isValidPhone(phone)) {
      setError('请输入正确的手机号码');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/login/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });

      const data = await response.json();

      if (response.ok) {
        setCountdown(60);
        setError('');
      } else {
        setError(data.error || '发送验证码失败');
      }
    } catch (error) {
      setError('发送验证码失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 处理登录
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidPhone(phone)) {
      setError('请输入正确的手机号码');
      return;
    }
    if (!code || code.length !== 6) {
      setError('请输入6位验证码');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/login/verify-code', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code })
      });

      const data = await response.json();

      if (response.ok) {
        // 保存token到cookie
        Cookies.set('access_token', data.accessToken, { expires: 1 / 96 }); // 15分钟
        Cookies.set('refresh_token', data.refreshToken, { expires: 7 }); // 7天

        // 保存用户信息
        localStorage.setItem('user', JSON.stringify(data.user));

        // 跳转到主页
        router.push('/admin/waitOrder');
      } else {
        setError(data.error || '验证码错误');
      }
    } catch (error) {
      setError('登录失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* 标题栏 */}
      <div className="pt-3">
        <button onClick={handleBack} className="block px-3">
          <IoChevronBack className="text-xl text-gray-700" />
        </button>
        <h1 className="mt-2 px-3 text-2xl font-semibold text-black">验证码登录</h1>
      </div>

      <form onSubmit={handleSubmit} className="px-4 mt-6">
        {/* 手机号输入框 */}
        <div className="mb-6">
          <div className="flex items-center border-b border-gray-200">
            <span className="text-[#fa8c16] text-sm mr-1">+61</span>
            <input
              type="tel"
              value={phone}
              onChange={handlePhoneChange}
              placeholder="请输入手机号码"
              className="flex-1 h-12 outline-none text-base text-gray-700 placeholder:text-gray-300"
              maxLength={11}
            />
          </div>
        </div>

        {/* 验证码输入框 */}
        <div className="mb-6">
          <div className="flex items-center border-b border-gray-200">
            <input
              type="text"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                setError('');
              }}
              placeholder="请输入验证码"
              className="flex-1 h-12 outline-none text-base text-gray-700 placeholder:text-gray-300"
              maxLength={6}
            />
            <button
              type="button"
              onClick={handleGetVerificationCode}
              disabled={!isValidPhone(phone) || countdown > 0 || loading}
              className={`text-sm ml-3 ${!isValidPhone(phone) || countdown > 0 || loading
                ? 'text-gray-300'
                : 'text-[#1677ff]'
                }`}
            >
              {countdown > 0 ? `${countdown}秒后重发` : '获取验证码'}
            </button>
          </div>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="mb-4 text-red-500 text-sm flex items-center">
            <div className="w-4 h-4 rounded-full bg-red-100 text-red-500 flex items-center justify-center mr-2">
              !
            </div>
            {error}
          </div>
        )}

        {/* 登录按钮 */}
        <button
          type="submit"
          disabled={loading || !isValidPhone(phone) || !code || code.length !== 6}
          className={`w-full h-11 rounded-full text-base font-normal ${loading || !isValidPhone(phone) || !code || code.length !== 6
            ? 'bg-gray-200 text-gray-400'
            : 'bg-[#1677ff] text-white'
            }`}
          onClick={() => {
            router.push('/admin/waitOrder')
          }}
        >
          {loading ? '登录中...' : '登录'}
        </button>

        {/* 底部链接 */}
        <div className="flex justify-between mt-5">
          <Link href="/admin/password-login" className="text-sm text-gray-700">
            密码登录
          </Link>
          <Link href="/admin/forgot-password" className="text-sm text-gray-500 hover:text-blue-500 transition-colors">
            忘记密码?
          </Link>
        </div>
        <div className="fixed bottom-[1.5rem] left-0 right-0 text-center px-[1rem]">
          <p className="text-[0.75rem] text-gray-400">
            登录即同意
            <Link href="/terms" className="text-blue-500">《用户服务协议》</Link>
            和
            <Link href="/privacy" className="text-blue-500">《隐私政策》</Link>
          </p>
        </div>
      </form>
    </div>
  );
};

export default LoginPage;