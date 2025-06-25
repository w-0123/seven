"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

// 最小声明，以确保 TypeScript 识别 Web Speech API 类型
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognitionResult {
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative; // 允许通过索引访问备选项
  readonly isFinal: boolean;
}

interface SpeechRecognitionEvent extends Event {
  readonly results: SpeechRecognitionResultList;
  readonly resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: SpeechRecognitionErrorCode;
  readonly message: string;
}

declare const SpeechRecognition: {
  prototype: SpeechRecognition;
  new(): SpeechRecognition;
};

declare const webkitSpeechRecognition: {
  prototype: SpeechRecognition;
  new(): SpeechRecognition;
};

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

type SpeechRecognitionErrorCode = 
  "no-speech" |
  "aborted" |
  "audio-capture" |
  "network" |
  "not-allowed" |
  "service-not-allowed" |
  "bad-grammar" |
  "language-not-supported";

// 扩展 Window 接口以包含 Web Speech API
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

interface Message {
  id: string;
  sender: 'driver' | 'customer';
  content: string;
  timestamp: number;
  tripId: number;
  type?: 'text' | 'audio' | 'image' | 'location' | 'emoji' | 'sticker';
  audioUrl?: string;
  imageUrl?: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  isDeleted?: boolean;
  audioText?: string;
  stickerUrl?: string;
  stickerName?: string;
}

interface Regeocode {
  formattedAddress: string;
}

// 添加高德地图类型声明
declare global {
  interface Window {
    AMap: {
      Geocoder: new () => {
        getAddress: (
          position: [number, number],
          callback: (status: string, result: { info: string; regeocode: Regeocode }) => void
        ) => void;
      };
    };
  }
}

// 司机的快捷回复预设消息
const quickReplies = [
  "您好,我是您的司机,马上到达接您",
  "您好,预计5分钟后到达,请稍等",
  "您好,我已到达上车点,车牌号为浙A12345",
  "您好,请问您在哪个具体位置?",
  "您好,我是黑色本田轿车",
  "您好,有点堵车,可能会晚几分钟",
  "您好,已看到您,马上靠边停车",
  "您好,我已到达目的地,请问是否需要帮忙?"
];

// 添加表情包数据
const emojiList = [
  { id: 1, emoji: '😊', name: '微笑' },
  { id: 2, emoji: '😂', name: '大笑' },
  { id: 3, emoji: '👍', name: '点赞' },
  { id: 4, emoji: '❤️', name: '爱心' },
  { id: 5, emoji: '🎉', name: '庆祝' },
  { id: 6, emoji: '🙏', name: '感谢' },
  { id: 7, emoji: '👋', name: '再见' },
  { id: 8, emoji: '🚗', name: '汽车' },
  { id: 9, emoji: '⏰', name: '时间' },
  { id: 10, emoji: '📍', name: '位置' },
  { id: 11, emoji: '💰', name: '钱' },
  { id: 12, emoji: '🎁', name: '礼物' },
];

// 添加表情包数据
const defaultStickers = [
  { id: 1, name: '开心', url: '/stickers/happy.gif' },
  { id: 2, name: '生气', url: '/stickers/angry.gif' },
  { id: 3, name: '惊讶', url: '/stickers/surprise.gif' },
  { id: 4, name: '哭泣', url: '/stickers/cry.gif' },
  { id: 5, name: '点赞', url: '/stickers/like.gif' },
  { id: 6, name: '鼓掌', url: '/stickers/clap.gif' },
];

