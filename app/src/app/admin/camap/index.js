const express = require('express');
const router = express.Router();

const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");
const { ShopModel, OnlineUserModel, MessageModel } = require('../model/model');
const axios = require('axios');
const fs = require('fs');
const tmp = require('tmp');
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath('D:/FFmpeg/ffmpeg-7.1.1-essentials_build/bin/ffmpeg.exe');

// 百度云语音识别配置
const API_KEY = 'jc9ucMI8P3IXqmlXeUoQVDIV';
const SECRET_KEY = 'g0Zar99rJFkfioZmaEscfcg9WeDSyeWE';

// 获取百度云 access_token
async function getAccessToken() {
  const response = await axios.post(
    'https://aip.baidubce.com/oauth/2.0/token',
    null,
    {
      params: {
        grant_type: 'client_credentials',
        client_id: API_KEY,
        client_secret: SECRET_KEY,
      },
    }
  );
  return response.data.access_token;
}

// 检查PCM文件是否为16kHz单声道
function probePCM(pcmPath) {
  return new Promise((resolve, reject) => {
    ffmpeg(pcmPath)
      .inputFormat('s16le')
      .audioChannels(1)
      .audioFrequency(16000)
      .outputOptions('-f', 'null')
      .on('start', cmd => {
        console.log('[ffprobe] check cmd:', cmd);
      })
      .on('stderr', data => {
        // 可以打印stderr内容辅助调试
      })
      .on('error', (err) => {
        reject(err);
      })
      .on('end', () => {
        resolve(true);
      })
      .saveToFile('/dev/null'); // windows可以用 NUL
  });
}

// 语音转文字路由
router.post('/voice2text', async (req, res) => {
  let webmPath, pcmPath;
  try {
    const { audioData } = req.body;
    if (!audioData) {
      return res.status(400).json({ code: 400, msg: '缺少音频数据' });
    }
    const base64Data = audioData.replace(/^data:audio\/\w+;base64,/, '');
    const audioBuffer = Buffer.from(base64Data, 'base64');
    webmPath = tmp.tmpNameSync({ postfix: '.webm' });
    fs.writeFileSync(webmPath, audioBuffer);

    // ffmpeg 转码并打印所有日志
    pcmPath = tmp.tmpNameSync({ postfix: '.pcm' });
    await new Promise((resolve, reject) => {
      ffmpeg(webmPath)
        .audioCodec('pcm_s16le')
        .audioChannels(1)
        .audioFrequency(16000)
        .outputOptions('-f', 's16le')
        .on('start', (cmd) => { console.log('[ffmpeg] start cmd:', cmd); })
        .on('stderr', (data) => { console.log('[ffmpeg]', data); })
        .on('end', resolve)
        .on('error', reject)
        .save(pcmPath);
    });

    // 检查PCM文件是否为16kHz单声道
    try {
      await probePCM(pcmPath);
      console.log('PCM格式检查通过：16kHz 单声道');
    } catch (err) {
      console.error('PCM格式检查失败，文件不是16kHz单声道:', err);
      return res.status(500).json({ code: 500, msg: 'PCM音频格式错误，必须为16kHz单声道' });
    }

    const pcmData = fs.readFileSync(pcmPath);
    const speech = pcmData.toString('base64');
    const token = await getAccessToken();

    const baiduReq = {
      format: 'pcm',
      rate: 16000,
      channel: 1,
      token,
      cuid: 'TiAmoApp',
      len: pcmData.length,
      speech
    };
    console.log('百度语音识别请求体:', {
      ...baiduReq,
      speech: '[base64 omitted]',
    });

    const result = await axios.post(
      `https://vop.baidu.com/server_api?dev_pid=1537&cuid=TiAmoApp&token=${token}`,
      baiduReq,
      { headers: { 'Content-Type': 'application/json' } }
    );

    console.log('百度API返回：', result.data);

    if (result.data.err_no === 0) {
      res.json({ code: 200, data: result.data.result[0] });
    } else {
      res.json({ code: 500, msg: result.data.err_msg, err_no: result.data.err_no, raw: result.data });
    }
  } catch (error) {
    console.error('语音转文字失败:', error);
    res.status(500).json({
      code: 500,
      msg: '语音转文字失败',
      error: error.message,
    });
  } finally {
    if (webmPath && fs.existsSync(webmPath)) fs.unlinkSync(webmPath);
    if (pcmPath && fs.existsSync(pcmPath)) fs.unlinkSync(pcmPath);
  }
});

