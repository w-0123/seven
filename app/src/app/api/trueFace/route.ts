import { NextRequest, NextResponse } from 'next/server';
import * as tencentcloud from 'tencentcloud-sdk-nodejs-iai';

// 定义腾讯云人脸识别返回结果的接口
interface FaceSearchResult {
  Results: Array<{
    Candidates: Array<{
      FaceId: string;
      Gender: number;
      PersonId: string;
      PersonName: string;
    }>;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const base64 = body.base64;
    const needBlink = body.NeedBlinkDetection;
    const detectHeadPose = body.detectHeadPose;
    const needMouthOpen = body.NeedMouthOpenDetection;

    const IaiClient = tencentcloud.iai.v20200303.Client;
    const clientConfig = {
      credential: {
        //密钥和id值  https://console.cloud.tencent.com/cam/capi获取秘钥和id值
        secretId: process.env.FACE_ID,
        secretKey: process.env.FACE_KEY,
      },
      region: 'ap-beijing', //人脸识别库的地区  华北地区-北京
      profile: {
        httpProfile: {
          endpoint: 'iai.tencentcloudapi.com',
        },
      },
    };
    // 实例化要请求产品的client对象,clientProfile是可选的
    const client = new IaiClient(clientConfig);

    if (detectHeadPose) {
      // 检测头部姿态
      const params = {
        Image: base64,
        NeedFaceAttributes: 1,
      };

      const result = await client.DetectFace(params);
      
      if (!result?.FaceInfos?.[0]) {
        return NextResponse.json({
          code: -1,
          msg: "未检测到人脸或接口返回异常",
        });
      }

      const faceInfo = result.FaceInfos[0];
      const faceAttr = faceInfo.FaceAttributesInfo;
      const headPose = faceAttr && faceAttr.Pitch !== undefined ? {
        Pitch: faceAttr.Pitch,
        Yaw: faceAttr.Yaw,
        Roll: faceAttr.Roll
      } : null;

      if (!headPose) {
        return NextResponse.json({ 
          code: -1, 
          msg: '未检测到头部姿态' 
        });
      }

      // 判断头部姿态
      let headPoseStatus = '正面';
      if (headPose.Pitch > 20) {
        headPoseStatus = '仰头';
      } else if (headPose.Pitch < -20) {
        headPoseStatus = '低头';
      } else if (typeof headPose.Yaw === 'number' && headPose.Yaw > 20) {
        headPoseStatus = '左转';
      } else if (typeof headPose.Yaw === 'number' && headPose.Yaw < -20) {
        headPoseStatus = '右转';
      }

      return NextResponse.json({
        code: 0,
        headPose: headPoseStatus,
        msg: "检测成功",
      });
    } else if (needMouthOpen) {
      // 张嘴检测
      const params = {
        Image: base64,
        NeedFaceAttributes: 1
      };

      const result = await client.DetectFace(params);
      
      if (!result?.FaceInfos?.[0]) {
        return NextResponse.json({
          code: -1,
          msg: "未检测到人脸或接口返回异常"
        });
      }

      const faceInfo = result.FaceInfos[0];
      const faceAttr = faceInfo.FaceAttributesInfo;
      
      // 需要检查嘴部状态
      // 检查是否有表情相关属性
      if (!faceAttr || !faceAttr.Expression) {
        return NextResponse.json({
          code: -2,
          msg: "未检测到表情相关属性"
        });
      }
      
      // 获取表情的值，直接使用表情值来判断嘴部状态
      // Expression值范围是[0-100]，值越大表示表情越明显
      const expressionValue = faceAttr.Expression;
      
      // 判断是否张嘴，可以根据表情值来判断
      // 表情值大于60时，认为用户张嘴表情明显
      if (expressionValue > 15) {
        // 张嘴成功
        return NextResponse.json({
          code: 0,
          mouthOpen: true,
          expressionValue: expressionValue,
          msg: "张嘴检测成功"
        });
      } else {
        return NextResponse.json({
          code: 1,
          mouthOpen: false,
          expressionValue: expressionValue,
          msg: "请张大嘴巴"
        });
      }
    } else if (needBlink) {
      // 眨眼检测
      const params = {
        Image: base64,
        NeedFaceAttributes: 1
      };

      const result = await client.DetectFace(params);
      
      if (!result?.FaceInfos?.[0]) {
        return NextResponse.json({ 
          code: -1, 
          msg: "未检测到人脸或接口返回异常" 
        });
      }

      const faceInfo = result.FaceInfos[0];
      const faceAttr = faceInfo.FaceAttributesInfo;
      const eyeOpen = faceAttr && typeof faceAttr.EyeOpen !== 'undefined' ? faceAttr.EyeOpen : null;

      if (eyeOpen === false) {
        // 眨眼成功，进行人脸识别
        const searchParams = {
          GroupIds: ["1001"],
          Image: base64,
          NeedPersonInfo: 1,
          QualityControl: 0,
          FaceMatchThreshold: 85,
        };

        const searchResult = await client.SearchFaces(searchParams) as FaceSearchResult;

        if (!searchResult?.Results?.[0]?.Candidates?.length) {
          return NextResponse.json({
            code: 2,
            blink: true,
            msg: "眨眼成功，但该人员没有注册"
          });
        }

        const { FaceId, Gender, PersonId, PersonName } = searchResult.Results[0].Candidates[0];
        return NextResponse.json({
          code: 0,
          blink: true,
          data: { FaceId, Gender, PersonId, PersonName },
          msg: "眨眼并识别成功"
        });
      } else if (eyeOpen === true) {
        return NextResponse.json({ 
          code: 1, 
          blink: false, 
          msg: "请眨眼" 
        });
      } else {
        return NextResponse.json({ 
          code: -2, 
          msg: "未检测到眼睛状态" 
        });
      }
    } else {
      // 正常人脸识别流程
      const params = {
        GroupIds: ["1001"],
        Image: base64,
        NeedPersonInfo: 1,
        QualityControl: 0,
        FaceMatchThreshold: 85,
      };

      const searchResult = await client.SearchFaces(params) as FaceSearchResult;

      if (!searchResult?.Results?.[0]?.Candidates?.length) {
        return NextResponse.json({
          code: -1,
          msg: "该人员没有注册",
        });
      }

      const { FaceId, Gender, PersonId, PersonName } = searchResult.Results[0].Candidates[0];
      return NextResponse.json({
        code: 0,
        data: {
          FaceId,
          Gender,
          PersonId,
          PersonName,
        },
        msg: "识别成功",
      });
    }
  } catch (error) {
    console.error('人脸识别API错误:', error);
    return NextResponse.json({
      code: 500,
      msg: '服务器内部错误',
    });
  }
}
