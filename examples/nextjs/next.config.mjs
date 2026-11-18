export default {
  async headers() {
    return ['/', '/docs/:slug'].map((source) => ({
      source,
      headers: [
        { key: 'Vary', value: 'Accept' },
        { key: 'Cache-Control', value: 'no-store' },
      ],
    }));
  },
  async redirects() {
    return [{ source: '/guide', destination: '/docs/getting-started', permanent: true }];
  },
};
