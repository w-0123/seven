"use client";
import React, { useState, useRef, useEffect } from 'react';
import { Button, Image, Input, Toast } from 'react-vant';
import { ArrowLeft, Smile, VolumeO, Photograph } from '@react-vant/icons';
import ReactMarkdown from 'react-markdown';
import './chat.css';

interface Messages {
    text: string;
    users: String;
    image?: string;
}

// 定义 语音转文字、文字转语音 类型
declare global {
    interface Window {
        SpeechRecognition: any;
        webkitSpeechRecognition: any;
    }
}

export default function AiPage() {
    const [inputMessage, setInputMessage] = useState('');
    const [currentTime, setCurrentTime] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [messages, setMessages] = useState<Messages[]>([
        {
            text: '您好，我是在线客服小美，很高兴为您服务，请问有什么可以帮您？',
            users: ''
        }
    ]);
    const eventSourceRef = useRef<EventSource | null>(null);//sse
    const chatContentRef = useRef<HTMLDivElement>(null);//窗口视图
    const recognitionRef = useRef<any>(null);//语音识别
    const synthesisRef = useRef<SpeechSynthesis | null>(null);
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

    //视图动态化
    const scrollToBottom = () => {
        if (chatContentRef.current) {
            chatContentRef.current.scrollTop = chatContentRef.current.scrollHeight;
        }
    };
    useEffect(() => {
        scrollToBottom();
    }, [messages]);


    // 初始化时间
    useEffect(() => {
        setCurrentTime(new Date().toLocaleString());
    }, []);


    //连接SSE
    useEffect(() => {
        const eventSource = new EventSource('/api/ai');
        eventSourceRef.current = eventSource;
        eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log(data.text)
        };
        eventSource.onerror = () => {
            console.error('SSE连接错误');
            eventSource.close();
        };
        return () => {
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
            }
        };
    }, []);


    // 初始化语音转文字
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.lang = 'zh-CN';
            recognitionRef.current.interimResults = false;
            recognitionRef.current.maxAlternatives = 1;

            recognitionRef.current.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                setInputMessage(prev => prev + transcript);
                setIsListening(false);
            };

            recognitionRef.current.onerror = (event: any) => {
                console.error('语音识别错误:', event.error);
                setIsListening(false);
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };
        }
    }, []);
    // 初始化文字转语音
    useEffect(() => {
        
        if (typeof window !== 'undefined') {
            synthesisRef.current = window.speechSynthesis;
            utteranceRef.current = new SpeechSynthesisUtterance();
            if (utteranceRef.current) {
                utteranceRef.current.lang = 'zh-CN';
                utteranceRef.current.rate = 1.5;
                utteranceRef.current.pitch = 6.0;
                utteranceRef.current.onend = () => {
                    setIsSpeaking(false);
                };
                utteranceRef.current.onerror = (event) => {
                    console.error('语音合成错误:', event);
                    setIsSpeaking(false);
                };
            }
        }
    }, []);

    const handleSend = async () => {
        try {
            // 如果既没有文字也没有图片，则不发送
            if (!inputMessage.trim() && !selectedImage) {
                return;
            }
            
            // 如果有文字消息，添加到聊天记录
            if (inputMessage.trim()) {
                setMessages(prev => [...prev, { text: '', users: inputMessage }]);
            }
            
            // 如果有图片，添加到聊天记录
            if (selectedImage && previewUrl) {
                setMessages(prev => [...prev, { text: '', users: '', image: previewUrl }]);
            }
            
            // 准备请求数据
            let requestBody;
            let headers: HeadersInit = {
                'Content-Type': 'application/json',
            };
            
            if (selectedImage) {
                // 如果有图片，使用FormData
                const formData = new FormData();
                formData.append('image', selectedImage);
                if (inputMessage.trim()) {
                    formData.append('message', inputMessage);
                }
                requestBody = formData;
                // 使用FormData时不设置Content-Type，让浏览器自动设置
                headers = {};
            } else {
                // 仅文本消息，使用JSON
                requestBody = JSON.stringify({ message: inputMessage });
            }
            
            // 清空输入和图片
            setInputMessage('');
            removeImage();
            
            // 添加一个空的系统消息占位，等待实际回复
            setMessages(prev => [...prev, { text: '', users: '' }]);
            
            // 发送请求
            const response = await fetch('/api/ai', {
                method: 'POST',
                headers,
                body: requestBody,
            });

            const reader = response.body?.getReader();
            if (!reader) return;

            let dataAll = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const text = new TextDecoder().decode(value);
                const lines = text.split('\n');

                for (const line of lines) {
                    if (line.trim() && line.startsWith('data: ')) {
                        try {
                            const jsonStr = line.replace(/^data: /, '').trim();
                            if (!jsonStr) continue;

                            const data = JSON.parse(jsonStr);
                            if (data && data.text) {
                                dataAll += data.text;
                                setMessages(prev => {
                                    const newMessages = [...prev.slice(0, -1)];
                                    return [...newMessages, { text: dataAll, users: '' }];
                                });
                            }
                        } catch (e) {
                            console.warn('解析响应数据失败:', e, line);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('发送消息失败:', error);
            setMessages(prev => [...prev, {
                text: '抱歉，发生了错误，请稍后重试。',
                users: ''
            }]);
        }
    };
    //调用语音转文字
    const toggleListening = () => {
        if (!recognitionRef.current) {
            alert('您的浏览器不支持语音识别功能');
            return;
        }

        if (!isListening) {
            recognitionRef.current.start();
            setIsListening(true);
        } else {
            recognitionRef.current.stop();
            setIsListening(false);
        }
    };

    // 播放文本
    const speakText = (text: string) => {

        if (!synthesisRef.current || !utteranceRef.current) {
            alert('您的浏览器不支持语音合成功能');
            return;
        }
        if (isSpeaking) {
            synthesisRef.current.cancel();
            setIsSpeaking(false);
            return;
        }
        utteranceRef.current.text = text;
        setIsSpeaking(true);
        synthesisRef.current.speak(utteranceRef.current);
    };
    const stopSpeaking = () => {
        if (synthesisRef.current && isSpeaking) {
            synthesisRef.current.cancel();
            setIsSpeaking(false);
        }
    };

    // 修改选择图片方法，使用持久的Base64格式保存图片
    const handleImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 限制图片大小为5MB
                Toast.fail('图片大小不能超过5MB');
                return;
            }
            setSelectedImage(file);
            
            // 使用FileReader将图片转换为Base64格式，这样URL不会过期
            try {
                const reader = new FileReader();
                reader.onload = (e) => {
                    if (e.target?.result) {
                        setPreviewUrl(e.target.result as string);
                    }
                };
                reader.readAsDataURL(file);
            } catch (error) {
                console.error('读取图片失败:', error);
                Toast.fail('读取图片失败');
            }
        }
    };

    // 删除预览图片，不需要撤销URL
    const removeImage = () => {
        setSelectedImage(null);
        setPreviewUrl(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // 触发文件选择框
    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="chat-container">
            {/* 顶部导航 */}
            <div className="chat-header">
                <div className="header-left">
                    <ArrowLeft />
                </div>
                <div className="header-title">在线客服</div>
                <div className="header-right"></div>
            </div>

            {/* 聊天内容区域 */}
            <div className="chat-content" ref={chatContentRef}>
                {/* 系统消息 */}
                <div className="system-message">
                    <span>系统已接入，正在为您分配客服</span>
                </div>

                {/* 时间分割线 */}
                <div className="time-divider">{currentTime}</div>

                {/* 消息列表 */}
                {messages.map((item, index) => (
                    <div key={index} className="message-container">
                        {/* 用户文本消息 */}
                        {item.users && (
                            <div className="user-message">
                                <div className="message-content">
                                    <div className="text">{item.users}</div>
                                </div>
                            </div>
                        )}

                        {/* 用户图片消息 */}
                        {item.image && (
                            <div className="user-message">
                                <div className="message-content">
                                    <div className="image-container">
                                        <Image 
                                            src={item.image}
                                            width="200" 
                                            height="auto"
                                            fit="contain" 
                                            radius={8}
                                            onClick={() => {
                                                // 添加点击查看大图功能
                                                if (item.image) {
                                                    window.open(item.image, '_blank');
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 客服消息 */}
                        {item.text && (
                            <div className="service-message">
                                <div className="avatar">
                                    <Image
                                    width={35}
                                    height={35}
                                    src={'data:image/webp;base64,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'} />
                                </div>
                                <div className="message-content">
                                    <div className="name">
                                        客服小美
                                        <VolumeO
                                            className={`message-audio-icon ${isSpeaking ? 'speaking' : ''}`}
                                            onClick={() => speakText(item.text)}
                                        />
                                    </div>
                                    <div className="text">
                                        <ReactMarkdown>{item.text}</ReactMarkdown>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* 底部输入区域 */}
            <div className="chat-footer">
                <div className="input-wrapper">
                    {/* 图片预览区域 */}
                    {previewUrl && (
                        <div className="preview-container">
                            <div className="preview-image">
                                <Image src={previewUrl} width="80" height="80" fit="cover" radius={4} />
                                <div className="preview-remove" onClick={removeImage}>×</div>
                            </div>
                        </div>
                    )}
                    <Input.TextArea
                        value={inputMessage}
                        onChange={setInputMessage}
                        placeholder={selectedImage ? "添加图片描述..." : "请输入消息"}
                        rows={1}
                        autoSize
                    />
                    {/* 隐藏的文件输入 */}
                    <input 
                        type="file" 
                        accept="image/*"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        onChange={handleImageSelect}
                    />
                </div>
                <div className="footer-actions">
                    <Smile className="action-icon" />
                    <Photograph 
                        className={`action-icon ${selectedImage ? 'selected' : ''}`}
                        onClick={triggerFileInput}
                    />
                    <VolumeO
                        className={`action-icon ${isListening ? 'listening' : ''}`}
                        onClick={toggleListening}
                    />
                    <Button
                        type="primary"
                        size="small"
                        onClick={handleSend}
                    >
                        发送
                    </Button>
                </div>
            </div>
        </div>
    );
}
