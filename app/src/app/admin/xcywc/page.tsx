'use client';
import { useState } from 'react';
import Map from '../Hmap/page';
import 'animate.css';

export default function Page() {
  const [showPaymentSheet, setShowPaymentSheet] = useState(false);
  const [payMethod, setPayMethod] = useState<'wechat' | 'alipay'>('wechat');
  const [loading, setLoading] = useState(false);

  const totalAmount = 18; // 总金额
  const discount = 7; // 优惠金额
  const payableAmount = totalAmount - discount; // 实际支付金额
  const outTradeNo = 'order_' + Date.now(); // 订单号

  const handleConfirmPay = async () => {
    if (payMethod === 'wechat') {
      alert('微信支付暂未实现，请选择支付宝支付');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ out_trade_no: outTradeNo }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert('支付接口调用失败：' + (err.error || '未知错误'));
        setLoading(false);
        return;
      }

      const html = await res.text();
      // 用支付宝返回的支付页HTML替换当前页面，实现跳转
      document.open();
      document.write(html);
      document.close();
    } catch (e) {
      alert('支付异常：' + e);
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
        backgroundColor: '#f3f4f6', // bg-gray-100
      }}
    >
      {/* 地图区域 */}
      <div
        style={{
          zIndex: 0,
          height: '80vh',
        }}
      >
        <Map />
      </div>

      {/* 底部信息卡片 */}
      <div
        className="animate__animated animate__fadeInUp"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          backgroundColor: '#ffffff',
          borderTopLeftRadius: '1rem', // rounded-t-2xl ≈ 1rem
          borderTopRightRadius: '1rem',
          padding: '1rem 1rem', // px-4 py-4
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', // shadow-2xl approximate
          maxWidth: '28rem', // max-w-md
          marginLeft: 'auto',
          marginRight: 'auto',
        }}
      >
        {/* 金额部分 */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '0.5rem', // mb-2
          }}
        >
          <div>
            <div
              style={{
                color: '#f97316', // text-orange-600
                fontSize: '1.5rem', // text-2xl
                fontWeight: '700', // font-bold
                lineHeight: 1.2,
              }}
            >
              {totalAmount.toFixed(2)}{' '}
              <span
                style={{
                  fontSize: '1rem', // text-base
                  color: '#4b5563', // text-gray-700
                }}
              >
                元
              </span>
            </div>
            <div
              style={{
                fontSize: '0.875rem', // text-sm
                color: '#ef4444', // text-red-500
                marginTop: '0.25rem', // mt-1
              }}
            >
              已优惠 -{discount.toFixed(2)}元
            </div>
          </div>
          <button
            onClick={() => alert('查看费用明细')}
            style={{
              fontSize: '0.875rem', // text-sm
              color: '#3b82f6', // text-blue-500
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            费用明细 ▶
          </button>
        </div>

        {/* 司机信息 */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '0.75rem', // mt-3
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem', // gap-3
            }}
          >
            <img
              src="https://ts3.tc.mm.bing.net/th/id/OIP-C.CohMJLUerFj9NRbJC3LxUQHaE8?w=306&h=204&c=8&rs=1&qlt=90&o=6&dpr=1.5&pid=3.1&rm=2"
              alt="司机头像"
              width={48}
              height={48}
              style={{
                borderRadius: '9999px', // rounded-full
                objectFit: 'cover',
              }}
            />
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.25rem', // space-y-1
              }}
            >
              <div
                style={{
                  fontSize: '0.875rem', // text-sm
                  fontWeight: 500, // font-medium
                  color: '#000000',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem', // gap-2
                }}
              >
                粤A · 77777{' '}
                <span
                  style={{
                    fontSize: '0.75rem', // text-xs
                    backgroundColor: '#000000',
                    color: '#ffffff',
                    padding: '0 0.25rem',
                    borderRadius: '0.25rem', // rounded
                  }}
                >
                  黑色
                </span>{' '}
                <span
                  style={{
                    fontSize: '0.75rem', // text-xs
                    color: '#4b5563', // text-gray-600
                  }}
                >
                  劳斯莱斯库里南
                </span>
              </div>
              <div
                style={{
                  fontSize: '0.875rem', // text-sm
                  color: '#4b5563', // text-gray-600
                }}
              >
                胡师傅{' '}
                <span
                  style={{
                    color: '#f97316', // text-orange-500
                    marginLeft: '0.25rem', // ml-1
                  }}
                >
                  ⭐⭐⭐⭐⭐ 5.0分
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => alert('拨打电话')}
            style={{
              backgroundColor: '#3b82f6', // bg-blue-500
              color: '#ffffff',
              padding: '0.5rem',
              borderRadius: '9999px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
              cursor: 'pointer',
              border: 'none',
              fontSize: '1.25rem',
            }}
          >
            📞
          </button>
        </div>

        {/* 操作按钮 */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: '1rem', // gap-4
            marginTop: '1.25rem', // mt-5
          }}
        >
          <button
            onClick={() => alert('一键报警')}
            style={{
              flex: 1,
              backgroundColor: '#ef4444', // bg-red-500
              color: '#ffffff',
              padding: '0.5rem 0',
              borderRadius: '9999px',
              fontSize: '0.875rem', // text-sm
              cursor: 'pointer',
              border: 'none',
            }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#dc2626')} // hover:bg-red-600
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#ef4444')}
          >
            一键报警
          </button>
          <button
            onClick={() => setShowPaymentSheet(true)}
            style={{
              flex: 1,
              backgroundColor: '#f97316', // bg-orange-500
              color: '#ffffff',
              padding: '0.5rem 0',
              borderRadius: '9999px',
              fontSize: '0.875rem', // text-sm
              cursor: 'pointer',
              border: 'none',
            }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#ea580c')} // hover:bg-orange-600
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#f97316')}
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
            zIndex: 60,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-end',
            color: 'black',
            backgroundColor: 'rgba(0,0,0,0.3)', // 增加遮罩，提升体验
          }}
        >
          <div
            className="animate__animated animate__fadeInUp"
            style={{
              backgroundColor: '#ffffff',
              borderTopLeftRadius: '1rem',
              borderTopRightRadius: '1rem',
              width: '100%',
              maxWidth: '28rem',
              padding: '1.25rem',
              boxShadow: '0 -5px 15px rgba(0,0,0,0.1)',
            }}
          >
            <div
              style={{
                textAlign: 'center',
                fontSize: '1rem',
                fontWeight: 500,
                marginBottom: '0.75rem',
              }}
            >
              待支付金额
            </div>
            <div
              style={{
                backgroundColor: '#f3f4f6',
                borderRadius: '0.5rem',
                padding: '1rem',
                marginBottom: '1rem',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.875rem',
                  marginBottom: '0.5rem',
                }}
              >
                <span>合计费用</span>
                <span>{totalAmount.toFixed(2)}元</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.875rem',
                  color: '#f97316',
                  border: '1px solid #fed7aa',
                  borderRadius: '0.375rem',
                  padding: '0.25rem 0.5rem',
                  marginBottom: '0.5rem',
                }}
              >
                <span>优惠券</span>
                <span>-{discount.toFixed(2)}元</span>
              </div>
              <div
                style={{
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  color: '#f97316',
                  textAlign: 'center',
                  marginBottom: '0.5rem',
                }}
              >
                {payableAmount.toFixed(2)} 元
              </div>
              <div
                style={{
                  textAlign: 'right',
                  fontSize: '0.875rem',
                  color: '#3b82f6',
                  cursor: 'pointer',
                }}
                onClick={() => alert('展示费用明细')}
              >
                费用明细
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
              }}
            >
              <label
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderBottom: '1px solid #e5e7eb',
                  padding: '0.5rem 0',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>🟢</span>
                  <span style={{ fontSize: '0.875rem' }}>微信支付</span>
                </div>
                <input
                  type="radio"
                  name="pay"
                  value="wechat"
                  checked={payMethod === 'wechat'}
                  onChange={() => setPayMethod('wechat')}
                />
              </label>

              <label
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.5rem 0',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>🔵</span>
                  <span style={{ fontSize: '0.875rem' }}>支付宝支付</span>
                </div>
                <input
                  type="radio"
                  name="pay"
                  value="alipay"
                  checked={payMethod === 'alipay'}
                  onChange={() => setPayMethod('alipay')}
                />
              </label>
            </div>

            <button
              onClick={handleConfirmPay}
              disabled={loading}
              style={{
                width: '100%',
                marginTop: '1.25rem',
                backgroundColor: loading ? '#fbbf24' : '#f97316',
                color: '#ffffff',
                padding: '0.75rem 0',
                borderRadius: '9999px',
                fontSize: '0.875rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                border: 'none',
              }}
              onMouseEnter={e => !loading && (e.currentTarget.style.backgroundColor = '#ea580c')}
              onMouseLeave={e => !loading && (e.currentTarget.style.backgroundColor = '#f97316')}
            >
              {loading ? '跳转支付中...' : `确认支付${payableAmount.toFixed(2)}元`}
            </button>

            <button
              onClick={() => setShowPaymentSheet(false)}
              style={{
                marginTop: '0.75rem',
                width: '100%',
                padding: '0.5rem 0',
                fontSize: '0.75rem',
                color: '#666',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
