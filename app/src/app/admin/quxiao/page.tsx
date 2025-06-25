"use client";
import React, { useEffect, useState } from "react";
import AMapLoader from "@amap/amap-jsapi-loader";
import { NavBar } from "antd-mobile";
import { useRouter, useSearchParams } from "next/navigation";

// 地图容器组件，含路径规划、定位、轨迹动画、距离浮层
interface MapContainerProps {
  setDistance: React.Dispatch<React.SetStateAction<number | null>>;
  // pickupAddress: string | null; // 不再通过 props 接收地址字符串进行地理编码
  // destinationAddress: string | null;
}

const MapContainer = ({ setDistance }: MapContainerProps) => {
  useEffect(() => {
    window._AMapSecurityConfig = {
      securityJsCode: "3ab941036521c4fc367d596ead071a10",
    };

    let map: any = null;
    let polyline: any = null;
    let carMarker: any = null;
    let startMarker: any = null;
    let endMarker: any = null;

    // 直接从 localStorage 获取 carTrack 数据，包含精确坐标
    const carTrack = JSON.parse(localStorage.getItem('carTrack') || '{}');
    const { path = [], currentIndex = 0, start, end } = carTrack;

    // 检查轨迹数据是否有效，特别是坐标是否为有效数字
    if (
      !Array.isArray(path) || path.length < 2 ||
      !start || typeof start.lng !== 'number' || isNaN(start.lng) || typeof start.lat !== 'number' || isNaN(start.lat) ||
      !end || typeof end.lng !== 'number' || isNaN(end.lng) || typeof end.lat !== 'number' || isNaN(end.lat)
    ) {
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
        offset: new AMap.Pixel(0, -10),
        zIndex: 100,
      });
      map.add(startMarker);

      // 终点marker
      endMarker = new AMap.Marker({
        position: formattedEnd,
        icon: "https://webapi.amap.com/theme/v1.3/markers/n/end.png",
        anchor: "bottom-center",
        offset: new AMap.Pixel(0, -10),
        zIndex: 100,
      });
      map.add(endMarker);

      // 轨迹线
      polyline = new AMap.Polyline({
        path: formattedPath,
        isOutline: true,
        outlineColor: "#ffeeff",
        borderWeight: 3,
        strokeColor: "#2574ff",
        strokeWeight: 8,
        strokeOpacity: 0.9,
        lineJoin: "round",
        zIndex: 50,
      });
      map.add(polyline);

      // 小车marker (重新引入)
      carMarker = new AMap.Marker({
        position: formattedPath[currentIndex] || formattedStart,
        icon: "https://webapi.amap.com/images/car.png",
        offset: new AMap.Pixel(-26, -13),
        anchor: "center",
        zIndex: 90,
      });
      map.add(carMarker);

      // 视野适配，增加边距
      map.setFitView([polyline, startMarker, endMarker, carMarker].filter(Boolean), {
        padding: [80, 80, 80, 80]
      });

      // 小车运动 (重新引入)
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
      map?.destroy();
    };
  }, []); // 不再依赖 pickupAddress/destinationAddress，而是 carTrack 改变时 (实际是组件 mount 时)

  return (
    <>
      <div style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
        <div
          id="container"
          style={{ width: "100%", height: "100%" }}
        ></div>
        {/* 安全中心浮层已移除 */}
      </div>
      {/* 路线距离悬浮（根据需要决定是否保留） */}
      {typeof window !== 'undefined' && (window as any).quxiaoPageDistance !== null && (
        <div style={{ position: 'fixed', left: 0, right: 0, bottom: 80, zIndex: 99, display: "flex", justifyContent: "center" }}>
          <div style={{ background: '#fff', color: '#2574ff', fontWeight: 600, fontSize: 16, borderRadius: 20, boxShadow: '0 2px 8px #0001', padding: '8px 24px' }}>
            本次行程约 {(window as any).quxiaoPageDistance?.toFixed(1)} 公里
          </div>
        </div>
      )}
    </>
  );
};

