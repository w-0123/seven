'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CancelReasonPage() {
  const router = useRouter();
  const [selectedReason, setSelectedReason] = useState<string>('');

  const reasonGroups = [
    {
      title: '平台相关',
      options: ['平台派单太远', '上车位置错误/找不到上车位置'],
    },
    {
      title: '司机相关',
      options: [
        '联系不上司机',
        '司机以各种理由不来接我',
        '司机要求取消订单',
        '司机原地不动或反方向形式',
        '司机要求加价或现金交易',
        '司机迟到',
        '不上订单显示车辆或司机',
      ],
    },
    {
      title: '自己原因',
      options: ['行程有变', '目的地有误', '选择其他出行工具'],
    },
  ];

  return (
    <div style={{ padding: 16, fontFamily: 'sans-serif', background: '#fff',color:"black" }}>
      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>
        选择取消原因
      </h2>

      {reasonGroups.map((group) => (
        <div key={group.title} style={{ marginBottom: 24 }}>
          <div
            style={{
              fontWeight: 600,
              fontSize: 15,
              background: '#f5f5f5',
              padding: '8px 12px',
              borderRadius: 4,
              marginBottom: 8,
            }}
          >
            {group.title}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {group.options.map((option) => (
              <label
                key={option}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '10px 12px',
                  border: '1px solid #eee',
                  borderRadius: 8,
                  background: selectedReason === option ? '#f0f8ff' : '#fff',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="radio"
                  name="cancelReason"
                  value={option}
                  checked={selectedReason === option}
                  onChange={() => setSelectedReason(option)}
                  style={{ marginRight: 10 }}
                />
                {option}
              </label>
            ))}
          </div>
        </div>
      ))}

      <button
        onClick={() => {
          if (selectedReason) {
            alert(`已选择取消原因：${selectedReason}`);
            router.push('/sjyjd');

          } else {
            alert('请选择一个取消原因');
          }
        }}
        style={{
          position: 'fixed',
          bottom: 16,
          left: 16,
          right: 16,
          background: '#007aff',
          color: '#fff',
          border: 'none',
          borderRadius: 24,
          padding: '14px',
          fontSize: 16,
        }}
      >
        确认提交
      </button>
    </div>
  );
}
