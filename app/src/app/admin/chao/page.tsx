"use client";
import React, { useEffect, useState } from "react";
import AMapLoader from "@amap/amap-jsapi-loader";
import { NavBar } from "antd-mobile";
import { useRouter, useSearchParams } from "next/navigation";

// 地图容器组件，含路径规划、定位、轨迹动画、距离浮层
const MapContainer = ({ setDistance }: { setDistance: React.SetStateAction<number | null> }) => {
  useEffect(() => {
    window._AMapSecurityConfig = {
      securityJsCode: "3ab941036521c4fc367d596ead071a10",
    };

    let map: any = null;
    let polyline: any = null;
    let carMarker: any = null;
    let startMarker: any = null;
    let endMarker: any = null;

    const carTrack = JSON.parse(localStorage.getItem('carTrack') || '{}');
    const { path = [], currentIndex = 0, start, end } = carTrack;

    // 检查轨迹数据是否有效
    if (!Array.isArray(path) || path.length < 2 || !start || !end || typeof start.lng === 'undefined' || typeof start.lat === 'undefined' || typeof end.lng === 'undefined' || typeof end.lat === 'undefined') {
      const container = document.getElementById('container');
      if (container) {
        container.innerHTML = '<div style="text-align:center;color:#888;margin-top:40px;padding:20px;font-size:16px;">暂无轨迹，请在<a href="/admin/confirm" style="color:#2574ff;">确认用车页</a>下单</div>';
      }
      return; // 退出 useEffect
    }

    // 转换 path, start, end 为高德地图需要的 [lng, lat] 格式
    const formattedPath = path.map((p: any) => [p.lng, p.lat]);
    const formattedStart = [start.lng, start.lat];
    const formattedEnd = [end.lng, end.lat];

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
    }).then((AMap: any) => {
      map = new AMap.Map("container", {
        viewMode: "3D",
        zoom: 14,
        center: formattedStart, // 以起点为中心
        resizeEnable: true,
      });

      // 起点marker
      startMarker = new AMap.Marker({
        position: formattedStart,
        icon: "https://webapi.amap.com/theme/v1.3/markers/n/start.png",
        anchor: "bottom-center",
        offset: new AMap.Pixel(0, -10), // 向上偏移，增加间距
        zIndex: 100, // 确保起点在最上层
      });
      map.add(startMarker);

      // 终点marker
      endMarker = new AMap.Marker({
        position: formattedEnd,
        icon: "https://webapi.amap.com/theme/v1.3/markers/n/end.png",
        anchor: "bottom-center",
        offset: new AMap.Pixel(0, -10), // 向上偏移，增加间距
        zIndex: 100, // 确保终点在最上层
      });
      map.add(endMarker);

      // 轨迹线
      polyline = new AMap.Polyline({
        path: formattedPath,
        isOutline: true,
        outlineColor: "#ffeeff",
        borderWeight: 3, // 增加轮廓宽度
        strokeColor: "#2574ff",
        strokeWeight: 8, // 增加线条宽度
        strokeOpacity: 0.9,
        lineJoin: "round",
        zIndex: 50, // 确保轨迹线在标记下方
      });
      map.add(polyline);

      // 小车marker
      carMarker = new AMap.Marker({
        position: formattedPath[currentIndex] || formattedStart,
        icon: "https://webapi.amap.com/images/car.png",
        offset: new AMap.Pixel(-26, -13),
        anchor: "center",
        zIndex: 90, // 确保小车在轨迹线上方，但在起终点下方
      });
      map.add(carMarker);

      // 视野适配，增加边距
      map.setFitView([polyline, startMarker, endMarker, carMarker].filter(Boolean), {
        padding: [80, 80, 80, 80] // 上右下左边距
      });

      // 小车运动
      const remainPath = formattedPath.slice(currentIndex);
      carMarker.moveAlong(remainPath, {
        duration: 8000 * (remainPath.length / formattedPath.length), // 根据剩余路径长度调整动画时长
        autoRotation: true,
        onEnd: () => {
          localStorage.removeItem('carTrack'); // 动画结束清除轨迹
        }
      });
    }).catch(e => {
      console.error("高德地图加载或渲染失败:", e);
      const container = document.getElementById('container');
      if (container) {
        container.innerHTML = '<div style="text-align:center;color:#ff4d4f;margin-top:40px;padding:20px;font-size:16px;">地图加载失败，请检查网络或稍后重试。</div>';
      }
    });

    return () => {
      map?.destroy(); // 组件卸载时销毁地图实例
    };
  }, []); // 空数组依赖，只在组件挂载时运行一次

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
      </div>
      {/* 路线距离悬浮 */}
      {typeof window !== 'undefined' && (window as any).quxiaoPageDistance !== null && (
        <div style={{ position: 'fixed', left: 0, right: 0, bottom: 80, zIndex: 99, display: 'flex', justifyContent: 'center' }}>
          <div style={{ background: '#fff', color: '#2574ff', fontWeight: 600, fontSize: 16, borderRadius: 20, boxShadow: '0 2px 8px #0001', padding: '8px 24px' }}>
            本次行程约 {(window as any).quxiaoPageDistance?.toFixed(1)} 公里
          </div>
        </div>
      )}
    </>
  );
};

