'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { IoChevronBack, IoEyeOutline, IoEyeOffOutline, IoLockClosedOutline } from 'react-icons/io5';

interface ForgotPasswordFormData {
  phoneNumber: string;
  verificationCode: string;
  newPassword: string;
}

const ForgotPasswordPage = () => {
  const router = useRouter();
  const [formData, setFormData] = useState<ForgotPasswordFormData>({
    phoneNumber: '',
    verificationCode: '',
    newPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  // 验证密码格式
  const isValidPassword = (password: string) => {
    // 至少包含字母、数字、符号中的两种元素
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    const typeCount = [hasLetter, hasNumber, hasSymbol].filter(Boolean).length;
    return password.length >= 6 && typeCount >= 2;
  };

  // 发送验证码
  const handleGetVerificationCode = async () => {
    if (!isValidPhone(formData.phoneNumber)) {
      setError('请输入正确的手机号码');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/login/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: formData.phoneNumber })
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

  // 提交表单
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 表单验证
    if (!isValidPhone(formData.phoneNumber)) {
      setError('请输入正确的手机号码');
      return;
    }
    if (!formData.verificationCode || formData.verificationCode.length !== 6) {
      setError('请输入6位验证码');
      return;
    }
    if (!formData.newPassword) {
      setError('请输入新密码');
      return;
    }
    if (!isValidPassword(formData.newPassword)) {
      setError('密码必须至少包含字母、数字、符号中的两种元素，且长度不少于6位');
      return;
    }

    setLoading(true);
    try {
      // 先验证验证码
      const verifyResponse = await fetch('/api/login/verify-code', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: formData.phoneNumber,
          code: formData.verificationCode
        })
      });

      const verifyData = await verifyResponse.json();

      if (!verifyResponse.ok) {
        setError(verifyData.error || '验证码验证失败');
        return;
      }

      // 验证码验证成功后，调用重置密码接口
      const resetResponse = await fetch('/api/login/reset-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: formData.phoneNumber,
          newPassword: formData.newPassword
        })
      });

      const resetData = await resetResponse.json();

      if (resetResponse.ok) {
        // 清除所有状态
        setFormData({
          phoneNumber: '',
          verificationCode: '',
          newPassword: '',
        });
        setError('');
        // 修改密码成功，跳转到登录页，并传递手机号和新密码
        router.replace(`/admin/password-login?fromReset=true&phone=${formData.phoneNumber}&newPassword=${formData.newPassword}`);
      } else {
        setError(resetData.error || '修改密码失败');
      }
    } catch (error) {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="pt-3 px-4">
        <button onClick={() => router.back()}>
          <IoChevronBack className="text-xl text-gray-700" />
        </button>
        <h1 className="mt-1 text-2xl font-semibold text-gray-900">忘记密码</h1>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="px-4 mt-6">
        {/* Phone Input */}
        <div className="mb-4">
          <div className="flex items-center border-b border-gray-200 h-12">
          <span className="text-[#fa8c16] text-sm mr-1">+61</span>
            <input
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 11);
                setFormData({ ...formData, phoneNumber: value });
                setError('');
              }}
              placeholder="请输入手机号"
              className="flex-1 ml-2 outline-none text-base text-gray-700"
            />
          </div>
        </div>

        {/* Verification Code Input */}
        <div className="mb-4">
          <div className="flex items-center border-b border-gray-200 h-12">
            <div className="flex-1 flex items-center">
              <IoLockClosedOutline className="text-xl text-gray-400" />
              <input
                type="text"
                value={formData.verificationCode}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setFormData({ ...formData, verificationCode: value });
                  setError('');
                }}
                placeholder="请输入验证码"
                className="flex-1 ml-2 outline-none text-base text-gray-700"
              />
            </div>
            <button
              type="button"
              onClick={handleGetVerificationCode}
              disabled={!isValidPhone(formData.phoneNumber) || countdown > 0 || loading}
              className={`text-base ${
                !isValidPhone(formData.phoneNumber) || countdown > 0 || loading
                  ? 'text-gray-300'
                  : 'text-[#1677ff]'
              }`}
            >
              {countdown > 0 ? `${countdown}秒后重发` : '获取验证码'}
            </button>
          </div>
        </div>

        {/* New Password Input */}
        <div className="mb-2">
          <div className="flex items-center border-b border-gray-200 h-12">
            <div className="flex-1 flex items-center">
              <IoLockClosedOutline className="text-xl text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                value={formData.newPassword}
                onChange={(e) => {
                  setFormData({ ...formData, newPassword: e.target.value });
                  setError('');
                }}
                placeholder="请输入新密码"
                className="flex-1 ml-2 outline-none text-base text-gray-700"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-gray-400"
              >
                {showPassword ? <IoEyeOffOutline size={20} /> : <IoEyeOutline size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* Password Hint */}
        <p className="text-xs text-gray-400 mb-6">
          至少包含字母、字符、符号中的两种元素
        </p>

        {/* Error Message */}
        {error && (
          <div className="mb-4 text-red-500 text-sm">
            {error}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !isValidPhone(formData.phoneNumber) || !formData.verificationCode || !formData.newPassword}
          className={`w-full h-11 rounded-lg text-base font-normal ${
            loading || !isValidPhone(formData.phoneNumber) || !formData.verificationCode || !formData.newPassword
              ? 'bg-gray-200 text-gray-500'
              : 'bg-[#1677ff] text-white'
          }`}
        >
          {loading ? '处理中...' : '确认'}
        </button>
      </form>

      {/* Terms */}
      <div className="fixed bottom-4 left-0 right-0 text-center">
        <p className="text-xs text-gray-400">
          登录即同意
          <a href="/terms" className="text-[#1677ff]">《用户服务协议》</a>
          和
          <a href="/privacy" className="text-[#1677ff]">《隐私政策》</a>
        </p>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;



