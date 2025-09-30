import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOHeadProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
}

const SEOHead: React.FC<SEOHeadProps> = ({
  title = 'Back.ma – La plateforme marocaine pour acheter des liens de qualité 🚀',
  description = 'Bienvenue sur Back.ma, la première plateforme marocaine spécialisée dans l\'achat de liens sponsorisés. Aidez les entreprises, agences SEO et e-commerçants à renforcer leur visibilité sur Google.',
  image = '/logo-social.png',
  url = 'https://back.ma',
  type = 'website'
}) => {
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      
      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />
      <meta property="og:site_name" content="Back.ma" />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      
      {/* Additional SEO */}
      <meta name="robots" content="index, follow" />
      <meta name="language" content="French" />
      <meta name="author" content="Back.ma" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      
      {/* Canonical URL */}
      <link rel="canonical" href={url} />
      
      {/* Favicon */}
      <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      
      {/* JSON-LD Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "Back.ma",
          "description": "La première plateforme marocaine spécialisée dans l'achat de liens de qualité",
          "url": "https://back.ma",
          "logo": "https://back.ma/logo.png",
          "sameAs": [
            "https://www.facebook.com/back.ma",
            "https://www.twitter.com/back_ma",
            "https://www.linkedin.com/company/back-ma"
          ],
          "contactPoint": {
            "@type": "ContactPoint",
            "telephone": "+212-XXX-XXXXXX",
            "contactType": "customer service",
            "areaServed": "MA",
            "availableLanguage": "French"
          },
          "address": {
            "@type": "PostalAddress",
            "addressCountry": "MA",
            "addressLocality": "Casablanca"
          },
          "service": {
            "@type": "Service",
            "name": "Achat de Liens",
            "description": "Service d'achat de liens de qualité pour améliorer le référencement naturel",
            "provider": {
              "@type": "Organization",
              "name": "Back.ma"
            },
            "areaServed": {
              "@type": "Country",
              "name": "Morocco"
            }
          }
        })}
      </script>
    </Helmet>
  );
};

export default SEOHead;