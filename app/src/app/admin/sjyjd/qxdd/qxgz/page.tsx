'use client';
import { useRouter } from "next/navigation";
export default function CancelRulePage() {
  const router = useRouter();
  return (
    
    <div
      style={{
        fontFamily: 'sans-serif',
        padding: '16px',
        backgroundColor: '#fff',
        color: '#000',
        minHeight: '100vh',
        boxSizing: 'border-box',
      }}
    >
      <button onClick={()=>{router.push("/sjyjd/qxdd")}}>返回</button>
      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>取消规则</h2>

      <p style={{ fontSize: 15, lineHeight: '24px', marginBottom: 16 }}>
        以下为快车实时单取消规则：
        <br />
        1. 为了保证平台公平性，因您责任导致订单取消时，您需支付一定的取消费，用于补偿司机的空驶成本。如对系统判责有疑问，您可投诉反馈，我们会尽快核实并反馈结果。
      </p>

      <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>您无需支付取消费的场景</p>
      <p style={{ fontSize: 15, lineHeight: '24px', marginBottom: 16 }}>
        1. 您在3分钟内取消订单。
        <br />
        2. 司机未在规定时间内（详见软件提示）到达上车点。
        <br />
        3. 司机未朝上车点行驶，或以其他各种理由不来接您时，您取消订单。
      </p>

      <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>取消费的计算方式</p>
      <p style={{ fontSize: 15, lineHeight: '24px' }}>
        1. 若司机空驶少于1公里，您需支付 <strong>4元</strong> 取消费作为司机的补偿。
        <br />
        2. 若司机空驶超过1公里，超过1公里的部分将以每公里 <strong>1元</strong> 的取消费作为司机补偿，最多 <strong>5元</strong>。
      </p>
    </div>
  );
}
