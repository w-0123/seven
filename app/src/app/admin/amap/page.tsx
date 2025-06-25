"use client";

// components/Amap.js
import { useEffect, useRef, useState } from "react";

// 安全加载地图（避免服务端渲染问题）
const Amap = () => {
 
  const mapRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
    if (typeof window === "undefined") return;
    useEffect(() => {
      initMap();
    }, []);
    const initMap = async () => {
      
      try {
        // 动态导入AMapLoader只在客户端执行
        const AMapLoader = (await import("@amap/amap-jsapi-loader")).default;
        const AMap = await AMapLoader.load({
          key: "2fd038c0ccf4239b38c772b817c575a9", // 在.env.local中配置
          version: "2.0", // SDK版本
          plugins: ["AMap.ToolBar", "AMap.Scale", "AMap.Geolocation"], // 需要加载的插件
        });
        // 创建地图实例
        const map = new AMap.Map(mapRef.current, {
          viewMode: "3D", // 3D视图
          zoom: 13, // 缩放级别
          center: [116.397428, 39.90923], // 中心点坐标（北京）
        });

        const marker = new AMap.Marker({
          position: new AMap.LngLat(116.397428, 39.90923), //经纬度对象，也可以是经纬度构成的一维数组[116.39, 39.9]
          title: "北京",
        });
        //将创建的点标记添加到已有的地图实例：
        map.add(marker);
        // 添加控件
        map.addControl(new AMap.ToolBar());
        map.addControl(new AMap.Scale());

        // 添加定位控件

        const geolocation = new AMap.Geolocation({
          enableHighAccuracy: true, // 高精度定位
          timeout: 10000, // 超时时间
          maximumAge: 0, // 不使用缓存
          convert: true, // 自动转换坐标
        });

        geolocation.getCurrentPosition((status: string, result: { position: { lat: number, lng: number }, accuracy: number, formattedAddress: string, message?: string }) => {
        
        });
        map.addControl(geolocation);
        setLoading(false);
      } catch (err) {
        console.error("高德地图加载失败:", err);
        setError("地图加载失败，请重试" as unknown as null);
        setLoading(false);
      }
    };

  return (
    <div className="relative w-full h-[880px]">
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

      <div ref={mapRef} className="w-full h-full" />
    </div>
  );
}
export default Amap;