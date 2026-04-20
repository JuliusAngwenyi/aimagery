/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            // Allow embedding as an iframe from Sitecore Cloud Portal domains.
            // frame-ancestors supersedes X-Frame-Options in modern browsers;
            // both are set for maximum compatibility.
            key: "Content-Security-Policy",
            value: [
              "frame-ancestors 'self'",
              "https://*.sitecorecloud.io",
              "https://*.sitecore.com",
              "https://*.sitecore.net",
            ].join(" "),
          },
          {
            // Fallback for older browsers that do not support CSP frame-ancestors.
            key: "X-Frame-Options",
            value: "ALLOW-FROM https://sitecorecloud.io",
          },
        ],
      },
    ];
  },
};

export default nextConfig
