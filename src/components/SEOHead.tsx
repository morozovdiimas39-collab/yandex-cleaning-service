import { useEffect } from 'react';

interface SEOHeadProps {
  title: string;
  description: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  canonical?: string;
  jsonLd?: object;
}

export default function SEOHead({ 
  title, 
  description, 
  keywords,
  ogTitle,
  ogDescription,
  ogImage = 'https://cdn.poehali.dev/projects/e8511f31-5a6a-4fd5-9a7c-5620b5121f26/files/a24651d1-cc21-439d-8932-8703e4f1b0e2.jpg',
  ogType = 'website',
  canonical,
  jsonLd
}: SEOHeadProps) {
  useEffect(() => {
    document.title = title;
    
    const setOrCreateMeta = (selector: string, attributeName: string, attributeValue: string, content: string) => {
      let meta = document.querySelector(selector);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attributeName, attributeValue);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    setOrCreateMeta('meta[name="description"]', 'name', 'description', description);
    
    if (keywords) {
      setOrCreateMeta('meta[name="keywords"]', 'name', 'keywords', keywords);
    }

    setOrCreateMeta('meta[property="og:title"]', 'property', 'og:title', ogTitle || title);
    setOrCreateMeta('meta[property="og:description"]', 'property', 'og:description', ogDescription || description);
    setOrCreateMeta('meta[property="og:image"]', 'property', 'og:image', ogImage);
    setOrCreateMeta('meta[property="og:type"]', 'property', 'og:type', ogType);
    setOrCreateMeta('meta[property="og:url"]', 'property', 'og:url', canonical || window.location.href);
    setOrCreateMeta('meta[property="og:site_name"]', 'property', 'og:site_name', 'DirectKit');

    setOrCreateMeta('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image');
    setOrCreateMeta('meta[name="twitter:title"]', 'name', 'twitter:title', ogTitle || title);
    setOrCreateMeta('meta[name="twitter:description"]', 'name', 'twitter:description', ogDescription || description);
    setOrCreateMeta('meta[name="twitter:image"]', 'name', 'twitter:image', ogImage);

    setOrCreateMeta('meta[name="author"]', 'name', 'author', 'DirectKit');
    setOrCreateMeta('meta[name="robots"]', 'name', 'robots', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
    setOrCreateMeta('meta[name="googlebot"]', 'name', 'googlebot', 'index, follow');

    if (canonical) {
      let linkCanonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
      if (!linkCanonical) {
        linkCanonical = document.createElement('link');
        linkCanonical.setAttribute('rel', 'canonical');
        document.head.appendChild(linkCanonical);
      }
      linkCanonical.href = canonical;
    }

    if (jsonLd) {
      let scriptJsonLd = document.querySelector('script[type="application/ld+json"]');
      if (!scriptJsonLd) {
        scriptJsonLd = document.createElement('script');
        scriptJsonLd.setAttribute('type', 'application/ld+json');
        document.head.appendChild(scriptJsonLd);
      }
      scriptJsonLd.textContent = JSON.stringify(jsonLd);
    }
  }, [title, description, keywords, ogTitle, ogDescription, ogImage, ogType, canonical, jsonLd]);

  return null;
}
