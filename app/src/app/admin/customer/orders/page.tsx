"use client";
import React from 'react'
import './orders.css'
export default function page() {
    return (
        <div style={{height:'100vh'}}>
            <div>
                <ul style={{ display: 'flex', listStyle:'none' ,boxShadow: '0px 0px 10px 0px rgba(0, 0, 0, 0.1)' }}>
                    <li className='title'>
                        选择售后订单
                    </li>
                </ul>
            </div>
            <div style={{
                height:'100%',
                backgroundColor: '#F7F7F7',
                padding:'16px'
            }}>
                <div className='news'>
                    <div style={{
                        fontSize: '16px',
                        color: '#333333',
                        marginBottom: '12px'
                    }}>
                        约车 6月24日 10:00
                        <span style={{
                            marginLeft: '8px',
                            padding: '2px 8px',
                            background: '#EEEEEE',
                            borderRadius: '4px',
                            fontSize: '12px'
                        }}>已完成</span>
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
