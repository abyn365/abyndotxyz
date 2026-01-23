const path = require("path");

module.exports = {
  sassOptions: {
    includePaths: [path.join(__dirname, "styles")],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.discordapp.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.scdn.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn3.emoji.gg',
        port: '',
        pathname: '/emojis/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.rcd.gg',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'media.discordapp.net',
        port: '',
        pathname: '/**',
      }
    ],
  },
  async redirects() {
    return [
      {
        source: '/profile',
        destination: 'https://profile.abyn.xyz',
        permanent: true,
      },
      {
        source: '/instagram',
        destination: 'https://instagram.com/abyb.1',
        permanent: true,
      },
      {
        source: '/github',
        destination: 'https://github.com/abyn365',
        permanent: true,
      },
      {
        source: '/spotify',
        destination: 'https://spotify.link/XuGGbL7o8Zb',
        permanent: true,
      },
      {
        source: '/pinterest',
        destination: 'https://id.pinterest.com/abynabb',
        permanent: true,
      },
      {
        source: '/discord',
        destination: 'http://discord.com/users/abynb',
        permanent: true,
      },
    ];
  },
  trailingSlash: false
};
