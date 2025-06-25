/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['tencentcloud-sdk-nodejs-iai']
  }
  // ...其他配置...
}

module.exports = nextConfig