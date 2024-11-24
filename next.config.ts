export default {
  experimental: {
    ppr: true,
    dynamicIO: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'a.espncdn.com',
        port: '',
        pathname: '/i/teamlogos/**',
        search: '',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },
};
