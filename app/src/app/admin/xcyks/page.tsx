'use client';

import Map from '../Hmap/page';
import 'animate.css';
import { useState } from 'react';

export default function Page() {
  const [showPaymentSheet, setShowPaymentSheet] = useState(false);
  const [payMethod, setPayMethod] = useState<'wechat' | 'alipay'>('wechat');
  const [loading, setLoading] = useState(false);

  return (
    <div
      style={{
        position: 'relative',
        height: '100vh',
        width: '100%',
        backgroundColor: '#f0f0f0',
        fontFamily: 'sans-serif',
        overflow: 'hidden',
      }}
    >
      {/* 地图区域，铺满全屏 */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <Map />
      </div>

      {/* 底部信息卡片 */}
      <div
        className="animate__animated animate__fadeInUp"
        style={{
          position: 'fixed',
          bottom: 0,
          transform: 'translateX(-50%)',
          zIndex: 10,
          backgroundColor: '#fff',
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          boxShadow: '0 -2px 10px rgba(0,0,0,0.1)',
          padding: 16,
          width: '90vw',
          maxWidth: 400,
        }}
      >
        {/* 金额与费用明细 */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}
        >
          <div>
            <div
              style={{
                fontSize: 20,
                color: '#f60',
                fontWeight: 'bold',
              }}
            >
              18.00 <span style={{ fontSize: 14, color: '#666' }}>元</span>
            </div>
            <div style={{ color: '#f60', fontSize: 14, marginTop: 2 }}>
              已优惠 -7元
            </div>
          </div>
          <div
            style={{
              fontSize: 14,
              color: '#007aff',
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
            onClick={() => alert('查看费用明细')}
          >
            费用明细
          </div>
        </div>

        {/* 分割线 */}
        <div
          style={{
            height: 1,
            backgroundColor: '#eee',
            margin: '12px 0',
          }}
        />

        {/* 司机信息 */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
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
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: '#000',
                }}
              >
                粤A·77777
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 400,
                    color: '#666',
                    marginLeft: 8,
                  }}
                >
                  黑色｜劳斯莱斯库里南
                </span>
              </div>
              <div style={{ fontSize: 13, color: '#666' }}>
                胡师傅
                <span style={{ color: '#f60', marginLeft: 6 }}>★★★★★</span>
                <span style={{ color: '#f60', fontSize: 13, marginLeft: 4 }}>
                  5.0分
                </span>
              </div>
            </div>
          </div>

          {/* 电话按钮 */}
          <button
            style={{
              backgroundColor: '#007AFF',
              color: '#fff',
              borderRadius: '50%',
              width: 36,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: 'none',
              fontSize: 18,
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
            }}
            title="拨打电话"
            onClick={() => alert('拨打司机电话')}
          >
            📞
          </button>
        </div>

        {/* 操作按钮 */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: 20,
            gap: 10,
          }}
        >
          <button
            style={{
              flex: 1,
              backgroundColor: '#FF4D4F',
              color: '#fff',
              border: 'none',
              borderRadius: 24,
              padding: '10px 0',
              fontSize: 16,
              fontWeight: 500,
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}
            onClick={() => alert('已报警')}
          >
            一键报警
          </button>
          <button
            style={{
              flex: 1,
              backgroundColor: '#f97316',
              color: '#fff',
              border: 'none',
              borderRadius: 24,
              padding: '10px 0',
              fontSize: 16,
              fontWeight: 500,
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}
            onClick={() => setShowPaymentSheet(true)} // 显示弹窗
          >
            立即支付
          </button>
        </div>
      </div>

      {/* 支付详情弹出层 */}
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
