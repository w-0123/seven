"use client";

import React from "react";
import { NavBar } from "antd-mobile";
import { useRouter } from "next/navigation";


export default function AuthPage() {
  const router = useRouter();

  return (
    <div style={{ minHeight: "100vh", background: "#f7f8fa", fontFamily: 'PingFang SC, Arial, sans-serif' }}>
      {/* 顶部栏 */}
      <NavBar
        backArrow={true}
        onBack={() => router.back()}
        style={{ background: '#fff', color: '#222', fontWeight: 500, fontSize: 20, boxShadow: '0 1px 0 #eee', position: 'sticky', top: 0, zIndex: 10 }}
      >
        授权确认
      </NavBar>

      {/* 主体内容 */}
      <div style={{ padding: '0 20px', marginTop: 18 }}>
        <div style={{ fontSize: 24, fontWeight: 700, color: '#111', marginBottom: 6, lineHeight: 1.3 }}>请进行安全录音录像授权</div>
        <div style={{ color: '#999', fontSize: 15, marginBottom: 18 }}>授权后方可使用聚合出行打车服务</div>

        <div style={{ color: '#222', fontSize: 17, fontWeight: 600, marginBottom: 8 }}>
          录音录像只在
          <span style={{ color: '#2574ff', fontWeight: 600 }}>车辆上</span>
          完成，不使用您的流量
        </div>
        <div style={{ color: '#444', fontSize: 15, lineHeight: 1.7, marginBottom: 16 }}>
          授权后，每次行程中所有服务商都会进行行程录音，部分服务商会进行行程录音及录像（滴滴）。但因设备性能等限制，车内环境较差或网络信号不佳时，可能会导致无法录音、录像，或者录音录像清晰度低。
        </div>

        <div style={{ color: '#222', fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
          供司乘纠纷调查取证
        </div>
        <div style={{ color: '#444', fontSize: 15, lineHeight: 1.7, marginBottom: 16 }}>
          当司乘产生纠纷时，录音录像将用于车内纠纷调查取证。
        </div>

        <div style={{ color: '#222', fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
          录音录像
          <span style={{ color: '#2574ff', fontWeight: 600, cursor: 'pointer' }}>加密保存</span>
          ，如无纠纷将于
          <span style={{ color: '#2574ff', fontWeight: 600, cursor: 'pointer' }}>7天后</span>
          自动删除
        </div>
        <div style={{ color: '#444', fontSize: 15, lineHeight: 1.7, marginBottom: 16 }}>
          聚合出行将按照相关的法律规定，通过加密保护技术以及严格的录音录像调取流程及规范，保障司乘隐私，如无行程纠纷，录音录像将于7天后自动删除。
        </div>
      </div>

      {/* 协议说明 */}
      <div style={{ color: '#bbb', fontSize: 15, textAlign: 'center', margin: '0 0 16px 0' }}>
        《白菜出行各合作方录音录像授权协议》
      </div>

      {/* 底部按钮 */}
      <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, background: 'transparent', padding: '0 0 18px 0', zIndex: 20 }}>
        <button
          style={{
            width: '92%',
            margin: '0 4%',
            height: 52,
            background: 'linear-gradient(90deg, #2574ff 0%, #4e9bff 100%)',
            color: '#fff',
            fontSize: 20,
            fontWeight: 600,
            border: 'none',
            borderRadius: 28,
            boxShadow: '0 4px 16px #2574ff33',
            cursor: 'pointer',
            letterSpacing: 1,
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={() => router.push('/admin/dispatch')}
        >
          同意并授权
          {/* <img src="https://img.icons8.com/fluency/24/000000/checked-checkbox.png" alt="" style={{ marginLeft: 8, width: 20, height: 20 }} /> */}
        </button>
      </div>
    </div>
  );
}
