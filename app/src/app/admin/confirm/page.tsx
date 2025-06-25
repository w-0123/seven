"use client";
import React, { useEffect, useRef, useState } from "react";
import AMapLoader from "@amap/amap-jsapi-loader";
import { NavBar } from 'antd-mobile';
import { useSearchParams, useRouter } from 'next/navigation';


interface CarItem {
  name: string;
  icon: string;
  desc: string[];
  pricePerKm: number;
  discount: string;
}

// 车型与专车数据

const carTypes = [
  { name: "出租车", price: "计价器计价", tag: "3" },
  { name: "经济型", price: "16元起", tag: "3" },
  { name: "舒适型", price: "33元起", tag: "3" },
  { name: "商务型", price: "53元起", tag: "3" },
  { name: "豪华型", price: "61元起", tag: "3" },
];
const carListMap: { [key: string]: CarItem[] } = {
  "出租车": [
    {
      name: "香蕉专车",
      icon: "https://img.icons8.com/color/48/000000/taxi.png",
      desc: ["隐私保护", "测温消毒"],
      pricePerKm: 0.6,
      discount: "优惠已减14元",
    },
    {
      name: "扇骨出行",
      icon: "https://img.icons8.com/color/48/000000/taxi.png",
      desc: ["隐私保护", "测温消毒"],
      pricePerKm: 0.5,
      discount: "优惠已减14元",
    },
    {
      name: "石榴出行",
      icon: "https://img.icons8.com/color/48/000000/taxi.png",
      desc: ["隐私保护", "测温消毒"],
      pricePerKm: 0.8,
      discount: "优惠已减14元",
    },
  ],
  "经济型": [
    {
      name: "经济快车",
      icon: "https://img.icons8.com/color/48/000000/taxi.png",
      desc: ["经济实惠", "舒适座椅"],
      pricePerKm: 1.1,
      discount: "新客立减10元",
    },
    {
      name: "经济拼车",
      icon: "https://img.icons8.com/color/48/000000/taxi.png",
      desc: ["拼车更省", "多人同行"],
      pricePerKm: 0.9,
      discount: "拼车立减5元",
    },
  ],
  "舒适型": [
    {
      name: "舒适专车",
      icon: "https://img.icons8.com/color/48/000000/taxi.png",
      desc: ["宽敞空间", "专业司机"],
      pricePerKm: 1.5,
      discount: "舒适体验",
    },
  ],
  "商务型": [
    {
      name: "商务专车",
      icon: "https://img.icons8.com/color/48/000000/taxi.png",
      desc: ["高端商务", "专属服务"],
      pricePerKm: 2.0,
      discount: "商务专享",
    },
  ],
  "豪华型": [
    {
      name: "豪华专车",
      icon: "https://img.icons8.com/color/48/000000/taxi.png",
      desc: ["豪华座驾", "尊贵体验"],
      pricePerKm: 3.0,
      discount: "尊享豪华",
    },
  ],
};

// 计算预计价格
const getEstimate = (pricePerKm: number, distance: number | null, type: string) => {
  if (!distance) return '--';
  // 出租车类型用单价*公里数
  if (type === '出租车') {
    return (pricePerKm * distance).toFixed(2);
  }
  // 其它类型按原有逻辑
  return Math.round(pricePerKm * distance);
};

