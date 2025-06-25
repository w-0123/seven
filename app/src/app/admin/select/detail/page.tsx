"use client";
import React from 'react'
import { Image, Button } from 'react-vant'
import { ArrowUp, Success } from '@react-vant/icons';
import './detail.css'
import detail from './detail.png'
export default function page() {
    return (
        <div style={{ height: '100vh' }}>
            <div>
                <ul style={{ display: 'flex', boxShadow: '0px 0px 10px 0px rgba(0, 0, 0, 0.1)', listStyle: 'none' }}>
                    <li className='title'>
                        处理进度详情
                    </li>
                </ul>
            </div>

            <div className='center1'>

                <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    textAlign: 'center',
                    lineHeight: '90px',
                    backgroundColor: '#F1F2F1',
                }}>
                    <Image src={detail.src}></Image>
                </div>

                <div
                    style={{
                        fontSize: '20px',
                        fontWeight: '800',
                        marginTop: '15px'
                    }}
                >司机要求加价
                </div>

                <div style={{
                    fontSize: '12px',
                    color: '#878887',
                    marginTop: '15px'
                }}>
                    *已同意客服听取本次行程录音作为判责依据
                </div>

                <div className='button'>
                    <Button>处理中</Button>
                </div>

            </div>

            <div className='center2'>
                <div>
                    <div
                        style={{
                            width: '20px',
                            height: '20px',
                            backgroundColor: '#FF580E',
                            textAlign: 'center',
                            lineHeight: '25px',
                            borderRadius: '50%',
                            position: 'absolute',
                            top: '7%',
                        }}
                    >
                        <Success color='white' />
                    </div>
                    <div
                        style={{
                            width: '20px',
                            height: '20px',
                            backgroundColor: '#C5C7C5',
                            textAlign: 'center',
                            lineHeight: '25px',
                            borderRadius: '50%',
                            position: 'absolute',
                            top: '68%',
                        }}
                    >
                        <ArrowUp color='white' />
                    </div>
                </div>
                <div style={{marginLeft:'50px'}}>
                    <p
                        style={{
                            color: '#FF580E',
                            fontSize: '18px',
                        }}
                    >
                        处理结果
                    </p>
                    <p>您反馈的问题我们已记录。如反馈情况属实，司机将按照平台规则承担违规责任。</p>
                    <p>您的订单金额已修改为6.00元，请您核对。</p>
                    <p 
                        style={{
                            fontSize: '12px',
                        }}
                    >2020-06-06 12:00:00</p>
                    <p
                        style={{
                            fontSize: '18px',
                        }}
                    >提交成功</p>
                    <p>过路费发票显示是5元，司机要我给10元。</p>
                    <p 
                        style={{
                            fontSize: '12px',
                        }}
                    >2020-06-06 12:00:00</p>
                </div>

            </div>
        </div>
    )
}
