"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface Tip {
  id: string;
  name: string;
  district: string;
  location: string;
}

interface Trip {
  id: number;
  destination: string;
  address: string;
  createdAt: string;
  location: { lng: number; lat: number };
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

const Amap = () => {
  const router = useRouter();
  const mapRef = useRef<HTMLDivElement | null>(null);
  const amapRef = useRef<any>(null);
  const mapInstanceRef = useRef<any>(null);
  const geolocationRef = useRef<any>(null);

  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [keyword, setKeyword] = useState("");
  const debouncedKeyword = useDebounce(keyword, 300);
  const [tips, setTips] = useState<Tip[]>([]);
  const [showTips, setShowTips] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [destination, setDestination] = useState<string | null>(null);

  const markerRef = useRef<any>(null);
  const polylineRef = useRef<any>(null);
  const carMarkerRef = useRef<any>(null); // 小车图标

  useEffect(() => {
    if (typeof window === "undefined") return;

    // 读取localStorage中的行程数据
    try {
      const localTrips = JSON.parse(localStorage.getItem("localTrips") || "[]");
      if (localTrips.length > 0 && localTrips[0].location) {
        setDestination(localTrips[0].destination || "目的地");
      }
    } catch (e) {
      console.error("读取本地行程数据失败", e);
    }

    (async () => {
      try {
        const AMapLoader = (await import("@amap/amap-jsapi-loader")).default;
        const AMap = await AMapLoader.load({
          key: "2fd038c0ccf4239b38c772b817c575a9",
          version: "2.0",
          plugins: ["AMap.Geolocation", "AMap.ToolBar", "AMap.Scale"],
        });

        amapRef.current = AMap;

        const map = new AMap.Map(mapRef.current!, {
          viewMode: "3D",
          zoom: 13,
          center: [116.397428, 39.90923],
        });

        map.addControl(new AMap.ToolBar());
        map.addControl(new AMap.Scale());

        const geolocate = new AMap.Geolocation({
          enableHighAccuracy: true,
          timeout: 10000,
          buttonPosition: "RB",
          showMarker: true,
          showCircle: true,
          zoomToAccuracy: true,
        });

        map.addControl(geolocate);
        geolocate.getCurrentPosition();

        geolocate.on("complete", (data: any) => {
          const pos: [number, number] = [data.position.lng, data.position.lat];
          setUserLocation(pos);
          setAccuracy(data.accuracy);
          map.setCenter(pos);

          // 初始化小车Marker
          const carMarker = new AMap.Marker({
            map,
            position: pos,
            icon: "https://webapi.amap.com/images/car.png",
            offset: new AMap.Pixel(-13, -26),
          });
          carMarkerRef.current = carMarker;
          setLoading(false);
          
          // 定位完成后，检查是否有目的地，有则规划路线
          planRouteIfNeeded(pos);
        });

        geolocate.on("error", () => {
          setError("定位失败，请检查定位权限和GPS是否已开启");
          setLoading(false);
        });

        mapInstanceRef.current = map;
        geolocationRef.current = geolocate;
      } catch {
        setError("地图初始化失败");
        setLoading(false);
      }
    })();
  }, []);

  // 当用户位置更新时尝试规划路线
  const planRouteIfNeeded = (userPos: [number, number]) => {
    try {
      const localTrips = JSON.parse(localStorage.getItem("localTrips") || "[]");
      if (localTrips.length > 0 && localTrips[0].location) {
        const destLng = localTrips[0].location.lng;
        const destLat = localTrips[0].location.lat;
        
        if (destLng && destLat) {
          planRoute(userPos, [destLng, destLat], localTrips[0].destination);
        }
      }
    } catch (e) {
      console.error("规划路线失败", e);
    }
  };

  useEffect(() => {
    if (!debouncedKeyword.trim()) {
      setTips([]);
      setShowTips(false);
      return;
    }

    const fetchTips = async () => {
      try {
        const url = `https://restapi.amap.com/v3/assistant/inputtips?key=ebd1776166da0acdb9bfcf283cd47b3b&keywords=${encodeURIComponent(
          debouncedKeyword
        )}&citylimit=true`;

        const res = await fetch(url);
        const data = await res.json();

        if (data.status === "1" && data.tips) {
          const validTips = data.tips.filter((tip: any) => tip.location && tip.name);
          setTips(validTips);
          setShowTips(true);
        } else {
          setTips([]);
          setShowTips(false);
        }
      } catch {
        setTips([]);
        setShowTips(false);
      }
    };

    fetchTips();
  }, [debouncedKeyword]);

  const drawRoute = (routeResult: any) => {
    if (!routeResult.route || !routeResult.route.paths?.length) return null;
    const steps = routeResult.route.paths[0].steps;
    let path: [number, number][] = [];

    steps.forEach((step: any) => {
      const points = step.polyline.split(";").map((str: string) => {
        const [lng, lat] = str.split(",").map(Number);
        return [lng, lat] as [number, number];
      });
      path = path.concat(points);
    });

    if (polylineRef.current) {
      polylineRef.current.setMap(null);
    }

    const polyline = new amapRef.current.Polyline({
      path,
      strokeColor: "#3366FF",
      strokeWeight: 5,
      map: mapInstanceRef.current,
    });

    return { polyline, path };
  };

  const animateCarAlongPath = (path: [number, number][]) => {
    if (!carMarkerRef.current || !amapRef.current) return;

    let index = 0;
    const interval = setInterval(() => {
      if (index >= path.length) {
        clearInterval(interval);
        router.push('/admin/payment?id=2');
        return;
      }
      carMarkerRef.current.setPosition(path[index]);
      index += 1;
    }, 300); // 每300ms移动一次
  };

  // 规划路线
  const planRoute = async (origin: [number, number], destination: [number, number], destinationName: string) => {
    if (!mapInstanceRef.current || !amapRef.current) {
      alert("地图未初始化");
      return;
    }

    setDestination(destinationName || "目的地");

    if (markerRef.current) markerRef.current.setMap(null);
    if (polylineRef.current) polylineRef.current.setMap(null);

    // 创建目的地标记
    markerRef.current = new amapRef.current.Marker({
      position: destination,
      map: mapInstanceRef.current,
    });

    // 设置地图中心为目的地和用户位置的中点
    mapInstanceRef.current.setFitView([markerRef.current, carMarkerRef.current]);

    try {
      const originStr = `${origin[0]},${origin[1]}`;
      const destStr = `${destination[0]},${destination[1]}`;
      const url = `https://restapi.amap.com/v3/direction/driving?origin=${originStr}&destination=${destStr}&key=ebd1776166da0acdb9bfcf283cd47b3b`;

      const res = await fetch(url);
      const data = await res.json();

      if (data.status === "1" && data.route.paths.length > 0) {
        const { polyline, path } = drawRoute(data)!;
        polylineRef.current = polyline;
        mapInstanceRef.current.setFitView([markerRef.current, carMarkerRef.current, polyline]);
        animateCarAlongPath(path);
      } else {
        alert("未找到可用路线");
      }
    } catch (e) {
      alert("路线规划失败");
      console.error(e);
    }
  };

  const handleSelectTip = async (tip: Tip) => {
    setKeyword("");
    setShowTips(false);

    if (!userLocation || !mapInstanceRef.current || !amapRef.current) {
      alert("定位或地图未初始化");
      return;
    }

    const [lng, lat] = tip.location.split(",").map(Number);
    
    // 通过API进行路线规划
    planRoute(userLocation, [lng, lat], tip.name);
  };

  return (
    <div className="relative w-full h-screen flex flex-col">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white z-20">
          <div className="flex flex-col items-center">
            <svg className="animate-spin h-10 w-10 text-blue-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            地图加载中...
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-100 text-red-500 z-20">
          {error}
        </div>
      )}
      <div ref={mapRef} className="flex-grow w-full" style={{ minHeight: "800px" }} />
    </div>
  );
};

export default Amap;
