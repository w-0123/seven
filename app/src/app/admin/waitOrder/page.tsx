"use client";
import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic'; // 导入 dynamic
import './page.css'; // 导入 CSS 文件
import img1 from '../../../asstes/1.png'
import img2 from '../../../asstes/self.png'
import img3 from '../../../asstes/safe.png'
import img4 from '../../../asstes/home.png'
import img5 from '../../../asstes/company.png'
import img6 from '../../../asstes/ling.png'

import styles from './page.module.css';
import Image from 'next/image';
import Image1 from '../../../../public/image.png';
import Image2 from '../../../../public/haoyou.png';
import Image3 from '../../../../public/overlay.png';
import Image4 from '../../../../public/Image3.png';
import Image5 from '../../../../public/riLine-shield-cross-line YiyvGsU@1x.png';
import Image6 from '../../../../public/riLine-customer-service-2-line XE8zsyr@1x.png';
import Image7 from '../../../../public/riLine-settings-line WV7yE5V@1x.png';

interface MenuItem {
    icon: any;
    label: string;
    path?: string;
}
import { useRouter } from 'next/navigation'

const Amap = dynamic(() => import('../xvamap/page'), { ssr: false }); // 动态导入 Amap 并禁用 SSR

export default function WaitOrder() {

    const [isOpen, setIsOpen] = useState(false);
    const router = useRouter();

    const menuItems: MenuItem[] = [
        { icon: Image3, label: '我的行程', path: '/admin/itinerary' },
        { icon: Image4, label: '优惠券', path: '/admin/coupon' },
        { icon: Image5, label: '账号与安全', path: '/admin/account' },
        { icon: Image6, label: '联系客服', path: '/admin/customer' },
        { icon: Image7, label: '设置' },
    ];

    const handleMenuClick = (item: MenuItem) => {
        if (item.path) {
            router.push(item.path);
        }
    };

    const [showBottomPopup, setShowBottomPopup] = useState(false);

    useEffect(() => {
        // 在组件加载时显示底部弹窗
        setShowBottomPopup(true);
    }, []);

    return (


        <div className="container">
            {/* 顶部栏 */}
            <header>
                <img src={img1.src} alt="" className="header" />
                <div className='hed'>
                    <img src={img2.src} alt="" className='header-icon' onClick={() => setIsOpen(true)} />
                    <h1 className="header-title">白菜出行</h1>
                    <div className="header-spacer"></div>
                </div>
            </header>

            {/* 搜索栏 */}
            <section className="search-section">
                <div className="search-box">
                    <img src={img6.src} alt="" className="search-icon" />
                    <input
                        type="text"
                        placeholder="617聚合出行日百万补贴优惠券等你来体验!"
                        className="search-input"
                        readOnly
                    />
                </div>
            </section>

            {/* 地图区域 - 填充可用空间 */}
            <div className="map-area">
                <Amap />
            </div>

            {/* 安全中心浮动盒子 */}
            <div className="safety-center-float">
                <img src={img3.src} alt="" className="safety-center-icon" />
                <div className="safety-center-title">安全中心</div>
            </div>

            {/* 行程派单中间部分 */}
            <div className="middle-section"> {/* 调整 bottom 值以适应合并后的弹窗高度，并保留适当的间隙 */}
                <div className="middle-section-text">您有一个行程派单中...</div>
                <button className="view-button" onClick={() => router.push('/admin/orders?id=1')}>
                    查看
                </button>
            </div>


            {/* 底部弹窗内容 */}
            <div className="bottom-popup" >
                <div className='pting'>
                    {/* 越秀财富世纪广场-停车场 */}
                    <div className="location-item">
                        <span className="location-dot-blue"></span>
                        <div>
                            <div className="location-title">保定理工学院东院-东门</div>
                            <div className="location-subtitle">推荐上车点</div>
                            <div className='line'></div>
                        </div>
                    </div>

                    {/* 您要去哪儿 */}
                    <div className="destination-input-group" onClick={() => router.push('/admin/end')}>
                        <span className="location-dot-green"></span>
                        <span className='where'>您要去哪儿</span>
                    </div>
                </div>

                {/* 家和公司 */}
                <div className="home-company-section">
                    <div className="home-company-item">
                        <div className='home'>
                            <div className='home1'>
                                <img src={img4.src} alt="" className="home-company-icon" />
                            </div>
                            <div className='home2'>
                                <div className="home-company-title">家</div>
                                <div className="home-company-subtitle">大江苑</div>
                            </div>
                        </div>
                    </div>
                    <div className="home-company-item">
                        <div className='company'>
                            <div className='company1'>
                                <img src={img5.src} alt="" className="home-company-icon" />
                            </div>
                            <div className='company2'>
                                <div className="home-company-title">公司</div>
                                <div className="home-company-subtitle">设置公司的地址</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div>
                {isOpen && (
                    <div className={styles.overlay} onClick={() => setIsOpen(false)}>
                        <div className={styles.sidebar} onClick={(e) => e.stopPropagation()}>
                            {/* 用户信息区域 */}
                            <div className={styles.userInfo}>
                                <div className={styles.avatar}>
                                    <Image
                                        src={Image1}
                                        alt="用户头像"
                                        width={24}
                                        height={24}
                                    />
                                </div>
                                <span className={styles.userId}>132****7777</span>
                            </div>

                            {/* 促销banner */}
                            <div className={styles.promotionBanner}>
                                <Image
                                    src={Image2}
                                    alt="邀请好友"
                                    width={300}
                                    height={60}
                                    className={styles.bannerImage}
                                />
                            </div>

                            {/* 菜单列表 */}
                            <div className={styles.menuList}>
                                {menuItems.map((item, index) => (
                                    <div
                                        key={index}
                                        className={styles.menuItem}
                                        onClick={() => handleMenuClick(item)}
                                    >
                                        <Image
                                            src={item.icon}
                                            alt="用户头像"
                                            width={24}
                                            height={24}
                                            className={styles.menuIcon}
                                        />
                                        <span className={styles.menuLabel}>{item.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}