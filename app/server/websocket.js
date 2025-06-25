const WebSocket = require('ws');
const http = require('http');

const server = http.createServer();
const wss = new WebSocket.Server({ server });

// 存储所有连接的客户端
const clients = new Map();
// 存储消息历史，用于撤回功能
const messageHistory = new Map();

wss.on('connection', (ws) => {
  console.log('新的客户端连接');

  // 为每个连接生成唯一ID
  const clientId = Date.now().toString();
  clients.set(clientId, ws);

  // 处理接收到的消息
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log('收到消息:', data);

      // 处理消息撤回
      if (data.type === 'recall') {
        console.log('处理消息撤回:', {
          messageId: data.messageId,
          tripId: data.tripId,
          sender: data.sender
        });
        
        // 广播撤回消息给所有客户端
        const recallData = {
          type: 'recall',
          messageId: data.messageId,
          tripId: data.tripId,
          sender: data.sender,
          timestamp: Date.now()
        };
        
        clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(recallData));
          }
        });
        return; // 撤回消息不需要继续处理
      }

      // 处理位置消息
      if (data.type === 'location') {
        console.log('收到位置更新:', {
          tripId: data.tripId,
          sender: data.sender,
          location: data.location
        });
      }

      // 存储消息历史（用于撤回功能）
      if (data.id) {
        messageHistory.set(data.id, {
          ...data,
          timestamp: Date.now()
        });
      }

      // WebRTC 信令转发
      if (['webrtc-offer', 'webrtc-answer', 'webrtc-candidate'].includes(data.type)) {
        clients.forEach((client, clientId) => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            // 可根据 tripId 精准转发，当前为所有其他客户端
            client.send(JSON.stringify(data));
          }
        });
        return;
      }

      // 广播消息给所有连接的客户端
      clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(data));
        }
      });

      // 清理过期消息（保留最近24小时的消息）
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
      for (const [id, message] of messageHistory.entries()) {
        if (message.timestamp < oneDayAgo) {
          messageHistory.delete(id);
        }
      }
    } catch (error) {
      console.error('消息处理错误:', error);
    }
  });

  // 处理连接关闭
  ws.on('close', () => {
    console.log('客户端断开连接');
    clients.delete(clientId);
  });

  // 处理错误
  ws.on('error', (error) => {
    console.error('WebSocket错误:', error);
    clients.delete(clientId);
  });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`WebSocket服务器运行在端口 ${PORT}`);
}); 