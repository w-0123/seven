'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { IoChevronBack, IoCall, IoLockClosed, IoEye, IoEyeOff } from 'react-icons/io5';
import { useRouter, useSearchParams } from 'next/navigation';
import Cookies from 'js-cookie';

// 输入框组件
interface InputFieldProps {
  icon: React.ReactNode;
  type: string;
  placeholder: string;
  value: string;
  name: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  showPasswordToggle?: boolean;
  onTogglePassword?: () => void;
}

const InputField: React.FC<InputFieldProps> = ({ 
  icon, 
  type, 
  placeholder, 
  value, 
  name,
  onChange,
  showPasswordToggle = false,
  onTogglePassword
}) => {
  return (
    <div className="flex items-center w-full h-14 px-4 border-b border-gray-200">
      <div className="text-gray-400 text-lg mr-3">
        {icon}
      </div>
      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="flex-1 h-full outline-none placeholder:text-gray-300 text-gray-700 text-base"
      />
      {showPasswordToggle && (
        <button 
          type="button" 
          className="text-gray-400 text-xl ml-2"
          onClick={onTogglePassword}
        >
          {type === 'password' ? <IoEyeOff /> : <IoEye />}
        </button>
      )}
    </div>
  );
};

// 密码登录页面主组件
const PasswordLoginPage = () => {
  const [formData, setFormData] = useState({
    phoneNumber: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  // 检查是否是从重置密码页面跳转过来的
  useEffect(() => {
    const fromReset = searchParams.get('fromReset');
    const phone = searchParams.get('phone');
    const newPassword = searchParams.get('newPassword');
    
    if (fromReset === 'true' && phone && newPassword) {
      setFormData({
        phoneNumber: phone,
        password: newPassword
      });
      setError('密码已重置，请点击登录');
    }
  }, [searchParams]);

  const isFormValid = formData.phoneNumber.trim() !== '' && formData.password.trim() !== '';

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  }, [error]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isFormValid) {
      setError('请填写手机号和密码');
      return;
    }
    
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(formData.phoneNumber)) {
      setError('请输入有效的手机号码');
      return;
    }
    
    if (formData.password.length < 6) {
      setError('密码长度至少为6位');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/login/password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: formData.phoneNumber,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // 保存token到cookie
        Cookies.set('access_token', data.accessToken, { expires: 1/96 }); // 15分钟
        Cookies.set('refresh_token', data.refreshToken, { expires: 7 }); // 7天
        
        // 保存用户信息
        localStorage.setItem('user', JSON.stringify(data.user));

        router.push('/admin/noLogin');
      } else {
        setError(data.error || '登录失败');
      }
    } catch (err) {
      setError('登录失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, isFormValid, router]);

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  // 处理返回
  const handleBack = () => {
    router.back();
  };

  return (
    <div className="min-h-screen bg-white">
      {/* 标题栏 */}
      <div className="pt-3">
        <button onClick={handleBack} className="block px-3">
          <IoChevronBack className="text-xl text-gray-700" />
        </button>
        <h1 className="mt-2 px-3 text-2xl font-semibold text-black">密码登录</h1>
      </div>

      <form onSubmit={handleSubmit} className="px-4 mt-6">
        {/* 手机号输入框 */}
        <div className="mb-6">
          <div className="flex items-center border-b border-gray-200">
            <span className="text-[#fa8c16] text-sm mr-1">+61</span>
            <input
              name="phoneNumber"
              type="tel"
              value={formData.phoneNumber}
              onChange={handleInputChange}
              placeholder="请输入手机号码"
              className="flex-1 h-12 outline-none text-base text-gray-700 placeholder:text-gray-300"
              maxLength={11}
            />
          </div>
        </div>
        
        {/* 密码输入框 */}
        <div className="mb-6">
          <div className="flex items-center border-b border-gray-200">
            <input
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleInputChange}
              placeholder="请输入密码"
              className="flex-1 h-12 outline-none text-base text-gray-700 placeholder:text-gray-300"
            />
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="text-gray-400 text-xl ml-2"
            >
              {showPassword ? <IoEyeOff /> : <IoEye />}
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
          disabled={isSubmitting || !isFormValid}
          className={`w-full h-11 rounded-full text-base font-normal ${
            isSubmitting || !isFormValid
              ? 'bg-gray-200 text-gray-400'
              : 'bg-[#1677ff] text-white'
          }`}
        >
          {isSubmitting ? '登录中...' : '登录'}
        </button>
        
        {/* 底部链接 */}
        <div className="flex justify-between mt-5">
          <Link href="/admin/login" className="text-sm text-gray-700">
            验证码登录
          </Link>
          <Link href="/admin/forgot-password" className="text-sm text-gray-500 hover:text-blue-500 transition-colors">
            忘记密码?
          </Link>
        </div>
      </form>
    </div>
  );
};

export default PasswordLoginPage;