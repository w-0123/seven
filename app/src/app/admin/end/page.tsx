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
      securityJsCode: "3ab941036521c4fc367d596ead071a10",
    };

    // 加载高德地图API
    AMapLoader.load({
      key: "2fd038c0ccf4239b38c772b817c575a9",
      version: "1.4.15",
      plugins: ["AMap.Autocomplete"]
    })
      .then((AMap) => {
        console.log("高德地图API加载成功");

        // 创建自动完成实例
        const autoComplete = new AMap.Autocomplete({
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
  const handleSelectSuggestion = async (suggestion: any) => {
    let lng = suggestion.location?.lng;
    let lat = suggestion.location?.lat;
    let name = suggestion.name;

    // 新建行程对象
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

    // 如果没有经纬度，调用PlaceSearch查一次
    if (!lng || !lat) {
      try {
        const AMap = await AMapLoader.load({
          key: "2fd038c0ccf4239b38c772b817c575a9",
          version: "1.4.15",
          plugins: ["AMap.PlaceSearch"]
        });
        const placeSearch = new AMap.PlaceSearch({
          city: "全国",
          citylimit: false
        });
        placeSearch.search(name, (status: string, result: any) => {
          if (status === 'complete' && result.poiList && result.poiList.pois.length > 0) {
            const poi = result.poiList.pois[0];
            if (poi.location) {
              lng = poi.location.lng;
              lat = poi.location.lat;
              router.push(`/admin/confirm?lng=${lng}&lat=${lat}&name=${encodeURIComponent(name)}&tripId=${newTrip.id}`);
            } else {
              alert('未获取到目的地坐标，无法导航');
            }
          } else {
            alert('未获取到目的地坐标，无法导航');
          }
        });
        return;
      } catch (e) {
        alert('地图服务异常，无法获取坐标');
        return;
      }
    }
    // 有经纬度直接跳转
    router.push(`/admin/confirm?lng=${lng}&lat=${lat}&name=${encodeURIComponent(name)}&tripId=${newTrip.id}`);
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
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <div style={{
        maxWidth: '28rem',
        margin: '0 auto',
        backgroundColor: '#ffffff',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden'
      }}>
        {/* 顶部搜索栏和取消按钮 */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem',
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #eaeaea'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            flexGrow: 1,
            marginRight: '1rem',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            padding: '0.5rem 1rem',
            backgroundColor: '#f8f8f8',
            position: 'relative'
          }}>
            <span style={{ color: '#333', fontWeight: '500', marginRight: '0.5rem' }}>目的地</span>
            <input
              type="text"
              ref={searchInputRef}
              placeholder="请输入目的地"
              style={{
                flexGrow: 1,
                outline: 'none',
                backgroundColor: 'transparent',
                marginLeft: '0.5rem',
                border: 'none',
                fontSize: '0.95rem',
                color: '#333'
              }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {isLoading && (
              <div style={{ marginLeft: '8px' }}>
                <svg xmlns="http://www.w3.org/2000/svg" style={{ height: '1rem', width: '1rem', color: '#666', animation: 'spin 1s linear infinite' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
            )}
          </div>
          <button
            style={{
              color: '#666',
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              fontSize: '0.95rem',
              padding: '0.5rem 0.75rem',
              fontWeight: '500'
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
              backgroundColor: 'white',
              border: '1px solid #eaeaea',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              maxHeight: '300px',
              overflowY: 'auto',
              marginTop: '4px',
              width: 'calc(100% - 4.5rem)',
              marginLeft: '1.25rem',
              maxWidth: '24rem'
            }}
          >
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                onClick={() => handleSelectSuggestion(suggestion)}
                style={{
                  padding: '12px 16px',
                  cursor: 'pointer',
                  backgroundColor: index === selectedIndex ? '#f5f5f5' : 'white',
                  borderBottom: index < suggestions.length - 1 ? '1px solid #f0f0f0' : 'none',
                  transition: 'background-color 0.2s'
                }}
              >
                <div style={{
                  fontWeight: '500',
                  fontSize: '0.95rem',
                  color: '#333',
                  marginBottom: '4px'
                }}>{suggestion.name}</div>
                <div style={{
                  fontSize: '0.85rem',
                  color: '#666',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <span>{suggestion.district}</span>
                  {suggestion.address && (
                    <>
                      <span>·</span>
                      <span>{suggestion.address}</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 常用地址 */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-around',
          padding: '1.25rem',
          borderBottom: '1px solid #eaeaea',
          backgroundColor: '#ffffff'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.75rem 1rem',
            cursor: 'pointer',
            borderRadius: '8px',
            backgroundColor: '#f8f8f8',
            transition: 'background-color 0.2s'
          }}>
            <div style={{ color: '#666' }}>
              <svg xmlns="http://www.w3.org/2000/svg" style={{ height: '1.5rem', width: '1.5rem' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: '500', color: '#333' }}>家</div>
              <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '2px' }}>大江苑</div>
            </div>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.75rem 1rem',
            cursor: 'pointer',
            borderRadius: '8px',
            backgroundColor: '#f8f8f8',
            transition: 'background-color 0.2s'
          }}>
            <div style={{ color: '#666' }}>
              <svg xmlns="http://www.w3.org/2000/svg" style={{ height: '1.5rem', width: '1.5rem' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: '500', color: '#333' }}>公司</div>
              <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '2px' }}>设置公司的地址</div>
            </div>
          </div>
        </div>

        {/* 行程列表 */}
        <div style={{ backgroundColor: '#ffffff' }}>
          {loading ? (
            <div style={{
              padding: '2rem',
              textAlign: 'center',
              color: '#666',
              fontSize: '0.95rem'
            }}>加载中...</div>
          ) : error ? (
            <div style={{
              padding: '2rem',
              textAlign: 'center',
              color: '#ff4d4f',
              fontSize: '0.95rem'
            }}>{error}</div>
          ) : filteredTrips.length === 0 ? (
            <div style={{
              padding: '2rem',
              textAlign: 'center',
              color: '#666',
              fontSize: '0.95rem'
            }}>没有找到匹配的行程</div>
          ) : (
            filteredTrips.map((trip) => (
              <div
                key={trip.id}
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  borderBottom: '1px solid #eaeaea',
                  height: '88px',
                  backgroundColor: '#ffffff'
                }}
              >
                {/* 主内容区域 */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    flexGrow: 1,
                    padding: '1rem 1.25rem',
                    backgroundColor: '#ffffff',
                    transition: 'transform 300ms ease-out',
                    cursor: 'pointer',
                    transform: swipedItemId === trip.id ? 'translateX(-80px)' : 'translateX(0)'
                  }}
                  onClick={() => handleTripClick(trip)}
                >
                  {/* 地址定位图标 */}
                  <div style={{
                    marginRight: '1rem',
                    flexShrink: 0,
                    color: '#666',
                    backgroundColor: '#f5f5f5',
                    padding: '0.5rem',
                    borderRadius: '8px'
                  }}>
                    <svg xmlns="http://www.w3.org/2000/svg" style={{ height: '1.25rem', width: '1.25rem' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c1.657 0 3 .895 3 2s-1.343 2-3 2-3-.895-3-2 1.343-2 3-2z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18V8" />
                      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" fill="none" />
                    </svg>
                  </div>
                  <div style={{ flexGrow: 1 }}>
                    <div style={{
                      fontWeight: '500',
                      fontSize: '0.95rem',
                      color: '#333',
                      marginBottom: '4px'
                    }}>{trip.destination}</div>
                    <div style={{
                      fontSize: '0.85rem',
                      color: '#666',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <span>{trip.address}</span>
                      <span>·</span>
                      <span>{new Date(trip.createdAt).toLocaleDateString()}</span>
                    </div>
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
                    backgroundColor: '#ff4d4f',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'transform 300ms ease-out',
                    transform: swipedItemId === trip.id ? 'translateX(0)' : 'translateX(100%)',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.95rem',
                    fontWeight: '500'
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