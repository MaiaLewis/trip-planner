import "./globals.css";
import { Providers } from './providers'
import Script from 'next/script'

export const metadata = {
  title: 'Trip Planner',
  description: 'Plan your next trip with friends',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <Script 
          src="https://kit.fontawesome.com/71d4c3d338.js" 
          crossOrigin="anonymous"
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
