'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import Image from 'next/image';
import AMapComponent from '../liamap/page';
import BackIcon from "./fas fa-chevron-left Copy FrG6IMY@1x.png";
import SupportIcon from "./riLine-customer-service-2-line Copy b9yGnBy@1x.png";
import CallIcon from "./md-call FvdjBsx@1x.png";
import Image1 from "./图片 AaDzq8w@1x.png"

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

// 保定万博广场坐标
const DESTINATION: [number, number] = [115.469399, 38.875899];


export default function PaymentPage({ path }: AMapComponentProps) {
  const [payMethod, setPayMethod] = useState<'wechat' | 'alipay'>('wechat');
  const router = useRouter();
  const [showPaymentSheet, setShowPaymentSheet] = useState(false)
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
    amount: 18.00,
    discount: 7,
    driverInfo: {
      plateNumber: "粤A·77777",
      name: "黑色",
      carModel: "劳斯莱斯库里南",
      rating: 5.0,
      avatar: Image1
    }
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
        <h1 className={styles.title}>支付订单</h1>
        <button
          className={styles.supportButton}
          aria-label="联系客服"
        >
          <Image
            src={SupportIcon}
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


      {/* 司机信息卡片 */}
      <div className={styles.driverCard}>

        {/* 费用信息 */}
        <div className={styles.priceInfo}>
          <div className={styles.mainPrice}>
            <div>
              <span className={styles.amount}>{orderInfo.amount.toFixed(2)}</span>
              <span className={styles.currency}>元</span>
            </div>
            <div className={styles.discount}>
              已优惠 -{orderInfo.discount}元
            </div>
          </div>

          <div className={styles.detailLink}>
            费用明细 ›
          </div>
        </div>

        <div className={styles.hr}></div>

        {/* 司机信息 */}
        <div className={styles.driverInfo}>
          <div className={styles.avatarContainer}>
            <Image
              src={orderInfo.driverInfo.avatar}
              alt="司机头像"
              width={60}
              height={60}
              className={styles.avatar}
            />
          </div>
          <div className={styles.driverDetails}>
            <div className={styles.plateNumber}>{orderInfo.driverInfo.plateNumber}</div>
            <div className={styles.carInfo}>
              <span className={styles.driverName}>{orderInfo.driverInfo.name}</span>
              <span className={styles.separator}>|</span>
              <span className={styles.carModel}>{orderInfo.driverInfo.carModel}</span>
            </div>
            <div className={styles.rating}>
              <span className={styles.ratingText}>胡师傅</span>
              <div className={styles.stars}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <span key={star} className={styles.star}>★</span>
                ))}
              </div>
              <span className={styles.ratingScore}>{orderInfo.driverInfo.rating}分</span>
            </div>
          </div>
          <div>
            <div className={styles.phone}>
              <Image
                src={CallIcon}
                alt="电话"
                width={24}
                height={24}
              />
            </div>
          </div>
        </div>
        <div className={styles.buttonGroup}>
          <button className={styles.reportButton}>
            一键报警
          </button>
          <button className={styles.payButton}
            onClick={() => setShowPaymentSheet(true)}
          >
            立即支付
          </button>
        </div>
      </div>
      {showPaymentSheet && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 20,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-end',
            backgroundColor: 'rgba(0,0,0,0.3)', // 半透明遮罩
          }}
          onClick={() => {
            if (!loading) setShowPaymentSheet(false);
          }} // 点击遮罩关闭弹窗（loading时禁止关闭）
        >
          <div
            className="animate__animated animate__fadeInUp"
            style={{
              backgroundColor: '#fff',
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              width: '90vw',
              maxWidth: 400,
              padding: 20,
              boxShadow: '0 -4px 12px rgba(0,0,0,0.15)',
            }}
            onClick={(e) => e.stopPropagation()} // 阻止冒泡，防止点击弹窗内关闭
          >
            <div
              style={{
                textAlign: 'center',
                marginBottom: 20,
                fontWeight: 'bold',
                fontSize: 16,
              }}
            >
              待支付金额
            </div>
            <div
              style={{
                backgroundColor: '#f3f4f6',
                borderRadius: 8,
                padding: 16,
                marginBottom: 16,
                fontSize: 14,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: 8,
                }}
              >
                <span>合计费用</span>
                <span>18.00元</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  color: '#f97316',
                  border: '1px solid #f97316',
                  borderRadius: 6,
                  padding: '4px 8px',
                  marginBottom: 8,
                }}
              >
                <span>优惠券</span>
                <span>-7.00元</span>
              </div>
              <div
                style={{
                  fontWeight: 'bold',
                  fontSize: 22,
                  color: '#f97316',
                  textAlign: 'center',
                }}
              >
                11.00 元
              </div>
              <div
                style={{ textAlign: 'right', color: '#3b82f6', fontSize: 12, cursor: 'pointer' }}
                onClick={() => alert('费用明细')}
              >
                费用明细
              </div>
            </div>

            {/* 支付方式 */}
            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 0',
                  borderBottom: '1px solid #eee',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>🟢</span>
                  <span style={{ fontSize: 14 }}>微信支付</span>
                </div>
                <input
                  type="radio"
                  name="pay"
                  value="wechat"
                  checked={payMethod === 'wechat'}
                  onChange={() => setPayMethod('wechat')}
                  disabled={loading}
                />
              </label>
              <label
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 0',
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>🔵</span>
                  <span style={{ fontSize: 14 }}>支付宝支付</span>
                </div>
                <input
                  type="radio"
                  name="pay"
                  value="alipay"
                  checked={payMethod === 'alipay'}
                  onChange={() => setPayMethod('alipay')}
                  disabled={loading}
                />
              </label>
            </div>

            {/* 确认支付按钮 */}
            <button
              style={{
                width: '100%',
                padding: '12px 0',
                backgroundColor: loading ? '#fbbf24' : '#f97316',
                color: '#fff',
                border: 'none',
                borderRadius: 24,
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: 16,
                fontWeight: 'bold',
                boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                transition: 'background-color 0.3s ease',
              }}
              disabled={loading}
              onClick={async () => {
                if (payMethod === 'wechat') {
                  alert('微信支付暂未实现，请选择支付宝支付');
                  return;
                }

                setLoading(true);

                try {
                  const res = await fetch('/api/pay',
                    {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        out_trade_no: 'order_' + Date.now(),
                        total_amount: '11.00',
                        subject: '滴滴出行',
                      }),
                    });

                  // 检查响应状态
                  if (!res.ok) {
                    const err = await res.text(); // 先尝试解析为文本
                    throw new Error(err || '支付接口调用失败');
                  }

                  // 获取支付宝 HTML 表单
                  const html = await res.text();
                  const payWindow = window.open('', '_blank');
                  payWindow?.document.write(html);

                } catch (e: any) {
                  alert('支付异常：' + (e?.message || e));
                } finally {
                  setLoading(false);
                }
              }}
            >
              {loading ? '跳转支付中...' : `确认支付11.00元`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
