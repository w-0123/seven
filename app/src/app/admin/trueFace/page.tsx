"use client";

import React, { useRef, useState, useEffect } from 'react';
import './page.css'; // 导入 CSS 文件
import { useSearchParams, useRouter } from 'next/navigation'; // 添加 useRouter 导入
import back from '../../../asstes/back.png'

const TrueFacePage = () => {
  const router = useRouter(); // 初始化 useRouter
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [message, setMessage] = useState<string>('请进行人脸识别以核验身份');
  const searchParams = useSearchParams();
  const initialPhoneNumber = searchParams.get('phone') || '***********'; // 从URL获取手机号，或使用默认值
  const [phoneNumber, setPhoneNumber] = useState<string>(initialPhoneNumber); // 手机号是动态获取的
  const [animateIn, setAnimateIn] = useState(false); // 控制动画的触发
  const [isDetecting, setIsDetecting] = useState(false);
  const [headPose, setHeadPose] = useState<string | null>(null);
  const [detectionProgress, setDetectionProgress] = useState(0);
  const [detectedSteps, setDetectedSteps] = useState<string[]>([]);
  const [isBlinking, setIsBlinking] = useState(false);
  const [lastEyeOpen, setLastEyeOpen] = useState(true);
  const [blinkDetectionInterval, setBlinkDetectionInterval] = useState<NodeJS.Timeout | null>(null);
  const [isVerifying, setIsVerifying] = useState(false); // 添加验证状态
  const [isRetry, setIsRetry] = useState(false); // 添加重试状态
  const [isBlinkDetected, setIsBlinkDetected] = useState(false); // 添加眨眼检测成功状态
  const REQUIRED_STEPS = ['正面', '左转', '右转'];
  const finishedRef = useRef(false);
  const lastBase64ForRecognition = useRef<string | null>(null);
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null); // 新增：用于保存头部姿态检测的setInterval ID
  const blinkTimeoutRef = useRef<NodeJS.Timeout | null>(null); // 添加blinkTimeout的ref
  
  // 新增：张嘴检测相关状态
  const [isMouthOpening, setIsMouthOpening] = useState(false);
  const [mouthOpenValue, setMouthOpenValue] = useState(0);
  const mouthDetectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const mouthTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isMouthDetected, setIsMouthDetected] = useState(false);

  // 辅助函数：格式化手机号，隐藏中间四位
  const formatPhoneNumber = (num: string) => {
    if (num.length === 11) {
      return `${num.substring(0, 3)}****${num.substring(7, 11)}`;
    } else {
      return num; // 如果不是11位，则不进行格式化
    }
  };

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }

    // 触发动画
    const timer = setTimeout(() => {
      setAnimateIn(true);
    }, 100); // 100ms 延迟，确保 CSS 初始状态已应用

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      clearTimeout(timer); // 清除定时器
      if (blinkDetectionInterval) {
        clearInterval(blinkDetectionInterval);
      }
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
        detectionIntervalRef.current = null;
      }
      // 新增：清除张嘴检测相关定时器
      if (mouthDetectionIntervalRef.current) {
        clearInterval(mouthDetectionIntervalRef.current);
        mouthDetectionIntervalRef.current = null;
      }
      if (mouthTimeoutRef.current) {
        clearTimeout(mouthTimeoutRef.current);
        mouthTimeoutRef.current = null;
      }
    };
  }, [stream]);

  useEffect(() => {
    if (REQUIRED_STEPS.every(step => detectedSteps.includes(step)) && isDetecting) {
      setMessage('摇头检测完成，请稍候...');
      finishedRef.current = true;
      // 立即清除头部姿态检测的interval，防止后续更新
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
        detectionIntervalRef.current = null;
      }
      // 添加1秒延迟，让用户能看到检测结果
      setTimeout(() => {
        setIsDetecting(false); // 在延迟结束后才设置isDetecting为false
        setHeadPose(null);
        setMessage('开始张嘴检测...');
        // 新增：改为启动张嘴检测而不是直接启动眨眼检测
        startMouthOpenDetection();
      }, 1000);
    }
  }, [detectedSteps, isDetecting]);

  const startVerification = async () => {
    setMessage('正在开启摄像头...');
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(mediaStream);
      setMessage('摄像头已开启，请正脸对准框内');

      if (videoRef.current) {
        videoRef.current.play(); // 确保视频播放
      }
    } catch (err) {
      console.error('无法访问摄像头:', err);
      setMessage('无法访问摄像头，请检查权限');
    }
  };

  const handleHeadPoseStep = (pose: string) => {
    setDetectedSteps(prev => {
      if (
        REQUIRED_STEPS.includes(pose) &&
        !prev.includes(pose) &&
        (prev.length === 0 || REQUIRED_STEPS[prev.length] === pose)
      ) {
        const newSteps = [...prev, pose];
        setDetectionProgress(Math.floor((newSteps.length) / REQUIRED_STEPS.length * 100));
        return newSteps;
      }
      return prev;
    });
  };

  // 新增：张嘴检测函数
  const startMouthOpenDetection = async () => {
    if (!stream) return;
    
    // 确保清理之前的定时器
    if (mouthTimeoutRef.current) {
      clearTimeout(mouthTimeoutRef.current);
      mouthTimeoutRef.current = null;
    }
    
    setIsMouthOpening(true);
    setMessage('请张大嘴巴');
    setHeadPose(null);
    setIsMouthDetected(false);
    
    const interval = setInterval(async () => {
      if (videoRef.current && canvasRef.current) {
        const context = canvasRef.current.getContext('2d');
        if (context) {
          canvasRef.current.width = videoRef.current.videoWidth;
          canvasRef.current.height = videoRef.current.videoHeight;
          context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
          const base64Image = canvasRef.current.toDataURL('image/jpeg');
          
          try {
            const response = await fetch('/api/trueFace', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                base64: base64Image.split(',')[1],
                NeedMouthOpenDetection: true
              }),
            });
            const data = await response.json();
            
            if (data.code === 0) {
              // 张嘴检测成功
              clearInterval(interval);
              mouthDetectionIntervalRef.current = null;
              if (mouthTimeoutRef.current) {
                clearTimeout(mouthTimeoutRef.current);
                mouthTimeoutRef.current = null;
              }
              setIsMouthOpening(false);
              setIsMouthDetected(true);
              setMouthOpenValue(data.expressionValue || 0);
              setMessage('张嘴检测成功，准备进行眨眼检测...');
              
              // 短暂延迟后开始眨眼检测
              setTimeout(() => {
                startBlinkDetection();
              }, 1500);
              return;
            } else if (data.code === 1) {
              // 嘴巴未张开足够大
              setMouthOpenValue(data.expressionValue || 0);
              setMessage('请张大嘴巴');
            } else {
              setMessage(data.msg || '检测失败，请重试');
            }
          } catch (error) {
            console.error('张嘴检测错误:', error);
            clearInterval(interval);
            mouthDetectionIntervalRef.current = null;
            if (mouthTimeoutRef.current) {
              clearTimeout(mouthTimeoutRef.current);
              mouthTimeoutRef.current = null;
            }
            setIsMouthOpening(false);
            setMessage('张嘴检测出错，请重试');
            return;
          }
        }
      }
    }, 300);
    
    mouthDetectionIntervalRef.current = interval;
    
    // 添加张嘴检测超时保护
    mouthTimeoutRef.current = setTimeout(() => {
      if (interval) {
        clearInterval(interval);
        mouthDetectionIntervalRef.current = null;
        setIsMouthOpening(false);
        setMessage('张嘴检测超时，请重试');
        setIsVerifying(false);
        setIsRetry(true);
      }
    }, 10000);
  };

  const startBlinkDetection = async () => {
    if (!stream) return;

    // 确保清理之前的定时器
    if (blinkTimeoutRef.current) {
      clearTimeout(blinkTimeoutRef.current);
      blinkTimeoutRef.current = null;
    }

    setIsBlinking(true);
    setMessage('请睁大眼睛，然后快速眨一下');
    setLastEyeOpen(true);
    setHeadPose(null);

    const interval = setInterval(async () => {
      if (videoRef.current && canvasRef.current) {
        const context = canvasRef.current.getContext('2d');
        if (context) {
          canvasRef.current.width = videoRef.current.videoWidth;
          canvasRef.current.height = videoRef.current.videoHeight;
          context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
          const base64Image = canvasRef.current.toDataURL('image/jpeg');

          try {
            const response = await fetch('/api/trueFace', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                base64: base64Image.split(',')[1],
                NeedBlinkDetection: true
              }),
            });
            const data = await response.json();

            if (data.code === 0) {
              // 清理所有定时器
              clearInterval(interval);
              setBlinkDetectionInterval(null);
              if (blinkTimeoutRef.current) {
                clearTimeout(blinkTimeoutRef.current);
                blinkTimeoutRef.current = null;
              }
              setIsBlinking(false);
              setIsBlinkDetected(true); // 设置眨眼检测成功状态
              setMessage('眨眼检测成功，开始识别...');
              startFaceRecognition(base64Image);
              return;
            } else if (data.code === 1) {
              setLastEyeOpen(true);
            } else if (data.code === 2) {
              // 清理所有定时器
              clearInterval(interval);
              setBlinkDetectionInterval(null);
              if (blinkTimeoutRef.current) {
                clearTimeout(blinkTimeoutRef.current);
                blinkTimeoutRef.current = null;
              }
              setIsBlinking(false);
              setMessage('该人员未注册');
              return;
            } else {
              setMessage(data.msg || '检测失败，请重试');
            }
          } catch (error) {
            console.error('眨眼检测错误:', error);
            // 清理所有定时器
            clearInterval(interval);
            setBlinkDetectionInterval(null);
            if (blinkTimeoutRef.current) {
              clearTimeout(blinkTimeoutRef.current);
              blinkTimeoutRef.current = null;
            }
            setIsBlinking(false);
            setMessage('眨眼检测出错，请重试');
            return;
          }
        }
      }
    }, 300);

    setBlinkDetectionInterval(interval);

    // 添加眨眼检测超时保护
    blinkTimeoutRef.current = setTimeout(() => {
      if (interval) {
        clearInterval(interval);
        setBlinkDetectionInterval(null);
        setIsBlinking(false);
        setMessage('眨眼检测超时，请重试');
        setIsVerifying(false);
        setIsRetry(true);
      }
    }, 10000);

    // 清理函数
    return () => {
      if (blinkTimeoutRef.current) {
        clearTimeout(blinkTimeoutRef.current);
        blinkTimeoutRef.current = null;
      }
      if (interval) {
        clearInterval(interval);
      }
    };
  };

  const startHeadPoseDetection = async () => {
    // 重置所有相关状态
    setIsVerifying(true);
    setIsRetry(false);
    setIsDetecting(true);
    setMessage('请依次完成：正面→左转→右转');
    setDetectionProgress(0);
    setHeadPose(null);
    setDetectedSteps([]);
    finishedRef.current = false;
    setIsBlinking(false);
    setLastEyeOpen(true);
    setIsBlinkDetected(false); // 重置眨眼检测成功状态
    // 新增：重置张嘴检测状态
    setIsMouthOpening(false);
    setMouthOpenValue(0);
    setIsMouthDetected(false);

    // 清理之前的定时器
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
    if (blinkDetectionInterval) {
      clearInterval(blinkDetectionInterval);
      setBlinkDetectionInterval(null);
    }
    if (blinkTimeoutRef.current) {
      clearTimeout(blinkTimeoutRef.current);
      blinkTimeoutRef.current = null;
    }
    // 新增：清理张嘴检测定时器
    if (mouthDetectionIntervalRef.current) {
      clearInterval(mouthDetectionIntervalRef.current);
      mouthDetectionIntervalRef.current = null;
    }
    if (mouthTimeoutRef.current) {
      clearTimeout(mouthTimeoutRef.current);
      mouthTimeoutRef.current = null;
    }

    // 如果没有开启摄像头，先开启摄像头
    if (!stream) {
      setMessage('正在开启摄像头...');
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
        setStream(mediaStream);
        setMessage('摄像头已开启，请正脸对准框内');

        if (videoRef.current) {
          videoRef.current.play();
        }

        // 等待摄像头完全启动
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (err) {
        console.error('无法访问摄像头:', err);
        setMessage('无法访问摄像头，请检查权限');
        setIsVerifying(false);
        setIsRetry(true);
        return;
      }
    }

    // 将setInterval的ID保存到ref中
    detectionIntervalRef.current = setInterval(async () => {
      if (videoRef.current && canvasRef.current) {
        const context = canvasRef.current.getContext('2d');
        if (context) {
          canvasRef.current.width = videoRef.current.videoWidth;
          canvasRef.current.height = videoRef.current.videoHeight;
          context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
          const base64Image = canvasRef.current.toDataURL('image/jpeg');
          lastBase64ForRecognition.current = base64Image;

          try {
            const response = await fetch('/api/trueFace', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                base64: base64Image.split(',')[1],
                detectHeadPose: true
              }),
            });
            const data = await response.json();
            console.log('接口返回:', data);

            if (data.code === 0) {
              // 只有在摇头检测未完成时才更新头部姿态信息
              if (!finishedRef.current) {
                setHeadPose(data.headPose);
              }
              handleHeadPoseStep(data.headPose);
            } else {
              setMessage(data.msg || '人脸检测失败，请调整位置');
              setHeadPose(null); // 明确清除头部姿态信息，如果检测失败
              setIsVerifying(false); // 重置验证状态
              setIsRetry(true); // 设置重试状态为true
            }
          } catch (error) {
            console.error('检测错误:', error);
            setMessage('检测过程出错，请重试');
            setIsVerifying(false); // 重置验证状态
            setIsRetry(true); // 设置重试状态为true
          }
        }
      }
    }, 500);

    setTimeout(() => {
      // 确保在超时时也清除interval
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
        detectionIntervalRef.current = null;
      }
      setIsDetecting(false);
      setIsVerifying(false); // 重置验证状态
      if (!finishedRef.current) {
        setMessage('摇头检测未完成，请重试');
        setHeadPose(null); // 在摇头检测超时时也清除头部姿态信息
        setIsRetry(true); // 设置重试状态为true
      }
    }, 10000);
  };

  const startFaceRecognition = async (base64: string) => {
    setHeadPose(null); // 识别人脸前清除头部姿态信息，确保不显示
    try {
      const response = await fetch('/api/trueFace', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          base64: base64.split(',')[1]
        }),
      });
      const data = await response.json();

      if (data.code === 0) {
        setMessage(`识别成功！用户: ${data.data.PersonName}`);
        router.push('/admin/waitOrder');
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
          setStream(null);
        }
      } else {
        setMessage(data.msg || '人脸识别失败，请调整位置重试');
      }
    } catch (error) {
      console.error('识别错误:', error);
      setMessage('识别过程出错，请重试');
    }
  };

  const handleBack = () => {
    router.push('/admin/truePeople');
  };

  return (
    <div className="container">
      {/* 头部 */}
      <header className={`header ${animateIn ? 'bounce-in-right-delay-1' : ''}`}>
        
          <img src={back.src} alt="" width={21} onClick={handleBack} />
        
        <h1 className="title">实名认证</h1>
      </header>

      {/* 主要内容 */}
      <main className="main-content">
        <h2 className={`main-title ${animateIn ? 'bounce-in-right-delay-2' : ''}`}>
          {message}
        </h2>
        <p className={`sub-text ${animateIn ? 'bounce-in-right-delay-3' : ''}`}>
          请核对登录信息一致，将正脸对准框内，保存光线充足
        </p>

        {/* 人脸识别区域 */}
        <div className={`face-recognition-area ${animateIn ? 'bounce-in-right-delay-4' : ''}`}>
          {stream ? (
            <video ref={videoRef} className="camera-feed" autoPlay playsInline muted />
          ) : (
            <div className="camera-placeholder">
                <svg className="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" width="200" height="200" 
                fill="#808080"><path d="M511.95688427 380.50597227c-98.5790432 0-178.5202688 79.9303104-178.5202688 178.51481173 0 98.58559253 79.9412256 178.49516373 178.5202688 178.49516373 98.60414827 0 178.52790933-79.9095712 178.52790933-178.49516373C690.48479467 460.43628267 610.56103253 380.50597227 511.95688427 380.50597227L511.95688427 380.50597227zM511.95688427 380.50597227" ></path><path d="M939.7687328 246.65533867l-186.5200672 0c-9.92088533-30.4241216-43.7396544-121.47163093-93.2633088-121.47163094l-296.05476267 0c-45.88668693 0-83.0302464 91.04750933-94.16818346 121.47163094L84.13957867 246.65533867c-35.0227232 0-63.38167573 30.06828373-63.38167574 67.11251413l0 520.1058816c0 37.06278613 28.35895253 67.1190624 63.38167574 67.1190624l855.62806293 0c35.0227232 0 63.39368213-30.05627627 63.39368213-67.1190624L1003.1613248 313.75584533C1003.162416 276.7050656 974.7783584 246.65533867 939.7687328 246.65533867L939.7687328 246.65533867zM511.8444576 782.4169856c-123.22571413 0-223.1145888-99.92162027-223.1145888-223.17134827 0-123.2508192 99.88996587-223.1778976 223.1145888-223.1778976 123.20170027 0 223.10913067 99.9270784 223.10913067 223.1778976C734.95358827 682.49536533 635.04615787 782.4169856 511.8444576 782.4169856L511.8444576 782.4169856zM831.77963947 380.56928107c-20.50323627 0-37.13264427-16.6719776-37.13264427-37.25489494 0-20.59164907 16.6283168-37.270176 37.13264427-37.270176 20.52834133 0 37.16975573 16.67743467 37.16975573 37.270176C868.9493952 363.89075413 852.3079808 380.56928107 831.77963947 380.56928107L831.77963947 380.56928107zM831.77963947 380.56928107" ></path><path d="M238.51418667 188.74002773c0 13.3144416-10.79410667 24.10309013-24.1041824 24.10309014L102.39754453 212.84311893c-13.30898347 0-24.10309013-10.78864853-24.10309013-24.10309013l0 0c0-13.3155328 10.79410667-24.1041824 24.10309013-24.1041824l112.013552 0C227.7189888 164.63584533 238.51418667 175.42449493 238.51418667 188.74002773L238.51418667 188.74002773 238.51418667 188.74002773zM238.51418667 188.74002773" ></path></svg>
            </div>
          )}
          <canvas ref={canvasRef} style={{ display: 'none' }} />
          {isDetecting && (
            <div className="detection-progress">
              <div
                className="progress-bar"
                style={{ width: `${detectionProgress}%` }}
              ></div>
            </div>
          )}
          
          {/* 新增：张嘴检测进度条 */}
          {isMouthOpening && (
            <div className="mouth-detection-progress">
              <div
                className="progress-bar mouth-progress"
                style={{ width: `${Math.min(mouthOpenValue, 100)}%` }}
              ></div>
              <div className="mouth-value">{mouthOpenValue > 0 ? `表情值: ${mouthOpenValue}` : '请张大嘴巴'}</div>
            </div>
          )}
        </div>

        {/* 用户信息 */}
        <p className={`user-info ${animateIn ? 'bounce-in-right-delay-5' : ''}`}>
          <span className='nowUser'>当前登录用户: </span><span className="user-phone">{formatPhoneNumber(phoneNumber)}</span>
        </p>

        {headPose && isDetecting && (
          <div className="head-pose-info">
            <p>当前头部姿态: {headPose}</p>
            <div className="detection-steps">
              <p>检测进度：</p>
              <ul>
                {REQUIRED_STEPS.map((step, index) => (
                  <li key={index} style={{ color: detectedSteps.includes(step) ? '#28a745' : '#aaa' }}>
                    {step} {detectedSteps.includes(step) ? '✔️' : ''}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
        
        {/* 新增：显示验证步骤 */}
        <div className={`verification-steps ${animateIn ? 'show-steps' : ''}`}>
          <div className={`step ${isVerifying ? 'active' : (isMouthDetected || isBlinking) ? 'completed' : ''}`}>
            1. 摇头检测 {detectedSteps.length === REQUIRED_STEPS.length ? '✅' : ''}
          </div>
          <div className={`step ${isMouthOpening || isMouthDetected ? 'active' : ''}`}>
            2. 张嘴检测 {isMouthDetected ? '✅' : ''}
          </div>
          <div className={`step ${isBlinking ? 'active' : isBlinkDetected ? 'completed' : ''}`}>
            3. 眨眼检测 {isBlinkDetected ? '✅' : ''}
          </div>
        </div>

        {/* 提示信息 */}
        <div className={`alert-message ${animateIn ? 'bounce-in-right-delay-6' : ''}`}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="alert-icon"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
          </svg>
          <span className='ren'>
            人脸识别信息将上传至数据库，必要时公安机关可依法调证
          </span>
        </div>

        <div className="controls-section">
          <button
            className={`verify-button ${animateIn ? 'bounce-in-right-delay-7' : ''}`}
            onClick={startHeadPoseDetection}
            disabled={isDetecting || isBlinking || isMouthOpening}
          >
            {isVerifying ? '验证中...' : (isRetry ? '重新开始验证' : '开始验证')}
          </button>
        </div>
      </main>
    </div>
  );
};

export default TrueFacePage;