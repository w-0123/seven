'use client';

import Map from '../Hmap/page';
import { useRouter } from 'next/navigation';
import 'animate.css';

export default function Page() {
  const router = useRouter();

  return (
    <div style={{ position: 'relative', height: '100vh', overflow: 'hidden' }}>
      {/* 地图全屏显示 */}
      <div style={{ position: 'absolute', top: 0, bottom: 180, left: 0, right: 0 }}>
        <Map />
      </div>

      {/* 底部信息面板 */}
      <div
        className="animate__animated animate__fadeInUp"
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
        {/* 顶部标题和取消按钮 */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 6,
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 600, color: '#000' }}>司机已到达</div>
          <button
            onClick={() => router.push('/sjyjd/qxdd')}
            style={{
              backgroundColor: '#f6f6f6',
              border: '1px solid #ccc',
              borderRadius: 6,
              padding: '4px 10px',
              fontSize: 14,
              color: '#000',
              cursor: 'pointer',
            }}
          >
            取消订单
          </button>
        </div>

        {/* 副标题 */}
        <div style={{ color: '#888', fontSize: 14, marginBottom: 12 }}>
          请准时前往上车地点
        </div>

        {/* 司机信息卡片 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {/* 左侧头像和信息 */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <img
              src="https://ts3.tc.mm.bing.net/th/id/OIP-C.CohMJLUerFj9NRbJC3LxUQHaE8?w=306&h=204&c=8&rs=1&qlt=90&o=6&dpr=1.5&pid=3.1&rm=2"
              alt="司机头像"
              width={48}
              height={48}
              style={{ borderRadius: '50%', marginRight: 10 }}
            />
            <div>
              <div style={{ fontWeight: 'bold', fontSize: 16, color: '#000' }}>粤A·77777</div>
              <div style={{ color: '#666', fontSize: 13 }}>黑色 ｜ 劳斯莱斯库里南</div>
              <div style={{ color: '#666', fontSize: 13 }}>
                胡师傅
                <span style={{ color: '#f60', marginLeft: 6 }}>★★★★★</span>
                <span style={{ color: '#f60', fontSize: 12, marginLeft: 4 }}>5.0分</span>
              </div>
            </div>
          </div>

          {/* 右侧按钮 */}
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
            title="联系司机"
            aria-label="拨打电话"
            onClick={() => alert('拨打司机电话')}
          >
            📞
          </button>
        </div>
      </div>
    </div>
  );
}
