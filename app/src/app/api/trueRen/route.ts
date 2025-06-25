import { NextResponse } from 'next/server';
import fetch from 'node-fetch'; // 确保已安装 node-fetch: npm install node-fetch
import { URLSearchParams } from 'url';

/**
 * 发起 HTTPS 请求并处理响应
 * @param {string} name - 姓名参数
 * @param {string} idcard - 身份证号参数
 * @returns {Promise<any>} - 返回解析后的响应数据
 */
async function sendRequest(name: string, idcard: string): Promise<any> {
    try {
        // 构建请求的 URL
        const url = 'https://route.showapi.com/1072-1';

        // 构建请求参数，并对字段进行 urlencode 处理
        const params = new URLSearchParams();
        params.append('showapi_appid', '1870982'); // 替换为实际的 showapi_appid
        params.append('showapi_sign', '0c75cafb7a294ab0adf80235beca3817'); // 请替换为实际的 showapi_sign (App Secret)
        params.append('name', name+'1');
        params.append('idcard', idcard);

        // 发起 HTTPS 请求
        const response = await fetch(url, {
            method: 'POST', // 使用 POST 方法
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded' // 指定 content-type 类型
            },
            body: params.toString() // 将参数转换为字符串形式
        });

        // 检查响应状态码
        if (!response.ok) {
            throw new Error(`HTTP 错误！状态码: ${response.status}`);
        }

        // 解析响应数据为 JSON 格式
        const data = await response.json();
        return data;
    } catch (error: unknown) { // 明确错误类型为 unknown
        const err = error as Error; // 断言为 Error 类型以访问 message 属性
        console.error('请求过程中发生错误:', err.message);
        throw err; // 抛出错误以便调用者处理
    }
}

// Next.js API 路由的 POST 处理函数
export async function POST(request: Request) {
    try {
        const { name, idNumber } = await request.json(); // 从请求体获取姓名和身份证号
        const result = await sendRequest(name, idNumber);
        
        // 根据 ShowAPI 的响应结构进行判断
        if (result.showapi_res_code === 0 && result.showapi_res_body && result.showapi_res_body.code === 1) {
            // 验证一致
            return NextResponse.json({ BizCode: '1', Message: '身份验证成功！' });
        } else if (result.showapi_res_code === 0 && result.showapi_res_body && result.showapi_res_body.code === 0) {
            // 验证不一致
            return NextResponse.json({ BizCode: '2', Message: '姓名与身份证号不匹配，验证失败。' });
        } else {
            // 其他错误或未预期响应
            const errorMessage = result.showapi_res_error || '未知错误';
            return NextResponse.json({ BizCode: null, Message: `验证失败: ${errorMessage}` }, { status: 400 });
        }
    } catch (error: unknown) {
        const err = error as Error;
        console.error('处理 POST 请求时发生错误:', err.message);
        return NextResponse.json({ BizCode: null, Message: `后端服务内部错误: ${err.message}` }, { status: 500 });
    }
}