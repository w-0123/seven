'use client';

import Map from "../Hmap/page";
import 'animate.css';
import { useRouter } from "next/navigation";

export default function Page() {
  const router = useRouter();

  return (
    <div style={{ position: 'relative', height: '100vh', overflow: 'hidden' }}>
      {/* 地图区域 */}
      <div style={{ position: 'absolute', top: 0, bottom: 200, left: 0, right: 0 }}>
        <Map />
      </div>

      {/* 信息面板区域 */}
      <div
        className="animate__animated animate__slideInUp"
        style={{
          position: 'absolute',
          bottom: 0,
          width: '100%',
          backgroundColor: '#fff',
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          boxShadow: '0 -2px 10px rgba(0,0,0,0.1)',
          padding: 16,
          fontFamily: 'sans-serif',
        }}
      >
        {/* 顶部信息 */}
        <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 6, color: '#000' }}>
          司机已接单
        </div>
        <div style={{ fontSize: 14, color: '#888', marginBottom: 12 }}>
          请准时前往上车地点
        </div>

        {/* 司机信息行 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {/* 头像+信息 */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <img
              src="https://ts3.tc.mm.bing.net/th/id/OIP-C.CohMJLUerFj9NRbJC3LxUQHaE8?w=306&h=204&c=8&rs=1&qlt=90&o=6&dpr=1.5&pid=3.1&rm=2"
              alt="司机头像"
              width={50}
              height={50}
              style={{ borderRadius: '50%', marginRight: 12 }}
            />
            <div>
              <div style={{ fontWeight: 'bold', fontSize: 16, color: '#000' }}>粤A·77777</div>
              <div style={{ fontSize: 13, color: '#666' }}>黑色 ｜ 劳斯莱斯库里南</div>
              <div style={{ fontSize: 13, color: '#666' }}>
                胡师傅
                <span style={{ color: '#f60', marginLeft: 6 }}>★★★★★</span>
                <span style={{ color: '#f60', fontSize: 12, marginLeft: 4 }}>5.0分</span>
              </div>
            </div>
          </div>

          {/* 联系司机按钮 */}
          <button
            style={{
              backgroundColor: '#007AFF',
              color: '#fff',
              border: 'none',
              borderRadius: '50%',
              width: 40,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
            }}
            aria-label="Call"
            title="联系司机"
            onClick={() => alert('拨打司机电话')}
          >
            📞
          </button>
        </div>

        {/* 取消按钮 */}
        <div style={{ textAlign: 'right', marginTop: 16 }}>
          <button
            onClick={() => router.push('/admin/sjyjd/qxdd')}
            style={{
              backgroundColor: '#f6f6f6',
              border: '1px solid #ccc',
              borderRadius: 8,
              padding: '6px 14px',
              fontSize: 14,
              color: '#000',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            取消订单
          </button>
        </div>
      </div>
    </div>
  );
}
