"use client";

// components/Amap.js
import { useEffect, useRef, useState } from "react";
import car1 from '../../../asstes/car1.png'; 
import car2 from '../../../asstes/car2.png'; 

// 声明全局 AMap 配置接口
declare global {
  interface Window {
    _AMapSecurityConfig: {
      securityJsCode: string;
    };
    AMap: any;
  }
}

// 定义地图实例的类型
interface MapInstance {
  __map__?: any;
}

// 安全加载地图（避免服务端渲染问题）
const Amap = () => {
  const mapRef = useRef<HTMLDivElement & MapInstance>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // if (typeof window === "undefined") return;

  useEffect(() => {
    // 配置安全密钥
    if (typeof window !== "undefined") {
      window._AMapSecurityConfig = {
        securityJsCode: 'f7e0ed3e992a534eef70a8e40d7729b4'
      };
      initMap();
    }
    
    // // 添加窗口大小变化监听
    // const handleResize = () => {
    //   if (mapRef.current?.__map__) {
    //     mapRef.current.__map__.resize();
    //   }
    // };

    // window.addEventListener('resize', handleResize);
    // return () => window.removeEventListener('resize', handleResize);
  }, []);

  const initMap = async () => {
    try {
      // 动态导入AMapLoader只在客户端执行
      const AMapLoader = (await import("@amap/amap-jsapi-loader")).default;
      const AMap = await AMapLoader.load({
        key: "2fd038c0ccf4239b38c772b817c575a9",
        version: "2.0",
        plugins: ["AMap.ToolBar", "AMap.Scale", "AMap.Geolocation", "AMap.Marker"],
      });
      
      // 创建地图实例
      const map = new AMap.Map(mapRef.current, {
        viewMode: "2D",
        zoom: 13,
        center: [115.489, 38.8148],
        resizeEnable: true
      });

      // 保存地图实例到ref中
      if (mapRef.current) {
        mapRef.current.__map__ = map;
      }

      // 添加控件
      map.addControl(new AMap.ToolBar());
      map.addControl(new AMap.Scale());

      // 添加定位控件
      const geolocation = new AMap.Geolocation({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
        convert: true,
        showButton: true,
        buttonPosition: 'RB',
        buttonOffset: new AMap.Pixel(10, 20),
        showMarker: true,
        showCircle: true,
        zoomToAccuracy: true
      });

      map.addControl(geolocation);

      // 获取当前位置
      geolocation.getCurrentPosition((status: string, result: any) => {
        if (status === 'complete') {
          const position = [result.position.lng, result.position.lat];
          map.setCenter(position);
          console.log('定位成功:', position);
        } else {
          console.error('定位失败:', result.message);
        }
      });

      setLoading(false);
    } catch (err) {
      console.error("高德地图加载失败:", err);
      setError("地图加载失败，请重试");
      setLoading(false);
    }
  };

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          地图加载中...
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-50 text-red-500">
          {error}
        </div>
      )}
      
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}

export default Amap;