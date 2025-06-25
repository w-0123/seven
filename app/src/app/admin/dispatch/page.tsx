"use client";
import React, { useEffect, useRef, useState } from "react";
import AMapLoader from "@amap/amap-jsapi-loader";
import { NavBar } from "antd-mobile";
import { useSearchParams, useRouter } from "next/navigation";
import { link } from "fs";

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
  出租车: [
    {
      name: "香蕉专车",
      icon: "https://img.icons8.com/color/48/000000/taxi.png",
      desc: ["隐私保护", "测温消毒"],
      pricePerKm: 1.5,
      discount: "优惠已减14元",
    },
    {
      name: "扇骨出行",
      icon: "https://img.icons8.com/color/48/000000/taxi.png",
      desc: ["隐私保护", "测温消毒"],
      pricePerKm: 1.2,
      discount: "优惠已减14元",
    },
    {
      name: "石榴出行",
      icon: "https://img.icons8.com/color/48/000000/taxi.png",
      desc: ["隐私保护", "测温消毒"],
      pricePerKm: 2.0,
      discount: "优惠已减14元",
    },
  ],
  经济型: [
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
  舒适型: [
    {
      name: "舒适专车",
      icon: "https://img.icons8.com/color/48/000000/taxi.png",
      desc: ["宽敞空间", "专业司机"],
      pricePerKm: 1.8,
      discount: "舒适体验",
    },
  ],
  商务型: [
    {
      name: "商务专车",
      icon: "https://img.icons8.com/color/48/000000/taxi.png",
      desc: ["高端商务", "专属服务"],
      pricePerKm: 2.5,
      discount: "商务专享",
    },
  ],
  豪华型: [
    {
      name: "豪华专车",
      icon: "https://img.icons8.com/color/48/000000/taxi.png",
      desc: ["豪华座驾", "尊贵体验"],
      pricePerKm: 3.5,
      discount: "尊享豪华",
    },
  ],
};

// 计算预计价格
const getEstimate = (pricePerKm: number, distance: number | null) => {
  if (!distance) return "--";
  return Math.round(pricePerKm * distance);
};

const MapContainer = ({
  setDistance,
}: {
  setDistance: React.Dispatch<React.SetStateAction<number | null>>;
}) => {
  useEffect(() => {
    window._AMapSecurityConfig = {
      securityJsCode: "3ab941036521c4fc367d596ead071a10",
    };

    let map: any = null;
    let polyline: any = null;
    let carMarker: any = null;
    let startMarker: any = null;
    let endMarker: any = null;

    const carTrack = JSON.parse(localStorage.getItem("carTrack") || "{}");
    const { path = [], currentIndex = 0, start, end } = carTrack;

    // 检查轨迹数据是否有效
    if (
      !Array.isArray(path) ||
      path.length < 2 ||
      !start ||
      !end ||
      typeof start.lng === "undefined" ||
      typeof start.lat === "undefined" ||
      typeof end.lng === "undefined" ||
      typeof end.lat === "undefined"
    ) {
      const container = document.getElementById("container");
      if (container) {
        container.innerHTML =
          '<div style="text-align:center;color:#888;margin-top:40px;padding:20px;font-size:16px;">暂无轨迹，请在<a href="/admin/confirm" style="color:#2574ff;">确认用车页</a>下单</div>';
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
    })
      .then((AMap: any) => {
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
        map.setFitView(
          [polyline, startMarker, endMarker, carMarker].filter(Boolean),
          {
            padding: [80, 80, 80, 80], // 上右下左边距
          }
        );

        // 小车运动
        const remainPath = formattedPath.slice(currentIndex);
        carMarker.moveAlong(remainPath, {
          duration: 8000 * (remainPath.length / formattedPath.length), // 根据剩余路径长度调整动画时长
          autoRotation: true,
          onEnd: () => {
            localStorage.removeItem("carTrack"); // 动画结束清除轨迹
          },
        });
      })
      .catch((e) => {
        console.error("高德地图加载或渲染失败:", e);
        const container = document.getElementById("container");
        if (container) {
          container.innerHTML =
            '<div style="text-align:center;color:#ff4d4f;margin-top:40px;padding:20px;font-size:16px;">地图加载失败，请检查网络或稍后重试。</div>';
        }
      });

    return () => {
      map?.destroy(); // 组件卸载时销毁地图实例
    };
  }, []); // 空数组依赖，只在组件挂载时运行一次

  return (
    <>
      <div
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
        }}
      >
        <div id="container" style={{ width: "100%", height: "100%" }}></div>
        {/* 安全中心浮层 */}
        <div
          style={{
            position: "absolute",
            left: 16,
            top: 70,
            background: "#fff",
            borderRadius: 20,
            boxShadow: "0 2px 8px #0001",
            display: "flex",
            alignItems: "center",
            padding: "4px 12px",
            fontSize: 14,
            zIndex: 2,
          }}
        >
          <img
            src="https://img.alicdn.com/imgextra/i2/O1CN01QwQw2B1QwQwQwQwQw_!!6000000000000-2-tps-32-32.png"
            alt="安全"
            style={{ width: 20, height: 20, marginRight: 6 }}
          />
          安全中心
        </div>
      </div>
    </>
  );
};
const ConfirmPage = () => {
  useEffect(() => {
    const aaa = setInterval(() => {
      router.push("/admin/xcyks");
    }, 5000);
    // clearInterval(aaa);
  });
  const [selectedType, setSelectedType] = useState(0); // 车型索引
  const [selectedCar, setSelectedCar] = useState(
    carListMap[carTypes[0].name][0].name
  );
  const [distance, setDistance] = useState<number | null>(null);
  const router = useRouter();
  // 切换车型时，专车默认选第一个
  useEffect(() => {
    setSelectedCar(carListMap[carTypes[selectedType].name][0].name);
  }, [selectedType]);
  // 监听 MapContainer 设置的距离
  (window as any).setConfirmPageDistance = setDistance;
  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        position: "relative",
        background: "#f7f8fa",
      }}
    >
      {/* 顶部栏 */}
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 10 }}>
        <NavBar
          backArrow
          onBack={()=>{router.push('/admin/waitOrder')}}
          style={{
            background: "#fff",
            fontWeight: 500,
            fontSize: 18,
            boxShadow: "0 2px 8px #0001",
          }}
        >
          确认用车
        </NavBar>
      </div>
      {/* 地图全屏 */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
        }}
      >
        <MapContainer setDistance={setDistance} />
      </div>
      {/* 悬浮底部内容 */}
      <div
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 20,
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-end",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            width: 400,
            maxWidth: "96%",
            margin: "0 auto 24px auto",
            background: "#fff",
            borderRadius: 16,
            border: "1.5px solid #d1d5db",
            boxShadow: "none",
            padding: "24px 24px 18px 24px",
            pointerEvents: "auto",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
          }}
        >
          <div
            style={{
              display: "flex",
              width: "100%",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <div
              style={{ fontSize: 28, fontWeight: 700, color: "#222", flex: 1 }}
            >
              排队中...
            </div>
            <button
              style={{
                border: "1.5px solid #d1d5db",
                background: "#fff",
                color: "#888",
                borderRadius: 16,
                fontSize: 18,
                fontWeight: 500,
                padding: "6px 28px",
                cursor: "pointer",
                boxShadow: "none",
                outline: "none",
                marginLeft: 8,
              }}
              onClick={() => router.push("/admin/quxiao")}
            >
              取消订单
            </button>
          </div>
          <div style={{ color: "#888", fontSize: 17, marginBottom: 4 }}>
            司机马上接单了，请耐心等待。
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmPage;