export default function DriverChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const searchParams = new URLSearchParams(window.location.search);
  const currentTripId = parseInt(searchParams.get('tripId') || '0');

  const [isSpeechToTextRecording, setIsSpeechToTextRecording] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const wsRef = useRef<WebSocket | null>(null);

  const [isSharingLocation, setIsSharingLocation] = useState(false);
  const locationWatchId = useRef<number | null>(null);

  const [isMapLoaded, setIsMapLoaded] = useState(false);

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [customStickers, setCustomStickers] = useState<Array<{ id: number; name: string; url: string }>>([]);
  const stickerInputRef = useRef<HTMLInputElement>(null);
  const [showMoreActions, setShowMoreActions] = useState(false);

  // 加载高德地图
  useEffect(() => {
    const loadAMap = () => {
      if (window.AMap) {
        setIsMapLoaded(true);
        return;
      }

      const script = document.createElement('script');
      script.src = `https://webapi.amap.com/maps?v=2.0&key=您的高德地图key&plugin=AMap.Geocoder`;
      script.async = true;
      script.onload = () => {
        setIsMapLoaded(true);
      };
      document.head.appendChild(script);
    };

    loadAMap();
  }, []);

  // 初始化WebSocket连接
  useEffect(() => {
    if (wsRef.current) {
      return;
    }

    const wsUrl = 'ws://localhost:8080';
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log('WebSocket连接已建立');
      setIsConnected(true);
    };

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      console.log('收到消息:', message);

      // 处理撤回消息
      if (message.type === 'recall') {
        setMessages(prev => prev.filter(m => m.id !== message.messageId));
        return;
      }

      // 检查消息是否由自己发送，如果是则使用函数式更新检查重复
      // 因为本地已经在发送时添加了这条消息
      setMessages(prev => {
        // 如果是自己发送的消息，检查是否已存在
        if (message.sender === 'driver') {
          const messageExists = prev.some(m => m.id === message.id);
          if (messageExists) {
            return prev; // 如果消息已存在，不做更改
          }
        }
        return [...prev, message]; // 添加新消息
      });
    };

    socket.onclose = () => {
      console.log('WebSocket连接已关闭');
      setIsConnected(false);
      wsRef.current = null;
    };

    socket.onerror = (error) => {
      console.error('WebSocket错误:', error);
      setIsConnected(false);
      wsRef.current = null;
    };

    setWs(socket);
    wsRef.current = socket;

    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'zh-CN';
      recognitionRef.current = recognition;
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (locationWatchId.current !== null) {
        navigator.geolocation.clearWatch(locationWatchId.current);
      }
    };
  }, []);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 发送消息
  const sendMessage = () => {
    if (newMessage.trim() === '') return;
    
    const messageObj: Message = {
      id: Date.now().toString(),
      sender: 'driver', // 作为司机发送消息
      content: newMessage,
      timestamp: Date.now(),
      tripId: currentTripId,
      type: 'text'
    };
    
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(messageObj));
      // 立即在本地添加消息，这样可以不等待WebSocket回传就看到自己发送的消息
      setMessages(prev => [...prev, messageObj]);
    }
    
    setNewMessage('');
  };

  // 处理键盘按键
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // 切换语音转文字录音
  const toggleSpeechToTextRecording = () => {
    if (!isSpeechToTextRecording) {
      // 开始语音识别
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.lang = 'zh-CN';
        recognition.continuous = true;
        recognition.interimResults = true;
        
        recognition.onresult = (event) => {
          let transcript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              transcript += event.results[i][0].transcript;
            }
          }
          if (transcript.trim()) {
            setNewMessage((prev) => prev + ' ' + transcript.trim());
          }
        };
        
        recognition.onerror = (event) => {
          console.error('语音识别错误:', event.error);
          setIsSpeechToTextRecording(false);
        };
        
        recognition.onend = () => {
          setIsSpeechToTextRecording(false);
        };
        
        try {
          recognition.start();
          setIsSpeechToTextRecording(true);
          recognitionRef.current = recognition;
        } catch (error) {
          console.error('启动语音识别失败:', error);
        }
      } else {
        alert('您的浏览器不支持语音识别功能');
      }
    } else {
      // 停止语音识别
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsSpeechToTextRecording(false);
    }
  };

  // 切换录音功能
  const toggleAudioRecording = async () => {
    if (isRecordingAudio) {
      // 停止录音
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
      setIsRecordingAudio(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      setRecordingTime(0);
    } else {
      try {
        // 开始录音
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          audioChunksRef.current.push(event.data);
        };

        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
          const audioUrl = URL.createObjectURL(audioBlob);
          
          // 创建一个音频消息对象
          const messageObj: Message = {
            id: Date.now().toString(),
            sender: 'driver', // 作为司机发送音频
            content: '语音消息',
            timestamp: Date.now(),
            tripId: currentTripId,
            type: 'audio',
            audioUrl
          };
          
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(messageObj));
            // 立即在本地添加消息
            setMessages(prev => [...prev, messageObj]);
          }
          
          // 释放媒体资源
          stream.getTracks().forEach(track => track.stop());
        };
        
        mediaRecorder.start();
        setIsRecordingAudio(true);
        
        // 设置录音计时器
        recordingTimerRef.current = setInterval(() => {
          setRecordingTime(prevTime => prevTime + 1);
        }, 1000);
        
      } catch (error) {
        console.error('无法访问麦克风:', error);
        alert('无法访问麦克风，请检查权限设置');
      }
    }
  };

  // 格式化录音时间
  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  // 发送位置
  const sendLocation = () => {
    if (isSharingLocation) {
      // 停止共享位置
      if (locationWatchId.current !== null) {
        navigator.geolocation.clearWatch(locationWatchId.current);
        locationWatchId.current = null;
      }
      setIsSharingLocation(false);
      return;
    }
    
    // 开始共享位置
    if ('geolocation' in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          
          // 使用高德地图API进行逆地理编码（如果已加载）
          if (isMapLoaded && window.AMap) {
            const geocoder = new window.AMap.Geocoder();
            geocoder.getAddress([longitude, latitude], (status, result) => {
              let address = '';
              if (status === 'complete' && result.info === 'OK') {
                address = result.regeocode.formattedAddress;
              }
              
              // 创建位置消息
              const locationMessage: Message = {
                id: Date.now().toString(),
                sender: 'driver', // 作为司机发送位置
                content: address || '已分享位置',
                timestamp: Date.now(),
                tripId: currentTripId,
                type: 'location',
                location: {
                  latitude,
                  longitude,
                  address
                }
              };
              
              // 发送位置消息
              if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify(locationMessage));
                // 立即在本地添加消息
                setMessages(prev => [...prev, locationMessage]);
              }
            });
          } else {
            // 如果高德地图未加载，仅发送坐标
            const locationMessage: Message = {
              id: Date.now().toString(),
              sender: 'driver', // 作为司机发送位置
              content: '已分享位置',
              timestamp: Date.now(),
              tripId: currentTripId,
              type: 'location',
              location: {
                latitude,
                longitude
              }
            };
            
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
              wsRef.current.send(JSON.stringify(locationMessage));
              // 立即在本地添加消息
              setMessages(prev => [...prev, locationMessage]);
            }
          }
        },
        (error) => {
          console.error('获取位置失败:', error);
          alert('获取位置失败，请检查位置权限设置');
          setIsSharingLocation(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
      
      locationWatchId.current = watchId;
      setIsSharingLocation(true);
    } else {
      alert('您的浏览器不支持地理位置功能');
    }
  };

  // 发送表情
  const sendEmoji = (emoji: string) => {
    const messageObj: Message = {
      id: Date.now().toString(),
      sender: 'driver', // 作为司机发送表情
      content: emoji,
      timestamp: Date.now(),
      tripId: currentTripId,
      type: 'emoji'
    };
    
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(messageObj));
      // 立即在本地添加消息
      setMessages(prev => [...prev, messageObj]);
    }
    
    setShowEmojiPicker(false);
  };

  // 撤回消息
  const recallMessage = (messageId: string) => {
    const message = messages.find(m => m.id === messageId);
    if (!message) return;
    
    // 检查是否是自己的消息
    if (message.sender !== 'driver') {
      alert('只能撤回自己发送的消息');
      return;
    }
    
    // 检查消息是否在2分钟内
    const messageAge = Date.now() - message.timestamp;
    if (messageAge > 2 * 60 * 1000) { // 2分钟 = 120,000毫秒
      alert('只能撤回2分钟内发送的消息');
      return;
    }
    
    const recallData = {
      type: 'recall',
      messageId,
      tripId: currentTripId,
      sender: 'driver', // 作为司机撤回消息
      timestamp: Date.now()
    };
    
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(recallData));
      // 立即在本地更新消息状态
      setMessages(prev => prev.filter(m => m.id !== messageId));
    }
  };

  // 图片上传处理
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      alert('请上传图片格式文件');
      return;
    }
    
    // 检查文件大小（限制为5MB）
    if (file.size > 5 * 1024 * 1024) {
      alert('图片大小不能超过5MB');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;
      
      const imageMessage: Message = {
        id: Date.now().toString(),
        sender: 'driver', // 作为司机发送图片
        content: '图片',
        timestamp: Date.now(),
        tripId: currentTripId,
        type: 'image',
        imageUrl
      };
      
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify(imageMessage));
        // 立即在本地添加消息
        setMessages(prev => [...prev, imageMessage]);
      }
    };
    
    reader.readAsDataURL(file);
  };
  
  // 发送贴纸
  const sendSticker = (sticker: { id: number; name: string; url: string }) => {
    const stickerMessage: Message = {
      id: Date.now().toString(),
      sender: 'driver', // 作为司机发送贴纸
      content: `贴纸: ${sticker.name}`,
      timestamp: Date.now(),
      tripId: currentTripId,
      type: 'sticker',
      stickerUrl: sticker.url,
      stickerName: sticker.name
    };
    
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(stickerMessage));
      // 立即在本地添加消息
      setMessages(prev => [...prev, stickerMessage]);
    }
    
    setShowStickerPicker(false);
  };
  
  // 处理贴纸上传
  const handleStickerUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      const newSticker = {
        id: Date.now(),
        name: file.name.split('.')[0],
        url
      };
      
      setCustomStickers([...customStickers, newSticker]);
    };
    
    reader.readAsDataURL(file);
  };

  // 显示语音转写状态的函数
  const renderSpeechRecordingStatus = () => {
    if (!isSpeechToTextRecording) return null;
    
    return (
      <div style={{ backgroundColor: '#e0e7ff', border: '1px solid #a5b4fc', padding: '0.5rem', borderRadius: '0.25rem', marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.25rem' }}>
          <div style={{ width: '1rem', height: '1rem', backgroundColor: '#3b82f6', borderRadius: '9999px', marginRight: '0.25rem' }}></div>
          <span style={{ fontSize: '0.875rem' }}>正在聆听，请说话...</span>
        </div>
        <button
          onClick={toggleSpeechToTextRecording}
          style={{ backgroundColor: '#3b82f6', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', marginLeft: 'auto' }}
        >
          完成
        </button>
      </div>
    );
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100vh', 
      backgroundColor: '#f3f4f6', 
      maxWidth: '100%', 
      margin: '0 auto'
    }}>
      {/* 页面标题 */}
      <div style={{ 
        backgroundColor: '#3b82f6', 
        color: 'white', 
        padding: '1rem', 
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', 
        display: 'flex', 
        alignItems: 'center',
        position: 'sticky', 
        top: 0, 
        zIndex: 50
      }}>
        <button 
          onClick={() => router.back()} 
          style={{ marginRight: '0.75rem' }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: '1.5rem', height: '1.5rem' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 style={{ fontSize: '1.125rem', fontWeight: 'bold' }}>联系乘客</h1>
          <p style={{ fontSize: '0.75rem', opacity: '0.9' }}>行程号: {currentTripId}</p>
        </div>
        {isConnected && (
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
            <span style={{ display: 'inline-block', width: '0.5rem', height: '0.5rem', backgroundColor: '#4ade80', borderRadius: '9999px', marginRight: '0.25rem' }}></span>
            <span style={{ fontSize: '0.75rem' }}>已连接</span>
          </div>
        )}
      </div>

      {/* 连接状态条 */}
      {!isConnected && (
        <div style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '0.5rem', textAlign: 'center', fontSize: '0.875rem' }}>
          正在连接消息服务...
        </div>
      )}
      
      {/* 消息列表区域 */}
      <div style={{ 
        flex: '1', 
        overflowY: 'auto', 
        padding: '0.75rem', 
        backgroundImage: 'url(/chat-bg-light.png)', 
        backgroundSize: 'cover' 
      }}>
        {messages.length === 0 && (
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '100%', 
            opacity: '0.5' 
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: '4rem', height: '4rem', color: '#9ca3af', marginBottom: '0.5rem' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p style={{ color: '#6b7280' }}>还没有消息，发送一条开始聊天吧</p>
          </div>
        )}
        {messages.map((message) => (
          <div 
            key={message.id}
            style={{ 
              display: 'flex', 
              justifyContent: message.sender === 'driver' ? 'flex-end' : 'flex-start',
              marginBottom: '0.75rem' 
            }}
          >
            {message.sender === 'customer' && (
              <div style={{ 
                width: '2rem', 
                height: '2rem', 
                borderRadius: '9999px', 
                backgroundColor: '#d1d5db', 
                marginRight: '0.5rem', 
                flexShrink: 0,
                overflow: 'hidden' 
              }}>
                <img src="/user-avatar.png" alt="乘客头像" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}
            
            <div style={{ 
              maxWidth: '70%', 
              borderRadius: '0.5rem', 
              padding: '0.75rem',
              backgroundColor: message.sender === 'driver' ? '#3b82f6' : 'white',
              color: message.sender === 'driver' ? 'white' : '#1f2937',
              boxShadow: message.sender === 'driver' ? '0 1px 2px rgba(0,0,0,0.1)' : '0 1px 3px rgba(0,0,0,0.1)',
              borderBottomRightRadius: message.sender === 'driver' ? '0' : '0.5rem',
              borderBottomLeftRadius: message.sender === 'driver' ? '0.5rem' : '0'
            }}>
              {message.type === 'text' && <p style={{ wordBreak: 'break-word' }}>{message.content}</p>}
              
              {message.type === 'emoji' && <p style={{ fontSize: '1.5rem' }}>{message.content}</p>}
              
              {message.type === 'audio' && (
                <div style={{ display: 'flex', alignItems: 'center', borderRadius: '0.25rem', padding: '0.25rem' }}>
                  <audio src={message.audioUrl} controls style={{ maxWidth: '100%', height: '2rem' }} controlsList="nodownload" />
                </div>
              )}
              
              {message.type === 'image' && (
                <img 
                  src={message.imageUrl} 
                  alt="图片消息" 
                  style={{ maxWidth: '100%', borderRadius: '0.25rem', cursor: 'pointer' }}
                  onClick={() => window.open(message.imageUrl, '_blank')} 
                />
              )}
              
              {message.type === 'location' && (
                <div style={{ width: '12rem', maxWidth: '100%' }}>
                  <div style={{ backgroundColor: '#f3f4f6', borderRadius: '0.25rem', marginBottom: '0.25rem', padding: '0.25rem' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: '1.5rem', height: '1.5rem', display: 'inline', color: '#3b82f6' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span style={{ fontSize: '0.875rem', marginLeft: '0.25rem' }}>{message.location?.address || '位置信息'}</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                    经度：{message.location?.longitude.toFixed(6)}
                    <br />
                    纬度：{message.location?.latitude.toFixed(6)}
                  </div>
                </div>
              )}
              
              {message.type === 'sticker' && (
                <img src={message.stickerUrl} alt={message.stickerName} style={{ width: '6rem', height: '6rem' }} />
              )}
              
              <div style={{ fontSize: '0.75rem', marginTop: '0.25rem', textAlign: 'right', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                {message.sender === 'driver' && (
                  <button 
                    onClick={() => recallMessage(message.id)}
                    style={{ textDecoration: 'underline', opacity: '0.7', marginRight: '0.5rem', fontSize: '0.75rem' }}
                  >
                    撤回
                  </button>
                )}
                <span style={{ opacity: message.sender === 'driver' ? '0.7' : '1', color: message.sender === 'driver' ? 'inherit' : '#6b7280' }}>
                  {new Date(message.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
              </div>
            </div>
            
            {message.sender === 'driver' && (
              <div style={{ 
                width: '2rem', 
                height: '2rem', 
                borderRadius: '9999px', 
                backgroundColor: '#d1d5db', 
                marginLeft: '0.5rem',
                flexShrink: 0,
                overflow: 'hidden'
              }}>
                <img src="/driver-avatar.png" alt="我的头像" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* 快捷回复区域 */}
      <div style={{ 
        backgroundColor: '#fff', 
        padding: '0.75rem', 
        overflowX: 'auto', 
        whiteSpace: 'nowrap', 
        borderTop: '1px solid #e5e7eb' 
      }}>
        <div style={{ display: 'flex', flexWrap: 'nowrap', paddingBottom: '0.25rem' }}>
          {quickReplies.map((reply, index) => (
            <button
              key={index}
              onClick={() => {
                setNewMessage(reply);
                setTimeout(() => sendMessage(), 100);
              }}
              style={{ 
                backgroundColor: '#f3f4f6', 
                color: '#1f2937', 
                borderRadius: '9999px', 
                padding: '0.375rem 0.75rem', 
                fontSize: '0.875rem',
                marginRight: '0.5rem', 
                flexShrink: 0, 
                border: '1px solid #e5e7eb'
              }}
            >
              {reply}
            </button>
          ))}
        </div>
      </div>

      {/* 消息输入区域 */}
      <div style={{ 
        backgroundColor: '#fff', 
        padding: '0.75rem', 
        borderTop: '1px solid #e5e7eb',
        boxShadow: '0 -2px 10px rgba(0,0,0,0.05)'
      }}>
        {/* 录音提示 */}
        {isRecordingAudio && (
          <div style={{ 
            backgroundColor: '#fef2f2', 
            color: '#991b1b', 
            padding: '0.5rem', 
            borderRadius: '0.25rem', 
            marginBottom: '0.75rem', 
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{ 
              width: '0.5rem', 
              height: '0.5rem', 
              backgroundColor: '#ef4444', 
              borderRadius: '9999px', 
              marginRight: '0.25rem'
            }}></div>
            <span>正在录音... {formatRecordingTime(recordingTime)}</span>
            <button
              onClick={toggleAudioRecording}
              style={{ 
                backgroundColor: '#ef4444', 
                color: 'white', 
                padding: '0.25rem 0.5rem', 
                borderRadius: '0.25rem', 
                marginLeft: '0.5rem'
              }}
            >
              停止
            </button>
          </div>
        )}
        
        {/* 位置共享提示 */}
        {isSharingLocation && (
          <div style={{ 
            backgroundColor: '#f0fdf4', 
            color: '#15803d', 
            padding: '0.5rem', 
            borderRadius: '0.25rem', 
            marginBottom: '0.75rem', 
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{ 
              width: '0.5rem', 
              height: '0.5rem', 
              backgroundColor: '#22c55e', 
              borderRadius: '9999px', 
              marginRight: '0.25rem'
            }}></div>
            <span>位置共享中</span>
            <button
              onClick={sendLocation}
              style={{ 
                backgroundColor: '#ef4444', 
                color: 'white', 
                padding: '0.25rem 0.5rem', 
                borderRadius: '0.25rem', 
                marginLeft: '0.5rem'
              }}
            >
              停止
            </button>
          </div>
        )}
        
        {/* 语音转写状态 */}
        {renderSpeechRecordingStatus()}
        
        {/* 输入区域 */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="输入消息..."
              style={{ 
                width: '100%', 
                borderRadius: '0.5rem', 
                padding: '0.5rem 1rem', 
                border: '1px solid #e5e7eb',
                outline: 'none',
                resize: 'none'
              }}
              rows={1}
            />
          </div>
          
          <button
            onClick={sendMessage}
            disabled={!isConnected || newMessage.trim() === ''}
            style={{ 
              backgroundColor: !isConnected || newMessage.trim() === '' ? '#e5e7eb' : '#3b82f6', 
              color: 'white', 
              padding: '0.5rem 0.75rem', 
              borderRadius: '0.5rem', 
              marginLeft: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '2.5rem',
              height: '2.5rem'
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style={{ width: '1.25rem', height: '1.25rem' }}>
              <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
            </svg>
          </button>
          
          <button
            onClick={() => setShowMoreActions(!showMoreActions)}
            style={{ 
              backgroundColor: 'transparent', 
              color: '#6b7280', 
              padding: '0.5rem', 
              borderRadius: '0.5rem', 
              marginLeft: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid #e5e7eb',
              width: '2.5rem',
              height: '2.5rem'
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style={{ width: '1.25rem', height: '1.25rem' }}>
              <path d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </button>
        </div>
        
        {/* 更多操作按钮 */}
        {showMoreActions && (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(4, 1fr)', 
            gap: '1rem', 
            marginTop: '0.75rem', 
            paddingTop: '0.5rem', 
            borderTop: '1px solid #e5e7eb'
          }}>
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{ 
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <div style={{ 
                width: '3rem', 
                height: '3rem', 
                borderRadius: '9999px', 
                backgroundColor: '#f3f4f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '0.25rem'
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#3b82f6" style={{ width: '1.5rem', height: '1.5rem' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>图片</span>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                style={{ display: 'none' }}
              />
            </button>
            
            <button
              onClick={sendLocation}
              style={{ 
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <div style={{ 
                width: '3rem', 
                height: '3rem', 
                borderRadius: '9999px', 
                backgroundColor: '#f3f4f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '0.25rem'
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#3b82f6" style={{ width: '1.5rem', height: '1.5rem' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>位置</span>
            </button>
            
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              style={{ 
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <div style={{ 
                width: '3rem', 
                height: '3rem', 
                borderRadius: '9999px', 
                backgroundColor: '#f3f4f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '0.25rem'
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#3b82f6" style={{ width: '1.5rem', height: '1.5rem' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>表情</span>
            </button>
            
            <button
              onClick={toggleAudioRecording}
              style={{ 
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <div style={{ 
                width: '3rem', 
                height: '3rem', 
                borderRadius: '9999px', 
                backgroundColor: '#f3f4f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '0.25rem'
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#3b82f6" style={{ width: '1.5rem', height: '1.5rem' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>录音</span>
            </button>
  
            <button
              onClick={toggleSpeechToTextRecording}
              style={{ 
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative'
              }}
            >
              <div style={{ 
                width: '3rem', 
                height: '3rem', 
                borderRadius: '9999px', 
                backgroundColor: isSpeechToTextRecording ? '#e0e7ff' : '#f3f4f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '0.25rem'
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke={isSpeechToTextRecording ? '#4f46e5' : '#3b82f6'} style={{ width: '1.5rem', height: '1.5rem' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                {isSpeechToTextRecording && (
                  <span style={{ position: 'absolute', top: '0', right: '0', width: '0.75rem', height: '0.75rem', backgroundColor: '#ef4444', borderRadius: '9999px' }}></span>
                )}
              </div>
              <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>语音转文字</span>
            </button>
            
            <button
              onClick={() => setShowStickerPicker(!showStickerPicker)}
              style={{ 
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <div style={{ 
                width: '3rem', 
                height: '3rem', 
                borderRadius: '9999px', 
                backgroundColor: '#f3f4f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '0.25rem'
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#3b82f6" style={{ width: '1.5rem', height: '1.5rem' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>贴纸</span>
            </button>
          </div>
        )}
        
        {/* 表情选择器 */}
        {showEmojiPicker && (
          <div style={{ 
            marginTop: '0.5rem', 
            padding: '0.5rem', 
            backgroundColor: '#fff', 
            border: '1px solid #e5e7eb', 
            borderRadius: '0.5rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(8, 1fr)', 
              gap: '0.25rem'
            }}>
              {emojiList.map((emojiItem) => (
                <button
                  key={emojiItem.id}
                  onClick={() => sendEmoji(emojiItem.emoji)}
                  style={{ 
                    fontSize: '1.5rem', 
                    padding: '0.25rem',
                    borderRadius: '0.25rem'
                  }}
                  title={emojiItem.name}
                >
                  {emojiItem.emoji}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* 贴纸选择器 */}
        {showStickerPicker && (
          <div style={{ 
            marginTop: '0.5rem', 
            padding: '0.5rem', 
            backgroundColor: '#fff', 
            border: '1px solid #e5e7eb', 
            borderRadius: '0.5rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: '0.5rem', 
              paddingBottom: '0.25rem', 
              borderBottom: '1px solid #e5e7eb'
            }}>
              <h4 style={{ fontSize: '0.875rem', fontWeight: '500' }}>贴纸</h4>
              <button
                onClick={() => stickerInputRef.current?.click()}
                style={{ 
                  color: '#3b82f6', 
                  fontSize: '0.75rem', 
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: '1rem', height: '1rem', marginRight: '0.25rem' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                添加
                <input
                  type="file"
                  ref={stickerInputRef}
                  onChange={handleStickerUpload}
                  accept="image/*"
                  style={{ display: 'none' }}
                />
              </button>
            </div>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(4, 1fr)', 
              gap: '0.5rem'
            }}>
              {[...defaultStickers, ...customStickers].map((sticker) => (
                <button
                  key={sticker.id}
                  onClick={() => sendSticker(sticker)}
                  style={{ 
                    padding: '0.25rem',
                    borderRadius: '0.25rem'
                  }}
                >
                  <img 
                    src={sticker.url} 
                    alt={sticker.name} 
                    style={{ width: '3rem', height: '3rem', objectFit: 'contain' }}
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 