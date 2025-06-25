"use client";
import React from 'react'
import './account.css'
import { useRouter } from 'next/navigation'
export default function page() {
    const router=useRouter()
    return (
        <div style={{height:'100vh'}}>
            <div>
                <ul style={{ display: 'flex',listStyle:'none', boxShadow: '0px 0px 10px 0px rgba(0, 0, 0, 0.1)' }}>
                    <li className='title'>
                        账户与安全
                    </li>
                </ul>
            </div>

            <div>
                <ul style={{padding:'30px',listStyle:'none'}}>
                    <li style={{padding:'10px',display:'flex',alignItems:'center',justifyContent:'space-between'}}
                        onClick={()=>{
                            router.push('/admin/truePeople')
                        }}
                    >
                        <div>
                            实名认证
                        </div>
                        <div>
                           >
                        </div>
                    </li>
                    {/* <hr style={{ width:'340px' }} /> */}
                    <li style={{padding:'10px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                        <div>
                            设置登陆密码
                        </div>
                        <div>
                           >
                        </div>
                    </li>
                    {/* <hr style={{ width:'340px' }} /> */}
                    <li style={{padding:'10px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                        <div>
                            设置支付密码
                        </div>
                        <div>
                           >
                        </div>
                    </li>
                    {/* <hr style={{ width:'340px' }} /> */}
                </ul>
            </div>
        </div>
    )
}