const MapContainer = ({ 
  setDistance, 
  isCarSelectionVisible, 
  setIsCarSelectionVisible 
}: { 
  setDistance: React.Dispatch<React.SetStateAction<number | null>>,
  isCarSelectionVisible: boolean,
  setIsCarSelectionVisible: React.Dispatch<React.SetStateAction<boolean>>
}) => {
  const searchParams = useSearchParams();
  const destLng = searchParams.get('lng');
  const destLat = searchParams.get('lat');
  useEffect(() => {
    window._AMapSecurityConfig = {
      securityJsCode: "3ab941036521c4fc367d596ead071a10",
    };
    let map: any = null;
    let marker: any = null;
    let driving: any = null;
    let endMarker: any = null;
    let polyline: any = null;
    let carMarker: any = null;
    AMapLoader.load({
      key: "2fd038c0ccf4239b38c772b817c575a9",
      version: "1.4.15",
      plugins: [
        "AMap.Scale",
        "AMap.PlaceSearch",
        "AMap.Autocomplete",
        "AMap.Geolocation",
        "AMap.Driving",
      ],
    })
      .then((AMap: any) => {
        map = new AMap.Map("container", {
          viewMode: "3D",
          zoom: 13,
          center: [116.397428, 39.90923],
          resizeEnable: true,
        });
        // 自动定位到用户当前位置
        const geolocation = new AMap.Geolocation({
          enableHighAccuracy: true,
          timeout: 10000,
          buttonPosition: 'RB',
          zoomToAccuracy: true,
        });
        map.addControl(geolocation);
        geolocation.getCurrentPosition((status: any, result: any) => {
          if (status === 'complete' && destLng && destLat) {
            const startLngLat = [result.position.lng, result.position.lat];
            const endLngLat = [Number(destLng), Number(destLat)];
            // 路径规划
            driving = new AMap.Driving({
              map: map,
              showTraffic: false
            });
            driving.search(startLngLat, endLngLat, function(status: any, res: any) {
              if (status === 'complete' && res.routes && res.routes.length > 0) {
                // 获取路径坐标点
                const path = res.routes[0].steps.flatMap((step: any) => step.path);

                // 转换 AMap.LngLat 对象为 { lng, lat } 格式，以便正确存储和解析
                const formattedPathForStorage = path.map((p: any) => ({ lng: p.lng, lat: p.lat }));
                const formattedStartForStorage = { lng: path[0].lng, lat: path[0].lat };
                const formattedEndForStorage = { lng: path[path.length - 1].lng, lat: path[path.length - 1].lat };

                // 立刻写入 carTrack，currentIndex=0
                localStorage.setItem('carTrack', JSON.stringify({
                  currentIndex: 0,
                  path: formattedPathForStorage,
                  start: formattedStartForStorage,
                  end: formattedEndForStorage,
                }));
                // 1. 画蓝色轨迹线
                polyline = new AMap.Polyline({
                  path: path,
                  isOutline: true,
                  outlineColor: '#ffeeff',
                  borderWeight: 2,
                  strokeColor: '#2574ff',
                  strokeWeight: 6,
                  strokeOpacity: 0.9,
                  lineJoin: 'round'
                });
                map.add(polyline);
                // 3. 添加起点小车marker
                if (!carMarker) {
                  carMarker = new AMap.Marker({
                    position: startLngLat,
                    icon: 'https://webapi.amap.com/images/car.png',
                    offset: new AMap.Pixel(-26, -13),
                    anchor: 'center',
                  });
                  map.add(carMarker);
                }
                // 4. 视野适配所有元素（只传已存在对象，避免 null 报错）
                const fitViewObjs = [polyline, carMarker];
                if (endMarker) fitViewObjs.push(endMarker);
                map.setFitView(fitViewObjs);
                // 5. 显示总公里数
                if (res.routes[0].distance) {
                  setDistance(res.routes[0].distance / 1000); // 单位米转公里
                  console.log('设置的公里数:', res.routes[0].distance / 1000);
                }
                // 在地图轨迹和小车动画部分，补充如下：
                carMarker.moveAlong(path, {
                  duration: 8000,
                  autoRotation: true,
                  onMoving: (e: any) => {
                    const currentIndex = e.passedPath.length;
                    // 在更新 localStorage 时也确保经纬度格式正确
                    localStorage.setItem('carTrack', JSON.stringify({
                      currentIndex,
                      path: formattedPathForStorage, // 使用已格式化的路径
                      start: formattedStartForStorage,
                      end: formattedEndForStorage,
                    }));
                  }
                });
              }
            });
          }
        });
      })
      .catch(() => {});
    return () => {
      map?.destroy();
    };
  }, [destLng, destLat]);

  // 路径距离悬浮显示
  return (
    <>
      <div style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
        <div
          id="container"
          style={{ width: "100%", height: "100%" }}
        ></div>
        {/* 安全中心浮层 */}
        <div style={{ position: "absolute", left: 16, top: 70, background: "#fff", borderRadius: 20, boxShadow: "0 2px 8px #0001", display: "flex", alignItems: "center", padding: "4px 12px", fontSize: 14, zIndex: 2 }}>
          <img src="https://img.alicdn.com/imgextra/i2/O1CN01QwQw2B1QwQwQwQwQw_!!6000000000000-2-tps-32-32.png" alt="安全" style={{ width: 20, height: 20, marginRight: 6 }} />
          安全中心
        </div>
        
        {/* 收起/展开按钮 */}
        <div 
          style={{ 
            position: "absolute", 
            right: 16, 
            bottom: isCarSelectionVisible ? 340 : 24, 
            background: "linear-gradient(135deg, #2574ff, #5297ff)",
            borderRadius: "50%", 
            width: 48, 
            height: 48,
            boxShadow: "0 4px 16px rgba(37, 116, 255, 0.4)",
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center",
            cursor: "pointer",
            zIndex: 100,
            transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
            transform: isCarSelectionVisible ? 'scale(1)' : 'scale(1.05)'
          }}
          onClick={() => setIsCarSelectionVisible(!isCarSelectionVisible)}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="22" 
            height="22" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="#ffffff" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            style={{ 
              transform: isCarSelectionVisible ? 'rotate(0deg)' : 'rotate(180deg)', 
              transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
              transformOrigin: 'center'
            }}
          >
            <path d="M18 15l-6-6-6 6"/>
          </svg>
        </div>
      </div>
    </>
  );
};

