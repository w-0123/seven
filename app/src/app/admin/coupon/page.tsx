'use client';

import React from 'react';
import Image from 'next/image';
import Image1 from "./fas fa-chevron-left Copy gxR0fyF@1x.png"

import { useRouter } from 'next/navigation';
import styles from './page.module.css';

const coupons = [
  {
    title: '新人注册大礼包',
    amount: '388元',
    expireDate: '2020年10月01日'
  },
  {
    title: '微信分享礼包',
    amount: '88元',
    expireDate: '2020年10月01日'
  }
];

export default function CouponPage() {
  const router = useRouter();

  return (
    <div className={styles.container}>
      {/* 标题栏 */}
      <div className={styles.header}>
        {/* <button 
          className={styles.backButton}
          onClick={() => router.back()}
        >
          ‹
        </button> */}
        <Image
                src={Image1}
                alt="邀请好友"
                width={18}
                height={18}
                onClick={()=>{router.back()}}
              />
        <h1 className={styles.title}>优惠券</h1>
      </div>

      {/* 优惠券列表 */}
      <div className={styles.couponList}>
        {coupons.map((coupon, index) => (
          <div key={index} className={styles.couponCard}>
            <div className={styles.couponLeft}>
              <div className={styles.placeholder}>
                {/* 优惠券图标占位符 */}
                
              </div>
            </div>
            <div className={styles.couponInfo}>
              <div className={styles.couponTitle}>
                {coupon.title}
              </div>
              <div className={styles.couponExpire}>
                有效期至{coupon.expireDate}
              </div>
            </div>
            <div className={styles.couponAmount}>
              {coupon.amount}
              <span className={styles.arrow}>›</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 