export default function QuxiaoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [distance, setDistance] = useState<number | null>(null);
  const [trip, setTrip] = useState<{ pickup: string; destination: string; createdAt: string } | null>(null);

  useEffect(() => {
    const fetchTripDetails = async () => {
      let tripId = searchParams.get('id');
      console.log("quxiao page - tripId from URL:", tripId);

      if (!tripId) {
        // 如果URL中没有提供ID，尝试从localStorage获取最近的行程ID
        const localTrips = JSON.parse(localStorage.getItem('localTrips') || '[]');
        if (localTrips.length > 0) {
          // 按创建时间降序排序，获取最新行程
          localTrips.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          tripId = String(localTrips[0].id);
          console.log("quxiao page - Automatically got tripId from localStorage:", tripId);
        } else {
          console.warn("quxiao page - 未提供行程ID且localStorage中没有本地行程");
          return;
        }
      }

      try {
        // 检查是否是本地新添加的行程（使用时间戳作为ID）
        const isLocalTrip = tripId.length > 10; // 时间戳通常大于10位
        let foundTrip = null;

        if (isLocalTrip) {
          const localTrips = JSON.parse(localStorage.getItem('localTrips') || '[]');
          console.log("quxiao page - localTrips:", localTrips);
          foundTrip = localTrips.find((t: any) => t.id === Number(tripId));
          console.log("quxiao page - foundTrip from localStorage:", foundTrip);
        }

        if (!foundTrip) {
          // 如果不是本地行程或本地未找到，则从API获取
          const { tripdata } = await import('@/api'); // 动态导入以避免循环依赖或不必要的加载
          const trips = await tripdata();
          console.log("quxiao page - trips from API:", trips);
          foundTrip = trips.find((t: any) => t.id === Number(tripId));
          console.log("quxiao page - foundTrip from API:", foundTrip);
        }

        if (foundTrip) {
          setTrip({
            pickup: foundTrip.pickup,
            destination: foundTrip.destination,
            createdAt: foundTrip.createdAt,
          });
          console.log("quxiao page - setTrip with:", foundTrip);
        } else {
          console.warn("quxiao page - 未找到对应的行程信息或地址格式不正确");
        }
      } catch (error) {
        console.error("quxiao page - 获取行程详情失败:", error);
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
          已取消
        </NavBar>
      </div>
      {/* 地图区域 */}
      <div style={{ position: "absolute", inset: 0, width: "100%", height: "100%", top: 48, bottom: 0, zIndex: 1 }}>
        <MapContainer
          setDistance={setDistance}
          // 不再传递 pickupAddress 和 destinationAddress 给 MapContainer，因为地图将从 carTrack 获取坐标
        />
      </div>
      {/* 底部悬浮卡片 */}
      <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 20, display: "flex", justifyContent: "center", alignItems: "flex-end", pointerEvents: "none" }}>
        <div style={{ width: 400, maxWidth: '96%', margin: "0 auto 24px auto", background: "#fff", borderRadius: 16, border: '1.5px solid #d1d5db', boxShadow: "none", padding: "32px 24px 24px 24px", pointerEvents: "auto", display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#222', marginBottom: 6 }}>订单取消成功</div>
          <div style={{ color: '#888', fontSize: 16, marginBottom: 18 }}>订单已取消，您可以重新打车。</div>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ marginRight: 8 }}><circle cx="10" cy="10" r="9" stroke="#d1d5db" strokeWidth="2" fill="#fff"/><path d="M10 5v5l3 3" stroke="#888" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span style={{ fontSize: 15, color: '#222' }}>
              {trip?.createdAt ? new Date(trip.createdAt).toLocaleString('zh-CN') : '加载中...'}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#2574ff', display: 'inline-block', marginRight: 8 }}></span>
              <span style={{ fontSize: 16, color: '#222' }}>{trip?.pickup || '加载中...'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#1ec765', display: 'inline-block', marginRight: 8 }}></span>
              <span style={{ fontSize: 16, color: '#222' }}>{trip?.destination || '加载中...'}</span>
            </div>
          </div>
          <button
            style={{ width: "100%", height: 48, background: "#2574ff", color: "#fff", fontSize: 18, fontWeight: 600, border: "none", borderRadius: 24, boxShadow: "0 4px 16px #2574ff33", zIndex: 20, display: "block", margin: "8px 0 0 0", pointerEvents: 'auto', cursor: 'pointer' }}
            onClick={() => router.push('/admin/end')}
          >
            重新打车
          </button>
        </div>
      </div>
    </div>
  );
}
