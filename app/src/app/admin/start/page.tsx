"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { tripdata } from '@/api';
import AMapLoader from "@amap/amap-jsapi-loader";

// 扩展 Window 接口以包含 _AMapSecurityConfig
declare global {
  interface Window {
    _AMapSecurityConfig: {
      securityJsCode: string;
    };
  }
}

// 定义搜索建议项接口
interface Suggestion {
  name: string;
  address: string;
  district: string;
  location: { lng: number; lat: number };
}

interface Trip {
  id: number;
  destination: string;
  address: string;
  pickup: string;
  createdAt: string;
}

export default function StartPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [swipedItemId, setSwipedItemId] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionContainerRef = useRef<HTMLDivElement>(null);

  // 初始化高德地图API
  useEffect(() => {
    // 配置高德地图安全密钥
    window._AMapSecurityConfig = {
      securityJsCode: "bc85185b03fc9a32c0a1f023a1addd87",
    };

    // 加载高德地图API
    AMapLoader.load({
      key: "0710f43e6881294242c7d4d1eb47d192",
      version: "1.4.15",
      plugins: ["AMap.Autocomplete"]
    })
    .then((AMap) => {
      console.log("高德地图API加载成功");
      
      // 创建自动完成实例
      const autoComplete = new AMap.Autocomplete({
        input: searchInputRef.current,
        city: "全国",
        datatype: "poi",
        citylimit: true
      });
      
      // 监听选择事件
      autoComplete.on("select", (e: any) => {
        console.log("用户选择了:", e.poi);
        setSearchTerm(e.poi.name);
        setSuggestions([]);
        handleSelectSuggestion(e.poi);
      });
      
      // 监听搜索结果事件
      autoComplete.on("complete", (data: any) => {
        setIsLoading(false);
        if (data && data.tips && data.tips.length > 0) {
          setSuggestions(data.tips as Suggestion[]);
        } else {
          setSuggestions([]);
        }
      });
      
      // 监听输入变化
      const handleInputChange = () => {
        const text = searchInputRef.current?.value || "";
        setSearchTerm(text);
        
        if (text.length >= 2) {
          setIsLoading(true);
          autoComplete.search(text);
        } else {
          setSuggestions([]);
        }
      };
      
      // 添加输入事件监听
      if (searchInputRef.current) {
        searchInputRef.current.addEventListener("input", handleInputChange);
      }
      
      // 组件卸载时清理
      return () => {
        if (searchInputRef.current) {
          searchInputRef.current.removeEventListener("input", handleInputChange);
        }
        autoComplete.destroy();
      };
    })
    .catch((error) => {
      console.error("高德地图API加载失败:", error);
      setError("地图服务加载失败，请检查网络连接");
    });

    // 加载行程数据
    const fetchTrips = async () => {
      try {
        const data = await tripdata();
        const localTrips = JSON.parse(localStorage.getItem('localTrips') || '[]');
        setTrips([...localTrips, ...(Array.isArray(data) ? data : [])]);
      } catch (error) {
        console.error('Error fetching trips:', error);
        setError('加载行程数据失败，请稍后重试');
        setTrips([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTrips();
  }, []);

  // 处理键盘导航
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!suggestions.length) return;
      
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % suggestions.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
      } else if (e.key === "Enter" && selectedIndex >= 0) {
        e.preventDefault();
        const selected = suggestions[selectedIndex];
        handleSelectSuggestion(selected);
      }
    };
    
    document.addEventListener("keydown", handleKeyDown);
    
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [suggestions, selectedIndex]);

  // 点击外部关闭建议框
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchInputRef.current && 
        suggestionContainerRef.current &&
        !searchInputRef.current.contains(e.target as Node) &&
        !suggestionContainerRef.current.contains(e.target as Node)
      ) {
        setSuggestions([]);
        setSelectedIndex(-1);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // 处理选择建议项
  const handleSelectSuggestion = (suggestion: any) => {
    const newTrip: Trip = {
      id: Date.now(),
      destination: suggestion.name,
      address: suggestion.address || suggestion.name,
      pickup: "当前位置",
      createdAt: new Date().toISOString()
    };

    setTrips(prevTrips => [newTrip, ...prevTrips]);
    const localTrips = JSON.parse(localStorage.getItem('localTrips') || '[]');
    localStorage.setItem('localTrips', JSON.stringify([newTrip, ...localTrips]));
    
    setSearchTerm('');
    setSuggestions([]);
    setSelectedIndex(-1);
  };

  // 处理删除行程
  const handleDeleteTrip = (id: number) => {
    if (window.confirm('确定要删除此行程吗？')) {
      setTrips(prevTrips => prevTrips.filter(trip => trip.id !== id));
      const localTrips = JSON.parse(localStorage.getItem('localTrips') || '[]');
      const updatedLocalTrips = localTrips.filter((trip: Trip) => trip.id !== id);
      localStorage.setItem('localTrips', JSON.stringify(updatedLocalTrips));
      setSwipedItemId(null);
    }
  };

  // 处理行程点击
  const handleTripClick = (trip: Trip) => {
    if (swipedItemId === trip.id) {
      setSwipedItemId(null);
    } else if (swipedItemId !== null) {
      setSwipedItemId(null);
      setTimeout(() => {
        router.push(`/admin/trips/detail?id=${trip.id}`);
      }, 0);
    } else {
      router.push(`/admin/trips/detail?id=${trip.id}`);
    }
  };

  // 过滤行程
  const filteredTrips = trips.filter(trip =>
    trip.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(trip.address).toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
      <div style={{
        maxWidth: '28rem',
        margin: '0 auto',
        backgroundColor: '#ffffff',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        overflow: 'hidden'
      }}>
        {/* 顶部搜索栏和取消按钮 */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem',
          backgroundColor: '#f8f8f8'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            flexGrow: 1,
            marginRight: '1rem',
            border: '1px solid #d1d5db',
            borderRadius: '9999px',
            paddingLeft: '0.75rem',
            paddingRight: '0.75rem',
            paddingTop: '0.5rem',
            paddingBottom: '0.5rem',
            backgroundColor: '#ffffff',
            position: 'relative'
          }}>
            <span style={{ color: '#4b5563', fontWeight: 'bold', marginRight: '0.5rem' }}>地址</span>
            <svg xmlns="http://www.w3.org/2000/svg" style={{ height: '1rem', width: '1rem', color: '#6b7280' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            <input
              type="text"
              ref={searchInputRef}
              placeholder="您在哪儿上车"
              style={{
                flexGrow: 1,
                outline: 'none',
                backgroundColor: 'transparent',
                marginLeft: '0.5rem',
                border: 'none'
              }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {isLoading && (
              <div style={{ marginLeft: '8px' }}>
                <svg xmlns="http://www.w3.org/2000/svg" style={{ height: '1rem', width: '1rem', color: '#6b7280', animation: 'spin 1s linear infinite' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
            )}
          </div>
          <button 
            style={{ 
              color: '#4b5563',
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              fontSize: '1rem',
              padding: '0.5rem 0.75rem'
            }}
            onClick={() => router.back()}
          >
            取消
          </button>
        </div>

        {/* 搜索建议列表 */}
        {suggestions.length > 0 && (
          <div
            ref={suggestionContainerRef}
            style={{
              position: 'absolute',
              zIndex: 100,
              right: 0,
              margin: '0 auto',
              background: 'rgba(255,255,255,0.98)',
              border: '1.5px solid #e5e7eb',
              borderRadius: '16px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
              maxHeight: '320px',
              overflowY: 'auto',
              marginTop: '0.5rem',
              width: 'calc(100% - 2rem)',
              left: '1rem',
            }}
          >
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                onClick={() => handleSelectSuggestion(suggestion)}
                style={{
                  padding: '14px 18px',
                  cursor: 'pointer',
                  background: index === selectedIndex ? '#f1f5ff' : 'transparent',
                  borderBottom: index < suggestions.length - 1 ? '1px solid #f3f4f6' : 'none',
                  transition: 'background 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2
                }}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <span style={{ fontWeight: 600, fontSize: 16, color: '#222' }}>{suggestion.name}</span>
                <span style={{ fontSize: 13, color: '#888', marginTop: 2 }}>{suggestion.district} {suggestion.address || ''}</span>
              </div>
            ))}
          </div>
        )}

        {/* 常用地址 */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-around',
          padding: '1rem',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            paddingLeft: '1rem',
            paddingRight: '1rem',
            paddingTop: '0.5rem',
            paddingBottom: '0.5rem',
            cursor: 'pointer',
            borderRadius: '0.5rem',
            backgroundColor: 'transparent'
          }}>
            <div style={{ color: '#6b7280' }}>
              <svg xmlns="http://www.w3.org/2000/svg" style={{ height: '1.5rem', width: '1.5rem' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: '1rem', fontWeight: '500' }}>家</div>
              <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>大江苑</div>
            </div>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            paddingLeft: '1rem',
            paddingRight: '1rem',
            paddingTop: '0.5rem',
            paddingBottom: '0.5rem',
            cursor: 'pointer',
            borderRadius: '0.5rem',
            backgroundColor: 'transparent'
          }}>
            <div style={{ color: '#6b7280' }}>
              <svg xmlns="http://www.w3.org/2000/svg" style={{ height: '1.5rem', width: '1.5rem' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: '1rem', fontWeight: '500' }}>公司</div>
              <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>设置公司的地址</div>
            </div>
          </div>
        </div>

        {/* 行程列表 */}
        <div>
          {loading ? (
            <div style={{ padding: '1rem', textAlign: 'center' }}>加载中...</div>
          ) : error ? (
            <div style={{ padding: '1rem', textAlign: 'center', color: '#ef4444' }}>{error}</div>
          ) : filteredTrips.length === 0 ? (
            <div style={{ padding: '1rem', textAlign: 'center' }}>没有找到匹配的行程</div>
          ) : (
            filteredTrips.map((trip) => (
              <div
                key={trip.id}
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  borderBottom: '1px solid #e5e7eb',
                  height: '80px'
                }}
              >
                {/* 主内容区域 */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    flexGrow: 1,
                    padding: '1rem',
                    backgroundColor: '#ffffff',
                    transition: 'transform 300ms ease-out',
                    cursor: 'pointer',
                    transform: swipedItemId === trip.id ? 'translateX(-80px)' : 'translateX(0)'
                  }}
                  onClick={() => handleTripClick(trip)}
                >
                  {/* 地址定位图标 */}
                  <div style={{ marginRight: '1rem', flexShrink: 0, color: '#9ca3af' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" style={{ height: '1.5rem', width: '1.5rem' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c1.657 0 3 .895 3 2s-1.343 2-3 2-3-.895-3-2 1.343-2 3-2z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18V8" />
                      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" fill="none"/>
                    </svg>
                  </div>
                  <div style={{ flexGrow: 1 }}>
                    <div style={{ fontWeight: '500', fontSize: '0.875rem' }}>{trip.destination}</div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{trip.address}</div>
                  </div>
                </div>

                {/* 删除按钮 */}
                <button
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: 0,
                    bottom: 0,
                    width: '80px',
                    backgroundColor: '#ef4444',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'transform 300ms ease-out',
                    transform: swipedItemId === trip.id ? 'translateX(0)' : 'translateX(100%)',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '1rem'
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteTrip(trip.id);
                  }}
                >
                  删除
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}