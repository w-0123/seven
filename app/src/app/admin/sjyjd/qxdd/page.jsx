'use client';

import { useRouter } from 'next/navigation';

export default function CancelOrderPage() {
  const router = useRouter();

  return (
    <div
      style={{
        padding: '20px 16px',
        fontFamily: 'sans-serif',
        color: '#000',
        backgroundColor: '#fff',
        minHeight: '100vh',
      }}
    >
      {/* 提示信息 */}
      <p style={{ fontSize: 18, fontWeight: 500, marginBottom: 16, lineHeight: '26px' }}>
        司机距您
        <span style={{ color: '#1677ff', fontWeight: 600 }}>922米</span>，预计
        <span style={{ color: '#1677ff', fontWeight: 600 }}>1分钟</span>后到达，请耐心等待。
      </p>

      {/* 联系司机按钮 */}
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <button
          style={{
            backgroundColor: '#1677ff',
            color: '#fff',
            fontSize: 16,
            fontWeight: 500,
            padding: '10px 24px',
            border: 'none',
            borderRadius: 22,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          📞 联系司机
        </button>
      </div>

      {/* 提示语 */}
      <div
        style={{
          backgroundColor: '#f5f5f5',
          borderRadius: 8,
          padding: '10px 14px',
          fontSize: 14,
          color: '#666',
          textAlign: 'center',
        }}
      >
        本次取消免费，多次取消后可能会影响叫车服务。
      </div>

      {/* 查看规则 */}
      <div style={{ textAlign: 'center', marginTop: 10, marginBottom: 30 }}>
        <a href="#" style={{ color: '#1677ff', fontSize: 14, textDecoration: 'none' }} onClick={()=>{router.push("/sjyjd/qxdd/qxgz")}}>
          查看取消规则
        </a>
      </div>

      {/* 按钮区域 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 12,
          padding: '0 10px',
        }}
      >
        <button
          style={{
            flex: 1,
            padding: '12px 0',
            borderRadius: 24,
            backgroundColor: '#f5f5f5',
            border: 'none',
            color: '#333',
            fontSize: 16,
            fontWeight: 500,
          }}
          onClick={() => router.push('/admin/waitOrder')}
        >
          确定取消
        </button>
        <button
          style={{
            flex: 1,
            padding: '12px 0',
            borderRadius: 24,
            border: '1px solid #1677ff',
            backgroundColor: '#fff',
            color: '#1677ff',
            fontSize: 16,
            fontWeight: 500,
          }}
          onClick={() => router.push('/admin/sjyjd')}
        >
          暂不取消
        </button>
      </div>
    </div>
  );
}
