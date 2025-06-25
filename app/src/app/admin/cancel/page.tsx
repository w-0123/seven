'use client';

import React ,{useRef,useState,useEffect} from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import Image from 'next/image';
import AMapComponent from '../liamap/page';
import BackIcon from "./fas fa-chevron-left Copy FrG6IMY@1x.png";
import Image1 from "./stLine-time-l LvM7TAl@1x.png"


interface AMapComponentProps {
  startPoint?: [number, number];
  endPoint?: [number, number];
  path?: [number, number][];
}

// 声明全局 AMap 配置接口
declare global {
  interface Window {
    _AMapSecurityConfig: {
      securityJsCode: string;
    };
    AMap: any;
  }
}

// 保定站坐标
const DESTINATION: [number, number] = [115.48098, 38.862626];

export default function CancelPage({ path }: AMapComponentProps) {
  const router = useRouter();

  const mapRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mapInstance = useRef<any>(null);

  useEffect(() => {
    // 配置安全密钥
    window._AMapSecurityConfig = {
      securityJsCode: 'f7e0ed3e992a534eef70a8e40d7729b4'
    };
    
    if (typeof window === "undefined") return;
    initMap();
  }, []);

  const initMap = async () => {
    try {
      const AMapLoader = (await import("@amap/amap-jsapi-loader")).default;
      const AMap = await AMapLoader.load({
        key: "f32bf884cc931b5f469e2fa9a3de5c12",
        version: "2.0",
        plugins: ['AMap.Driving', 'AMap.Geolocation']
      });

      // 创建地图实例
      const map = new AMap.Map(mapRef.current, {
        viewMode: "3D",
        zoom: 13,
        center: DESTINATION
      });

      mapInstance.current = map;

      // 创建定位插件实例
      const geolocation = new AMap.Geolocation({
        enableHighAccuracy: true,
        timeout: 10000,
        zoomToAccuracy: true,
        buttonPosition: 'RB',
        buttonOffset: new AMap.Pixel(10, 20),
        convert: true
      });

      map.addControl(geolocation);

      // 创建驾车路线规划实例
      const driving = new AMap.Driving({
        policy: AMap.DrivingPolicy.LEAST_TIME,
        map: map,
        hideMarkers: false
      });

      // 获取当前位置
      const getCurrentPosition = () => {
        return new Promise((resolve, reject) => {
          geolocation.getCurrentPosition((status: string, result: any) => {
            if (status === 'complete') {
              const position = [result.position.lng, result.position.lat];
              console.log('获取位置成功:', position);
              resolve(position);
            } else {
              console.error('获取位置失败:', result);
              reject(new Error(result.message || '获取位置失败'));
            }
          });
        });
      };

      try {
        // 获取当前位置
        const currentPosition = await getCurrentPosition();
        
        // 添加起点标记
        const startMarker = new AMap.Marker({
          position: currentPosition,
          icon: '//webapi.amap.com/theme/v1.3/markers/n/start.png',
          offset: new AMap.Pixel(-13, -30),
          title: '起点'
        });

        // 添加终点标记
        const endMarker = new AMap.Marker({
          position: DESTINATION,
          icon: '//webapi.amap.com/theme/v1.3/markers/n/end.png',
          offset: new AMap.Pixel(-13, -30),
          title: '终点'
        });

        map.add([startMarker, endMarker]);

        // 规划路线
        driving.search(
          currentPosition,
          DESTINATION,
          { 
            waypoints: [],
            extensions: 'all'
          },
          (status: string, result: any) => {
            if (status === 'complete') {
              console.log('路线规划成功:', result);
              const route = result.routes[0];
              // 绘制路线
              const path = route.steps.map((step: any) => step.path).flat();
              const polyline = new AMap.Polyline({
                path: path,
                strokeColor: '#52C41A',
                strokeWeight: 6,
                strokeOpacity: 0.9
              });

              map.add(polyline);
              map.setFitView([startMarker, endMarker, polyline]);
              setLoading(false);
            } else {
              console.error('路线规划失败:', result);
              setError('路线规划失败，请重试');
              setLoading(false);
            }
          }
        );
      } catch (locationError) {
        console.error('获取位置失败:', locationError);
        setError('无法获取当前位置，请检查定位权限并确保允许浏览器访问您的位置');
        setLoading(false);
      }

    } catch (err) {
      console.error("地图加载失败:", err);
      setError("地图加载失败，请重试");
      setLoading(false);
    }
  };




  const orderInfo = {
    cancelTime: '2020年01月01日 12:00',
    startLocation: '越秀财富世纪广场-停车场',
    endLocation: '大江苑',
    distance: '全程7公里，约17分钟'
  };

  return (
    <div className={styles.container}>
      {/* 标题栏 */}
      <div className={styles.header}>
        <button 
          className={styles.backButton}
          onClick={() => router.back()}
          aria-label="返回上一页"
        >
          <Image
            src={BackIcon}
            alt="返回"
            width={19}
            height={19}
          />
        </button>
        <h1 className={styles.title}>已取消</h1>
      </div>

      {/* 地图区域 */}
      <div className={styles.mapContainer}>
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

      <div ref={mapRef} className={styles.mapContainer} />
    </div>

      {/* 取消信息卡片 */}
      <div className={styles.cancelCard}>
        <div className={styles.cancelStatus}>
          <div className={styles.statusTitle}>订单取消成功</div>
          <p className={styles.statusDesc}>订单已取消，您可以重新打车。</p>
        </div>

        <div className={styles.orderInfo}>
          <div className={styles.timeInfo}>
            <Image
              src={Image1}
              alt="时间"
              width={16}
              height={16}
            />
            <span>{orderInfo.cancelTime}</span>
          </div>

          <div className={styles.locationInfo}>
            <div className={styles.location}>
              <span className={styles.blueDot}></span>
              <span className={styles.locationText}>{orderInfo.startLocation}</span>
            </div>
            <div className={styles.verticalLine}></div>
            <div className={styles.location}>
              <span className={styles.greenDot}></span>
              <span className={styles.locationText}>{orderInfo.endLocation}</span>
            </div>
          </div>

          <div className={styles.distanceInfo}>
            {orderInfo.distance}
          </div>
        </div>

        <button className={styles.newOrderButton}>
          重新打车
        </button>
      </div>
    </div>
  );
}
