"use client"

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { tripdata } from '@/api';

interface Trip {
  id: number;
  destination: string;
  address: string;
  pickup: string;
  createdAt: string;
}

export default function TripDetail() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTripDetail = async () => {
      try {
        const tripId = searchParams.get('id');
        if (!tripId) {
          throw new Error('未找到行程ID');
        }

        // 检查是否是本地新添加的行程（使用时间戳作为ID）
        const isLocalTrip = tripId.length > 10; // 时间戳通常大于10位
        if (isLocalTrip) {
          // 从 localStorage 获取本地行程数据
          const localTrips = JSON.parse(localStorage.getItem('localTrips') || '[]');
          const foundTrip = localTrips.find((t: Trip) => t.id === Number(tripId));
          
          if (foundTrip) {
            setTrip(foundTrip);
            setLoading(false);
            return;
          }
        }

        // 如果不是本地行程，则从API获取
        const trips = await tripdata();
        const foundTrip = trips.find((t: Trip) => t.id === Number(tripId));
        
        if (foundTrip) {
          setTrip(foundTrip);
        } else {
          throw new Error('未找到行程信息');
        }
      } catch (error) {
        console.error('Error fetching trip details:', error);
        setError('加载行程详情失败，请稍后重试');
      } finally {
        setLoading(false);
      }
    };

    fetchTripDetail();
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center text-red-500">{error}</div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">未找到行程信息</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-md mx-auto bg-white shadow-lg">
        {/* 顶部标题 */}
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-center">行程详情</h1>
        </div>

        {/* 行程信息 */}
        <div className="p-4 space-y-4">
          <div>
            <div className="text-sm text-gray-500">目的地</div>
            <div className="font-medium">{trip.destination}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">地址</div>
            <div className="font-medium">{trip.address}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">上车地点</div>
            <div className="font-medium">{trip.pickup}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">创建时间</div>
            <div className="font-medium">
              {new Date(trip.createdAt).toLocaleString('zh-CN')}
            </div>
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="p-4 border-t border-gray-200 flex justify-between">
          <button 
            className="px-4 py-2 text-gray-500 hover:text-gray-700"
            onClick={() => router.back()}
          >
            返回
          </button>
          <button 
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            onClick={() => {
              // 这里可以添加确认行程的逻辑
              alert('行程已确认');
            }}
          >
            确认行程
          </button>
        </div>
      </div>
    </div>
  );
} 