import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
// ১. সরাসরি CSS ইমপোর্ট করুন (Vite/React Router v7-এ এটি হেড-এ ব্লকিং সিএসএস হিসেবে থাকে)
import "@shopify/polaris/build/esm/styles.css";

// links ফাংশন খালি বা ইন্টার ফন্টের জন্য রাখতে পারেন
export const links = () => [
  {
    rel: "stylesheet",
    href: "https://cdn.shopify.com/static/fonts/inter/v4/styles.css",
  },
];

export default function App() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <link rel="preconnect" href="https://cdn.shopify.com/" />
        <Meta />
        <Links />
      </head>
      <body>
        <Outlet />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}