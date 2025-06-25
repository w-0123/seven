import http from '@/app/utils/http'

export const logindata = () => {
  return http.get('/auth')
}

export const Ai = (data:{message:string}) => {
  return http.post('/ai',data)
}

interface VerifyIdCardResponse {
  BizCode?: '1' | '2' | null; 
  Message?: string; 
}

export const verifyIdCard = (name: string, idNumber: string): Promise<any> => {
  return http.post('/trueRen', { name, idNumber });
}

export const tripdata = async () => {
  try {
    const response = await http.get('/trips')
    return response.data || []
  } catch (error) {
    console.error('Error fetching trips:', error)
    return []
  }
}