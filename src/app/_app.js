//src/app/_app.js
'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import '../../public/css/globals.css';
import '../../public/css/styles.css';

export default function MyApp({ Component, pageProps }) {
  const pathname = usePathname();

  useEffect(() => {
    const links = document.querySelectorAll('link[rel="stylesheet"]');
    links.forEach(link => {
      const href = link.getAttribute('href');
      if (href) {
        const newHref = href.split('?')[0] + '?v=' + Date.now();
        link.setAttribute('href', newHref);
      }
    });
  }, [pathname]);

  return <Component {...pageProps} />;
}