'use client';

import React ,{useState,useRef,useEffect} from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import AMapComponent from '../liamap/page';
import Image from 'next/image';
import Image1 from "./riLine-customer-service-2-line Copy b9yGnBy@1x.png";
// import DriverAvatar from "./driver-avatar.jpg";
import Image2 from "./图片 AaDzq8w@1x.png"
import Image3 from "./md-call FvdjBsx@1x.png"
import Image4 from "./fas fa-chevron-left Copy FrG6IMY@1x.png"


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

// 保定爱情广场坐标
const DESTINATION: [number, number] = [115.463854, 38.821004];

export default function OrderDetailPage({ path }: AMapComponentProps) {
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


  const driverInfo = {
    plateNumber: "粤A·77777",
    name: "黑色",
    carModel: "劳斯莱斯库里南",
    rating: 5.0,
    avatar: Image2
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
            src={Image4}
            alt="返回"
            width={19}
            height={19}
          />
        </button>
        <h1 className={styles.title}>行程开始</h1>
        <button
          className={styles.supportButton}
          aria-label="联系客服"
        >
          <Image
            src={Image1}
            alt="客服"
            width={24}
            height={24}
          />
        </button>
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

      {/* 行程信息 */}
      <div className={styles.tripInfo}>
        {/* 司机信息卡片 */}
        <div className={styles.driverCard}>
          <div className={styles.driverInfo}>
            <div className={styles.avatarContainer}>
              <Image
                src={driverInfo.avatar}
                alt="司机头像"
                width={48}
                height={48}
                className={styles.avatar}
              />
            </div>
            <div className={styles.driverDetails}>
              <div className={styles.plateNumber}>{driverInfo.plateNumber}</div>
              <div className={styles.carInfo}>
                <span className={styles.driverName}>{driverInfo.name}</span>
                <span className={styles.separator}>|</span>
                <span className={styles.carModel}>{driverInfo.carModel}</span>
              </div>
              <div className={styles.rating}>
                <span className={styles.ratingText}>胡师傅</span>
                <div className={styles.stars}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span key={star} className={styles.star}>★</span>
                  ))}
                </div>
                <span className={styles.ratingScore}>{driverInfo.rating}分</span>
              </div>
            </div>
            <div>
              <div className={styles.phone}>
                <Image
                  src={Image3}
                  alt="电话"
                  width={24}
                  height={24}
                  // className={styles.avatar}
                />
              </div>
            </div>
          </div>
          <button className={styles.reportButton}>
            一键报警
          </button>
        </div>
      </div>
    </div>
  );
}