const ConfirmPage = () => {
  const [selectedType, setSelectedType] = useState(0); // 车型索引
  const [selectedCar, setSelectedCar] = useState(carListMap[carTypes[0].name][0].name);
  const [distance, setDistance] = useState<number | null>(null);
  const [isCarSelectionVisible, setIsCarSelectionVisible] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [name, setName] = useState('');
  const [lng, setLng] = useState('');
  const [lat, setLat] = useState('');
  const [tripId, setTripId] = useState<string | null>(null);

  // 切换车型时，专车默认选第一个
  useEffect(() => {
    setSelectedCar(carListMap[carTypes[selectedType].name][0].name);
  }, [selectedType]);

  // 监听 MapContainer 设置的距离
  (window as any).setConfirmPageDistance = setDistance;

  useEffect(() => {
    const destinationName = searchParams.get('name');
    const destinationLng = searchParams.get('lng');
    const destinationLat = searchParams.get('lat');
    const currentTripId = searchParams.get('tripId');

    if (destinationName) {
      setName(destinationName);
    }
    if (destinationLng) {
      setLng(destinationLng);
    }
    if (destinationLat) {
      setLat(destinationLat);
    }
    if (currentTripId) {
      setTripId(currentTripId);
    }
  }, [searchParams]);

  const handleConfirm = () => {
    if (tripId) {
      router.push(`/admin/dispatch?tripId=${tripId}`);
    } else {
      alert('未获取到行程ID，无法叫车。');
    }
  };

  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden", position: "relative", background: "#f7f8fa" }}>
      {/* 顶部栏 */}
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 10 }}>
        <NavBar 
          backArrow={
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          } 
          onBack={() => history.back()} 
          style={{ 
            background: 'rgba(255, 255, 255, 0.95)', 
            fontWeight: 600, 
            fontSize: 18, 
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)', 
            backdropFilter: 'blur(10px)',
            borderRadius: '0 0 24px 24px',
            padding: '12px 0'
          }}
        >
          <span style={{ background: 'linear-gradient(90deg, #2574ff, #5297ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>确认用车</span>
        </NavBar>
      </div>
      {/* 地图全屏 */}
      <div style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
        <MapContainer 
        setDistance={setDistance} 
        isCarSelectionVisible={isCarSelectionVisible}
        setIsCarSelectionVisible={setIsCarSelectionVisible}
      />
      </div>
      {/* 悬浮底部内容 */}
      <div style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 20,
        padding: "0 0 16px 0",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        pointerEvents: "none"
      }}>
        <div style={{
          width: "96%",
          margin: "0 auto",
          background: "#fff",
          borderRadius: "24px 24px 0 0",
          boxShadow: "0 4px 24px #0002",
          padding: "20px 0 0 0",
          pointerEvents: "auto",
          transform: isCarSelectionVisible ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.3s ease-in-out'
        }}>
          {/* 行程公里数显示 */}
          {distance !== null ? (
            <div style={{
              textAlign: 'center', 
              margin: '8px 0 16px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}>
              <div style={{
                background: 'linear-gradient(90deg, #2574ff, #5297ff)', 
                WebkitBackgroundClip: 'text', 
                WebkitTextFillColor: 'transparent',
                fontWeight: 600, 
                fontSize: 22,
              }}>
                本次行程约 {distance.toFixed(2)} 公里
              </div>
              <div style={{
                fontSize: 12,
                color: '#888',
                marginTop: 4,
                background: '#f5f8ff',
                padding: '2px 10px',
                borderRadius: 12
              }}>
                预计行程时间 {Math.ceil(distance * 3)} 分钟
              </div>
            </div>
          ) : (
            <div style={{
              textAlign: 'center', 
              color: '#888', 
              fontWeight: 500, 
              fontSize: 16, 
              margin: '8px 0 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <div style={{
                width: 16,
                height: 16,
                borderRadius: '50%',
                border: '2px solid transparent',
                borderTopColor: '#2574ff',
                borderLeftColor: '#2574ff',
                animation: 'spin 1s linear infinite',
                marginRight: 8
              }}></div>
              正在获取距离...
              <style jsx global>{`
                @keyframes spin {
                  to { transform: rotate(360deg); }
                }
              `}</style>
            </div>
          )}
          {/* 车型选择栏 */}
          <div style={{ 
            display: "flex", 
            overflowX: "auto", 
            borderRadius: 16,
            margin: "0 16px", 
            padding: "4px 4px 8px",
            position: "relative", 
            zIndex: 2,
            scrollbarWidth: "none" // Firefox
          }}>
            <style jsx global>{`
              div::-webkit-scrollbar {
                display: none;
              }
            `}</style>
            {carTypes.map((item, idx) => (
              <div
                key={item.name}
                onClick={() => setSelectedType(idx)}
                style={{
                  flex: "0 0 auto",
                  margin: "0 6px",
                  padding: "10px 16px",
                  borderRadius: 16,
                  background: selectedType === idx ? "linear-gradient(135deg, #2574ff, #5297ff)" : "#f5f8ff",
                  color: selectedType === idx ? "#fff" : "#222",
                  fontWeight: 500,
                  boxShadow: selectedType === idx ? "0 6px 16px rgba(37, 116, 255, 0.3)" : "none",
                  fontSize: 16,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  cursor: "pointer",
                  minWidth: 92,
                  justifyContent: "center",
                  position: "relative",
                  transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  transform: selectedType === idx ? 'translateY(-2px)' : 'translateY(0)',
                }}
              >
                <span style={{ 
                  fontWeight: 700,
                  margin: "0 0 2px 0",
                  fontSize: selectedType === idx ? 17 : 16
                }}>{item.name}</span>
                <span style={{ 
                  fontSize: 13, 
                  color: selectedType === idx ? "rgba(255,255,255,0.9)" : "#666",
                  fontWeight: 400
                }}>{item.price}</span>
                {item.tag && (
                  <div style={{ 
                    position: "absolute",
                    top: -6,
                    right: -6,
                    fontSize: 12,
                    background: selectedType === idx ? "#fff" : "#2574ff",
                    color: selectedType === idx ? "#2574ff" : "#fff",
                    borderRadius: 12,
                    padding: "0 8px",
                    height: 20,
                    lineHeight: "20px",
                    fontWeight: 700,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
                  }}>{item.tag}</div>
                )}
              </div>
            ))}
          </div>
          {/* 费用提示横幅 */}
          <div style={{ 
            background: "linear-gradient(90deg, #e6f0ff, #f0f7ff)", 
            color: "#2574ff", 
            fontSize: 13, 
            margin: "16px 16px 0 16px", 
            borderRadius: 12, 
            padding: "10px 14px",
            display: "flex",
            alignItems: "center",
            boxShadow: "0 2px 12px rgba(37, 116, 255, 0.1)",
            border: "1px solid rgba(37, 116, 255, 0.1)"
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2574ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 8, flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M12 8v4M12 16h.01"></path>
            </svg>
            本行程可能经过收费路段，若产生高速费需另行支付
          </div>
          {/* 专车选项卡片 */}
          <div style={{ margin: "16px 16px 0 16px" }}>
            {carListMap[carTypes[selectedType].name].map((item: CarItem, idx: number) => {
              const isSelected = item.name === selectedCar;
              return (
                <div 
                  key={item.name} 
                  onClick={() => setSelectedCar(item.name)}
                  style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    background: isSelected ? "linear-gradient(135deg, #f8fbff, #ffffff)" : "#fff", 
                    borderRadius: 20, 
                    boxShadow: isSelected 
                      ? "0 8px 24px rgba(37, 116, 255, 0.15)" 
                      : "0 2px 12px rgba(0, 0, 0, 0.05)", 
                    marginBottom: 16, 
                    padding: "16px",
                    position: "relative",
                    border: isSelected ? "2px solid #2574ff" : "2px solid transparent",
                    transition: "all 0.3s ease",
                    cursor: "pointer",
                    transform: isSelected ? "translateY(-2px)" : "translateY(0)"
                  }}
                >
                  <div style={{
                    width: 44, 
                    height: 44, 
                    borderRadius: 12,
                    marginRight: 12,
                    overflow: "hidden",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    position: "relative"
                  }}>
                    <img 
                      src={item.icon} 
                      alt={item.name} 
                      style={{ 
                        width: "100%", 
                        height: "100%", 
                        objectFit: 'cover',
                        borderRadius: 16
                      }} 
                    />
                    {isSelected && (
                      <div style={{
                        position: "absolute",
                        inset: 0,
                        background: "rgba(37, 116, 255, 0.2)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}>
                        <div style={{
                          width: 24,
                          height: 24,
                          borderRadius: "50%",
                          background: "#2574ff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#fff",
                          fontSize: 14,
                          fontWeight: 700
                        }}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 17, color: isSelected ? "#2574ff" : "#222" }}>
                      {item.name}
                    </div>
                    <div style={{ display: "flex", gap: 8, margin: "6px 0" }}>
                      {item.desc.map((d: string) => (
                        <span key={d} style={{ 
                          fontSize: 12, 
                          color: isSelected ? "#2574ff" : "#666", 
                          background: isSelected ? "rgba(37, 116, 255, 0.08)" : "#f5f8ff", 
                          borderRadius: 10,
                          padding: "3px 10px",
                          fontWeight: 500
                        }}>{d}</span>
                      ))}
                    </div>
                    <div style={{ 
                      fontSize: 13, 
                      color: "#ff6b2b",
                      fontWeight: 500,
                      display: "inline-block",
                      background: "rgba(255, 107, 43, 0.1)",
                      padding: "2px 8px",
                      borderRadius: 10
                    }}>
                      {item.discount}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                    <div style={{ 
                      fontWeight: 700, 
                      fontSize: isSelected ? 22 : 20, 
                      color: isSelected ? "#2574ff" : "#333", 
                      marginBottom: '10px',
                      background: isSelected ? "linear-gradient(90deg, #2574ff, #5297ff)" : "none",
                      WebkitBackgroundClip: isSelected ? 'text' : 'unset',
                      WebkitTextFillColor: isSelected ? 'transparent' : 'unset',
                    }}>
                      ¥{getEstimate(item.pricePerKm, distance, carTypes[selectedType].name)}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // 阻止冒泡，避免触发卡片点击事件
                        if (tripId) {
                          router.push(`/admin/chat?tripId=${tripId}`);
                        } else {
                          alert('未获取到行程ID，无法开始聊天。');
                        }
                      }}
                      style={{ 
                        padding: "6px 14px", 
                        background: isSelected ? "linear-gradient(90deg, #2574ff, #5297ff)" : "#f5f8ff", 
                        color: isSelected ? "#fff" : "#2574ff", 
                        borderRadius: 16, 
                        border: "none", 
                        fontSize: 14,
                        fontWeight: 600,
                        boxShadow: isSelected ? "0 4px 12px rgba(37, 116, 255, 0.3)" : "none",
                        transition: "all 0.3s ease"
                      }}
                    >
                      与司机对话
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          {/* 底部按钮 */}
          <button
            style={{ 
              width: "92%", 
              height: 52, 
              background: "linear-gradient(90deg, #2574ff, #5297ff)", 
              color: "#fff", 
              fontSize: 18, 
              fontWeight: 700, 
              border: "none", 
              borderRadius: 26, 
              boxShadow: "0 8px 24px rgba(37, 116, 255, 0.4)", 
              zIndex: 20, 
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "24px auto 16px auto",
              pointerEvents: 'auto',
              transition: "transform 0.3s ease, box-shadow 0.3s ease",
              position: "relative",
              overflow: "hidden"
            }}
            onClick={handleConfirm}
            onMouseDown={(e) => e.currentTarget.style.transform = "scale(0.98)"}
            onMouseUp={(e) => e.currentTarget.style.transform = "scale(1)"}
          >
            <span style={{ position: "relative", zIndex: 2 }}>立即叫车</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 8, position: "relative", zIndex: 2 }}>
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
            <div style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              background: "radial-gradient(circle, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 70%)",
              opacity: 0.6,
              transform: "scale(2)",
              zIndex: 1
            }}></div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmPage;