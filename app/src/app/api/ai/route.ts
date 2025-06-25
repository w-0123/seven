import { NextRequest } from "next/server";

export async function GET() {
    const stream = new ReadableStream({
        async start(controller) {
            const encoder = new TextEncoder();
            let isControllerClosed = false;
            
            const sendData = (data: any) => {
                if (!isControllerClosed) {
                    try {
                        controller.enqueue(
                            encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
                        );
                    } catch (error) {
                        console.error("发送数据时出错:", error);
                        isControllerClosed = true;
                        clearInterval(interval);
                    }
                }
            };
            
            console.log("SSE连接已建立" );

            const interval = setInterval(() => {
                sendData({ text: `保持连接 ${new Date().toLocaleTimeString()}` });
            }, 30000);

            setTimeout(() => {
                isControllerClosed = true;
                clearInterval(interval);
                controller.close();
            }, 2 * 60 * 60 * 1000); 
        }
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        },
    });
}

export async function POST(request: NextRequest) {
    try {
        let message = '';
        let hasImage = false;
        let imageBase64 = '';
        
        // 检查Content-Type判断是FormData还是JSON
        const contentType = request.headers.get('content-type') || '';
        
        if (contentType.includes('multipart/form-data')) {
            // 处理FormData格式（图片上传）
            const formData = await request.formData();
            const imageFile = formData.get('image') as File;
            
            // 获取可能的文本消息
            const textMessage = formData.get('message');
            if (textMessage && typeof textMessage === 'string') {
                message = textMessage;
            }
            
            if (imageFile) {
                hasImage = true;
                // 将图片转换为base64
                const bytes = await imageFile.arrayBuffer();
                const buffer = Buffer.from(bytes);
                imageBase64 = `data:${imageFile.type};base64,${buffer.toString('base64')}`;
                
                // 如果没有文本消息，使用默认消息
                if (!message) {
                    message = `[图片内容分析]`;
                }
            }
        } else {
            // 处理JSON格式（文本消息）
            const json = await request.json();
            message = json.message;
        }
        
        // 确保有消息内容
        if (!message && !hasImage) {
            return new Response(
                JSON.stringify({ error: '没有接收到消息内容' }),
                {
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
        }
        
        const stream = new ReadableStream({
            async start(controller) {
                const encoder = new TextEncoder();
                let isControllerClosed = false;
                
                const sendData = (text: string) => {
                    if (!isControllerClosed) {
                        try {
                            const data = JSON.stringify({ text });
                            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
                        } catch (error) {
                            console.error('发送数据时出错:', error);
                            isControllerClosed = true;
                        }
                    }
                };

                try {
                    // 准备请求体
                    const requestBody: any = {
                        "inputs": {},
                        "query": message,
                        "response_mode": "streaming",
                        "conversation_id": "",
                        "user": "user",
                    };
                  
                    // 如果有图片，添加到请求体
                    if (hasImage && imageBase64) {
                        requestBody.image = imageBase64;
                    }
                    console.log(requestBody);
                    console.log(`发送请求到AI服务，包含图片: ${hasImage}`);
                    
                    const response = await fetch('http://localhost/v1/chat-messages', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': 'Bearer app-0d46WG9Cg6Vf79LSQ2AXvUpT'
                        },
                        body: JSON.stringify(requestBody)
                    });
                    console.log('API响应状态:', response.status);
                    
                    if (!response.ok) {
                        const errorText = await response.text();
                        console.error(`API错误(${response.status}):`, errorText);
                        sendData(`服务器返回错误: ${response.status}. 请确认本地AI服务已启动。`);
                        return;
                    }

                    if (response.headers.get('content-type')?.includes('text/event-stream')) {
                        const reader = response.body?.getReader();
                        
                        const decoder = new TextDecoder('utf-8');
                        if (!reader) throw new Error('No reader available');
                        
                        try {
                            while (true) {
                                const { done, value } = await reader.read();
                                if (done) break; 
                        
                                const chunk = decoder.decode(value);
                                const lines = chunk.split('\n').filter(line => line.startsWith('data: '));
                          
                                for (const line of lines) {
                                    try {
                                        const jsonStr = line.replace('data: ', '');
                                        const data = JSON.parse(jsonStr); 
                                        if (data.answer) {
                                            sendData(data.answer);
                                            console.log('收到AI响应:', data.answer);
                                        }
                                    } catch (parseError) {
                                        console.error('解析流数据失败:', parseError, line);
                                    }
                                }
                            }
                        } catch (streamError) {
                            console.error('处理流数据时出错:', streamError);
                            sendData('读取AI回复时出错，请重试');
                        }
                    } else {
                        const responseText = await response.text();
                        try {
                            const responseData = JSON.parse(responseText);
                            sendData(responseData.answer || responseData.message || '收到无效响应格式');
                        } catch (e) {
                            sendData('AI服务返回了无法解析的响应');
                            console.error('无法解析响应:', responseText);
                        }
                    }
                } catch (error) {
                    console.error('API调用过程中出错:', error);
                    sendData('连接AI服务时出错，请检查服务是否正常运行');
                } finally {
                    setTimeout(() => {
                        if (!isControllerClosed) {
                            isControllerClosed = true;
                            try {
                                controller.close();
                            } catch (closeError) {
                                console.error('关闭控制器时出错:', closeError);
                            }
                        }
                    }, 1000);
                }
            }
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });

    } catch (error) {
        console.error('API调用错误:', error);
        return new Response(
            JSON.stringify({ error: '服务器内部错误' }),
            {
                status: 500,
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
    }
}

// 添加OPTIONS方法处理CORS预检请求
export async function OPTIONS() {
    return new Response(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}
