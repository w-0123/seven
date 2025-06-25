"use client";

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; // 导入 useRouter
import './page.css';
import { verifyIdCard } from '@/api'; // 导入新添加的API
import back from '../../../asstes/back.png'

const TruePeoplePage = () => {
  const router = useRouter(); // 初始化 useRouter
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [docNumber, setDocNumber] = useState('');
  const [verificationResult, setVerificationResult] = useState('');
  const [nameError, setNameError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [docNumberError, setDocNumberError] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false); // 控制下拉框的显示/隐藏
  const [selectedDocType, setSelectedDocType] = useState('身份证'); // 选中的证件类型，默认身份证
  const dropdownRef = useRef<HTMLDivElement>(null); // 用于检测点击外部关闭下拉框
  const [verificationResultColor, setVerificationResultColor] = useState('black'); // 新增状态，默认黑色
  const [animateIn, setAnimateIn] = useState(false); // 控制动画的触发

  useEffect(() => {
    // 点击外部关闭下拉框
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);

    // 触发动画
    const timer = setTimeout(() => {
      setAnimateIn(true);
    }, 100); // 100ms 延迟，确保 CSS 初始状态已应用

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      clearTimeout(timer);
    };
  }, [dropdownRef]);

  const handleDocTypeClick = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleSelectDocType = (type: string) => {
    setSelectedDocType(type);
    setIsDropdownOpen(false);
  };

  const handleSubmit = async () => {
    // 清空之前的错误信息
    setNameError('');
    setPhoneError('');
    setDocNumberError('');
    setVerificationResult('');
    setVerificationResultColor('black'); // 重置颜色为默认黑色

    // 表单校验
    if (!name.trim()) {
      setNameError('姓名不能为空！');
      return;
    }

    if (!phone.trim()) {
      setPhoneError('手机号不能为空！');
      return;
    }

    // 手机号11位校验
    const phoneRegex = /^\d{11}$/;
    if (!phoneRegex.test(phone)) {
      setPhoneError('手机号必须是11位数字！');
      return;
    }

    if (!docNumber.trim()) {
      setDocNumberError('证件号不能为空！');
      return;
    }

    // 身份证号18位校验
    const idCardRegex = /^\d{17}[\dX]$/i;
    if (!idCardRegex.test(docNumber)) {
      setDocNumberError('身份证输入不规范，请重新输入');
      return;
    }

    setVerificationResult('正在验证...');
    try {
      const response = await verifyIdCard(name, docNumber);
      console.log('API response (before null check):', response);

      if (response === undefined || response === null) {
        setVerificationResult('验证失败：后端服务未返回有效响应。');
        setVerificationResultColor('red'); // 失败时设为红色
        return; // 如果 response 为 undefined 或 null，则提前退出
      }

      // 安全地访问 BizCode 和 Message 属性
      const bizCode = response.BizCode;
      const message = response.Message;

      if (bizCode === '1') {
        setVerificationResult('身份验证成功！');
        setVerificationResultColor('black'); // 成功时设为黑色
        router.push(`/admin/trueFace?phone=${phone}`); // 添加页面跳转逻辑并传递手机号
      } else if (bizCode === '2') {
        setVerificationResult('姓名与身份证号不匹配，验证失败。');
        setVerificationResultColor('red'); // 失败时设为红色
      } else {
        // 其他错误或未预期响应
        setVerificationResult('身份校验失败，请重新验证。'); // 统一错误提示
        setVerificationResultColor('red'); // 失败时设为红色
      }
    } catch (error: any) {
        // 捕获 API 请求过程中发生的错误，统一错误提示
        setVerificationResult('身份校验失败，请重新验证。');
        setVerificationResultColor('red'); // 失败时设为红色
        // console.error('Verification error:', error); // 移除或注释掉控制台输出
    }
  };

  return (
    <div className="container">
      <header className={`header ${animateIn ? 'fade-in-animation header-animation' : ''}`}>
        <Link href="/" className="back-arrow">
          <img src={back.src} alt="" width={21}/>
        </Link>
        <h1 className="title">实名认证</h1>
      </header>
      <section className={`info-section ${animateIn ? 'fade-in-animation info-section-animation' : ''}`}>
        <p className="main-info-text">以下信息用于核实您的真实身份</p>
        <p className="sub-info-text">实名认证可能会影响到您的叫车服务，请认真填写</p>
      </section>
      <main className={`form-section ${animateIn ? 'fade-in-animation form-section-animation' : ''}`}>
        <div className="form-group">
          <label htmlFor="name" className="label">姓名:</label>
          <div>
            <input
              type="text"
              id="name"
              placeholder="请输入您的真实姓名"
              className="input-field"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            {nameError && <span className="error-message">{nameError}</span>}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="phone" className="label">手机号:</label>
          <div>
            <input
              type="tel"
              id="phone"
              placeholder="请输入手机号码"
              className="input-field"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            {phoneError && <span className="error-message">{phoneError}</span>}
          </div>
        </div>

        <div className="form-group document-type-group" ref={dropdownRef} style={{width:'375px'}}>
          <label htmlFor="docType" className="label">证件类型:</label>
          <div className="document-type-input" onClick={handleDocTypeClick}>
            <span className='nameCard'>{selectedDocType}</span>
            <span className="arrow">&gt;</span>
          </div>
          <ul className={`dropdown-menu ${isDropdownOpen ? 'show' : ''}`}>
            <li className='card1' onClick={() => handleSelectDocType('身份证')}>身份证</li>
            <li className='card1' onClick={() => handleSelectDocType('护照')}>护照</li>
            <li className='card1' onClick={() => handleSelectDocType('银行卡')}>银行卡</li>
          </ul>
        </div>

        <div className="form-group">
          <label htmlFor="docNumber" className="label">证件号:</label>
          <div>
            <input
              type="text"
              id="docNumber"
              placeholder="请输入证件号码"
              className="input-field"
              value={docNumber}
              onChange={(e) => setDocNumber(e.target.value)}
            />
            {docNumberError && <span className="error-message">{docNumberError}</span>}
          </div>
        </div>

        <button className={`next-step-button ${animateIn ? 'fade-in-animation button-animation' : ''}`} onClick={handleSubmit}>下一步</button>
        {verificationResult && <p className="verification-result" style={{ color: verificationResultColor }}>{verificationResult}</p>}
      </main>
    </div>
  );
};

export default TruePeoplePage;