export default function ChaoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [distance, setDistance] = useState<number | null>(null);
  const [trip, setTrip] = useState<{ pickup: string; destination: string; createdAt: string } | null>(null);

  useEffect(() => {
    const fetchTripDetails = async () => {
      const tripId = searchParams.get('id');
      if (!tripId) {
        console.warn("未提供行程ID");
        return;
      }

      try {
        // 检查是否是本地新添加的行程（使用时间戳作为ID）
        const isLocalTrip = tripId.length > 10; // 时间戳通常大于10位
        let foundTrip = null;

        if (isLocalTrip) {
          const localTrips = JSON.parse(localStorage.getItem('localTrips') || '[]');
          foundTrip = localTrips.find((t: any) => t.id === Number(tripId));
        }

        if (!foundTrip) {
          // 如果不是本地行程或本地未找到，则从API获取
          const { tripdata } = await import('@/api'); // 动态导入以避免循环依赖或不必要的加载
          const trips = await tripdata();
          foundTrip = trips.find((t: any) => t.id === Number(tripId));
        }

        if (foundTrip) {
          setTrip({
            pickup: foundTrip.pickup,
            destination: foundTrip.destination,
            createdAt: foundTrip.createdAt,
          });
        } else {
          console.warn("未找到对应的行程信息");
        }
      } catch (error) {
        console.error("获取行程详情失败:", error);
      }
    };

    fetchTripDetails();
  }, [searchParams]);

  // 监听 MapContainer 设置的距离
  if (typeof window !== 'undefined') {
    (window as any).quxiaoPageDistance = distance;
  }
  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden", position: "relative", background: "#f7f8fa" }}>
      {/* 顶部导航栏 */}
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 10 }}>
        <NavBar backArrow onBack={() => router.back()} style={{ background: '#fff', fontWeight: 500, fontSize: 18, boxShadow: '0 2px 8px #0001' }}>
          订单已超时
        </NavBar>
      </div>
      {/* 地图区域 */}
      <div style={{ position: "absolute", inset: 0, width: "100%", height: "100%", top: 48, bottom: 0, zIndex: 1 }}>
        <MapContainer setDistance={setDistance} />
      </div>
      {/* 底部悬浮卡片 */}
      <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 20, display: "flex", justifyContent: "center", alignItems: "flex-end", pointerEvents: "none" }}>
        <div style={{ width: 400, maxWidth: '96%', margin: "0 auto 24px auto", background: "#fff", borderRadius: 16, border: '1.5px solid #2574ff', boxShadow: "none", padding: "24px 24px 18px 24px", pointerEvents: "auto", display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          {/* 左侧内容 */}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 26, fontWeight: 700, color: '#222', marginBottom: 6 }}>订单已超时</div>
            <div style={{ color: '#888', fontSize: 16 }}>抱歉，目前暂无司机接单</div>
          </div>
          {/* 右侧按钮组 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginLeft: 18 }}>
            <button
              style={{
                background: '#2574ff', color: '#fff', fontWeight: 600, fontSize: 16, border: 'none', borderRadius: 16, padding: '8px 22px', marginBottom: 4, cursor: 'pointer', boxShadow: '0 2px 8px #2574ff22', outline: 'none', minWidth: 90
              }}
              onClick={() => router.push('/admin/end')}
            >
              继续叫车
            </button>
            <button
              style={{
                background: '#f5f5f5', color: '#bbb', fontWeight: 500, fontSize: 15, border: 'none', borderRadius: 16, padding: '8px 22px', cursor: 'not-allowed', minWidth: 90
              }}
              disabled
            >
              更改地址
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
