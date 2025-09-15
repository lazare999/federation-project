import Footer from '@/components/footer/footer';
import Header from '@/components/header/header';
import { GoogleAnalytics } from '@next/third-parties/google';
import './globals.css';
import Providers from './providers';

export const metadata = {
  title: 'georgianequestrianfederation',
  description: 'georgian equestiran federation official website',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Light mode favicon */}
        <link
          rel="icon"
          href="/light-theme-icon.png"
          media="(prefers-color-scheme: light)"
        />
        {/* Dark mode favicon */}
        <link
          rel="icon"
          href="/dark-theme-icon.png"
          media="(prefers-color-scheme: dark)"
        />
        <link rel="apple-touch-icon" href="/light-theme-icon.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <Providers>
          <div className="pageWrapper">
            <Header />
            <main className="contentWrapper">{children}</main>
            <Footer />
          </div>
        </Providers>
        <GoogleAnalytics gaId="G-FQNGSWF2R9" />
      </body>
    </html>
  );
}
