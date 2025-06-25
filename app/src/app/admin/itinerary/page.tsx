'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

import Image from 'next/image';
import Image1 from "./md-keyboard_arrow_right 48CsJFr@1x.png"

const allTrips = [
  {
    id: 1,
    status: '进行中',
    time: '约车 6月24日 10:00',
    fromLocation: '保定理工学院',
    toLocation: '保定爱情广场',
    needReview: false
  },
  {
    id: 2,
    status: '待支付',
    time: '约车 6月24日 10:00',
    fromLocation: '保定理工学院',
    toLocation: '保定万博广场',
    showPayment: true,
    needReview: false
  },
  {
    id: 3,
    status: '已取消',
    time: '约车 6月24日 10:00',
    fromLocation: '保定理工学院',
    toLocation: '保定站',
    needReview: false
  },
  {
    id: 4,
    status: '已完成',
    time: '约车 6月24日 10:00',
    fromLocation: '保定理工学院',
    toLocation: '保定市动物园',
    needReview: true
  }
];

export default function ItineraryPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('all');

  // 根据当前标签筛选行程
  const filteredTrips = activeTab === 'review'
    ? allTrips.filter(trip => trip.needReview)
    : allTrips;

  const handleTripClick = (trip: typeof allTrips[0]) => {
    // 根据订单状态跳转到不同页面
    switch (trip.status) {
      case '进行中':
        router.push(`/admin/orders?id=${trip.id}`);
        break;
      case '待支付':
        router.push(`/admin/payment?id=${trip.id}`);
        break;
      case '已取消':
        router.push(`/admin/cancel?id=${trip.id}`);
        break;
      case '已完成':
        router.push(`/admin/finish?id=${trip.id}`);
        break;
      default:
        router.push(`/admin/orders?id=${trip.id}`);
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
          ‹
        </button>
        <h1 className={styles.title}>我的行程</h1>
        <button className={styles.invoiceButton}>开发票</button>
      </div>

      {/* 标签栏 */}
      <div className={styles.tabBar}>
        <button
          className={`${styles.tabButton} ${activeTab === 'all' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('all')}
        >
          全部
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'review' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('review')}
        >
          待评价
        </button>
      </div>

      {/* 行程列表 */}
      <div className={styles.tripList}>
        {filteredTrips.map((trip) => (
          <div 
            key={trip.id} 
            className={styles.tripCard}
            onClick={() => handleTripClick(trip)}
          >
            <div className={styles.tripHeader}>
              <div className={styles.tripTime}>
                <div>{trip.time}</div>
                <div className={`${styles.tripStatus} ${styles[trip.status]}`}>
                  {trip.status}
                </div>
              </div>

              {trip.showPayment && (
                <div className={styles.paymentButton}>
                  去支付
                </div>
              )}

              <Image
                src={Image1}
                alt="邀请好友"
                width={20}
                height={20}
                className={styles.bannerImage}
              />

            </div>

            <div className={styles.tripContent}>
              <div className={styles.locationInfo}>
                <div className={styles.location}>
                  <span className={styles.blueDot}></span>
                  <span className={styles.locationText}>{trip.fromLocation}</span>
                </div>
                <div className={styles.verticalLine}></div>
                <div className={styles.location}>
                  <span className={styles.greenDot}></span>
                  <span className={styles.locationText}>{trip.toLocation}</span>
                </div>
              </div>
              {/* <div className={styles.arrow}>›</div> */}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