// 登录
router.post("/login", async (req, res) => {
    let {username, password} = req.body;
    try {
        let user = await ShopModel.findOne({username, password});
        if (user) {
            await OnlineUserModel.findOneAndUpdate(
                { username: user.username },
                {
                    username: user.username,
                    isOnline: false,
                    lastActive: new Date()
                },
                { upsert: true }
            );
            res.json({
                code: 200,
                msg: "登录成功",
                data: { username: user.username }
            });
        } else {
            res.json({ code: 401, msg: "用户名或密码错误" });
        }
    } catch(error) {
        console.error('Login error:', error);
        res.status(500).json({ code: 500, msg: "服务器错误" });
    }
});

// 获取用户列表
router.get("/list", async (req, res) => {
    try {
        const userList = await OnlineUserModel.find({}, {
            username: 1,
            isOnline: 1,
            lastActive: 1,
            _id: 0
        });
        res.json({ code: 200, msg: "获取用户列表成功", data: userList });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ code: 500, msg: "获取用户列表失败" });
    }
});

// 获取与特定用户的聊天记录
router.get("/messages", async (req, res) => {
    const { username, targetUsername } = req.query;
    try {
        const messages = await MessageModel.find({
            $or: [
                { fromUsername: username, toUsername: targetUsername },
                { fromUsername: targetUsername, toUsername: username }
            ]
        }).sort({ timestamp: 1 });
        res.json({ code: 200, msg: "获取聊天记录成功", data: messages });
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ code: 500, msg: "获取聊天记录失败" });
    }
});

// Socket.io 配置
const io = new Server(3000, {
    cors: { origin: "http://localhost:5173" }
});

io.on('connection', async (socket) => {
    const username = socket.handshake.query.username;
    if (!username) {
        console.log('未提供用户名，拒绝连接');
        return;
    }
    try {
        await OnlineUserModel.findOneAndUpdate(
            { username },
            {
                socketId: socket.id,
                isOnline: true,
                lastActive: new Date()
            },
            { upsert: true }
        );

        // 广播最新用户列表
        const userList = await OnlineUserModel.find({}, {
            username: 1, isOnline: 1, socketId: 1, _id: 0
        });
        io.emit('online', { userList });

        // 处理发送消息
        socket.on("send", async ({ fromUsername, targetId, msg, toUsername, type, audioData, content }) => {
            try {
                const toUser = await OnlineUserModel.findOne({ username: toUsername });
                if (!toUser) {
                    socket.emit('error', { message: '用户不存在', type: 'USER_NOT_FOUND' });
                    return;
                }
                if (!content) {
                    socket.emit('error', {
                        message: '发送消息失败',
                        type: 'SEND_ERROR',
                        error: 'message validation failed: content: Path `content` is required.'
                    });
                    return;
                }
                // 保存消息到数据库
                const message = await MessageModel.create({
                    fromUsername,
                    toUsername,
                    content: content,
                    type: type || 'text',
                    audioData: audioData || (type === 'audio' ? content : undefined),
                    timestamp: new Date(),
                    isRead: false
                });

                const messageData = {
                    fromUsername,
                    toUsername: toUser.username,
                    msg: msg || '',
                    type: type || 'text',
                    audioData: audioData || (type === 'audio' ? content : undefined),
                    content: content,
                    dataTime: message.timestamp.getTime(),
                    messageId: message._id
                };

                socket.emit('receive', messageData);

                if (toUser.isOnline && toUser.socketId) {
                    const targetSocket = io.sockets.sockets.get(toUser.socketId);
                    if (targetSocket) {
                        targetSocket.emit('receive', messageData);
                        await MessageModel.findByIdAndUpdate(message._id, { isRead: true });
                    }
                } else {
                    socket.emit('info', {
                        message: '消息已保存，用户当前离线',
                        type: 'MESSAGE_SAVED'
                    });
                }
            } catch (error) {
                console.error('发送消息时出错:', error);
                socket.emit('error', {
                    message: '发送消息失败',
                    type: 'SEND_ERROR',
                    error: error.message
                });
            }
        });

        // 断开连接
        socket.on('disconnect', async () => {
            try {
                await OnlineUserModel.findOneAndUpdate(
                    { username },
                    { isOnline: false, lastActive: new Date() }
                );
                const updatedUserList = await OnlineUserModel.find({}, {
                    username: 1, isOnline: 1, socketId: 1, _id: 0
                });
                io.emit('online', { userList: updatedUserList });
                console.log(`用户 ${username} 断开连接`);
            } catch (error) {
                console.error('Error handling disconnect:', error);
            }
        });
    } catch (error) {
        console.error('Error handling connection:', error);
        socket.disconnect();
    }
});

module.exports = router;