"use client";
import React from "react";
import { Image, Button } from "react-vant";
import {
  Arrow,
  Bag,
  Clock,
  Location,
  Bill,
  More,
  Search,
  Service,
} from "@react-vant/icons";

import "./customer.css";
import left from "./left.png";
import { useRouter } from "next/navigation";
const ServiceItem = ({ icon: Icon, text }: { icon: any; text: string }) => (
  <div className="service-item">
    <div className="service-content">
      <Icon className="service-icon" />
      <span>{text}</span>
    </div>
    <Arrow />
  </div>
);

export default function page() {
  const router = useRouter();
  return (
    <div>
      <div>
        <ul
          style={{
            display: "flex",
            boxShadow: "0px 0px 10px 0px rgba(0, 0, 0, 0.1)",
          }}
        >
          <li
            style={{
              marginLeft: "18px",
              marginTop: "54px",
              position: "absolute",
            }}
          >
            <Image
              width={left.width + "px"}
              height={left.height + "px"}
              src={left.src}
            />
          </li>
          <li className="title">客服中心</li>
        </ul>
      </div>

      <div className="news">
        <ul
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <li
            style={{
              width: "164px",
              height: "25px",
              lineHeight: "25px",
              fontSize: "18px",
              fontWeight: "bold",
            }}
          >
            我的行程
          </li>
          <li>
            <Button
              style={{
                width: "98px",
                height: "34px",
                lineHeight: "20px",
                fontSize: "14px",
                borderRadius: "50px",
              }}
              color="#FF580E"
              onClick={() => { router.push('/admin/customer/orders') }}
            >
              切换订单
            </Button>
          </li>
        </ul>

        <div
          style={{
            marginTop: "16px",
          }}
        >
          <div
            style={{
              fontSize: "16px",
              color: "#333333",
              marginBottom: "12px",
            }}
          >
            约车 6月24日 10:00
            <span
              style={{
                marginLeft: "8px",
                padding: "2px 8px",
                background: "#EEEEEE",
                borderRadius: "4px",
                fontSize: "12px",
              }}
            >
              已完成
            </span>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: "#4A90E2",
                }}
              ></div>
              <span>越秀财富世纪广场-停车场</span>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: "#50E3C2",
                }}
              ></div>
              <span>大江苑</span>
            </div>
          </div>
        </div>
      </div>

      <hr
        style={{
          width: "90%",
          height: "1px",
          background: "F1F2F1",
          margin: "0 auto",
        }}
      />

      <div className="service-section">
        <h2
          style={{
            width: "164px",
            height: "25px",
            lineHeight: "25px",
            fontSize: "18px",
            fontWeight: "bold",
          }}
        >
          服务类型
        </h2>

        <div className="service-list">
          <ServiceItem icon={Bag} text="物品遗失" />
          <ServiceItem icon={Bill} text="未坐车需付车费" />
          <ServiceItem icon={Clock} text="下车后未结束计算" />
          <ServiceItem icon={Location} text="司机绕路" />
          <ServiceItem icon={Bill} text="被收取消费" />
          <ServiceItem icon={More} text="多收附加费" />
        </div>
      </div>

      <hr
        style={{
          width: "90%",
          height: "1px",
          background: "F1F2F1",
          margin: "0 auto",
        }}
      />

      <div className="service-section">
        <h2
          style={{
            marginTop: "24px",
            width: "164px",
            height: "25px",
            lineHeight: "25px",
            fontSize: "18px",
            fontWeight: "bold",
          }}
        >
          其他功能
        </h2>

        <div className="service-list">
          <div onClick={() => { router.push('/admin/select') }}><ServiceItem icon={Search} text="查询处理进度"  /></div>
          <div onClick={() => { router.push('/admin/ai') }}>
            <ServiceItem icon={Service} text="联系客服" />
          </div>
        </div>
      </div>
    </div>
  );
}
