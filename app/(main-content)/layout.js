import Footer from '@/components/footer/footer';
import Header from '@/components/header/header';
import { GoogleAnalytics } from '@next/third-parties/google';
import './globals.css';
import Providers from './providers';

export const metadata = {
  title: 'Horses in Georgia | Georgian Equestrian Federation',
  description:
    'Official Georgian equestrian website featuring horses, stables, tours, showjumping events, and equestrian activities across Georgia.',
  keywords: [
    'horse in georgia',
    'horses georgia',
    'georgian equestrian federation',
    'georgian equestrian',
    'equestrian georgia',
    'equestiran events georgia',
    'equestirn events',
    'stables in georgia',
    'horse tours georgia',
  ],
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

        {/* ⭐ Recommended Next.js way to improve CSS loading */}
        <link
          rel="stylesheet"
          href="/_next/static/css/app/layout.css"
          precedence="high"
        />
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
