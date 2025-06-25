"use client";
import React from 'react'
import './select.css'
import { Button } from 'react-vant';
import { useRouter } from 'next/navigation';
export default function page() {
    const router = useRouter();
    return (
        <div style={{ height: '100vh' }}>
            <div style={{ boxShadow: '0px 0px 10px 0px rgba(0, 0, 0, 0.1)', height: '158px' }}>
                <ul style={{ display: 'flex' }}>
                    <li className='title'>
                        处理进度查询
                    </li>
                </ul>

                <ul className='button'>
                    <li>
                        <Button>处理中</Button>
                    </li>
                    <li>
                        <Button>已完成</Button>
                    </li>
                </ul>
            </div>
            <div style={{
                height: '100%',
                backgroundColor: '#F7F7F7',
                padding: '16px'
            }}>

                <div className='news' onClick={() => { router.push('/admin/select/detail') }}>
                    <div>
                        <ul style={{display:'flex',justifyContent:'space-between',}}>
                            <li
                                style={{
                                    fontSize: '16px',
                                    fontWeight: '600',
                                }}
                            >司机要求加价</li>
                            <li
                                style={{
                                    fontSize: '12px',
                                    color:'#878887'
                                }}
                            >昨晚12:00</li>
                        </ul>
                    </div>

                    <div style={{
                        fontSize: '16px',
                        color: '#333333',
                        marginTop: '12px',
                        marginBottom: '12px'
                    }}>
                        约车 6月24日 10:00
                    </div>

                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            <div style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                background: '#4A90E2'
                            }}></div>
                            <span>越秀财富世纪广场-停车场</span>
                        </div>

                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            <div style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                background: '#50E3C2'
                            }}></div>
                            <span>大江苑</span>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    )
}
