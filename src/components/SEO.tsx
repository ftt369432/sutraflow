import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: string;
}

export const SEO: React.FC<SEOProps> = ({
  title = "GenieFlow AI | Autonomous Software For The AI Era",
  description = "GenieFlow AI is a Universal Agentic OS that orchestrates specialized AI assistants for legal, medical, and corporate high-productivity workflows.",
  keywords = ["AI Assistant", "Autonomous Agent", "Productivity", "Workflow Automation", "Legal AI", "GenieFlow"],
  image = "./images/og-image.png",
  url = "https://genieflowai.com",
  type = "website"
}) => {
  const siteName = "GenieFlow AI";
  const fullTitle = title.includes(siteName) ? title : `${title} | ${siteName}`;

  return (
    <Helmet>
      {/* Title */}
      <title>{fullTitle}</title>
      <link rel="canonical" href={url} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords.join(', ')} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content={siteName} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={url} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* Structured Data (JSON-LD) */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          "name": siteName,
          "operatingSystem": "Web",
          "applicationCategory": "ProductivityApplication",
          "description": description,
          "offers": {
            "@type": "Offer",
            "price": "0.00",
            "priceCurrency": "USD"
          },
          "applicationSubCategory": "Autonomous AI Orchestration",
          "featureList": keywords.join(', '),
          "softwareVersion": "2.0.0-architect",
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.9",
            "reviewCount": "1250"
          }
        })}
      </script>
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Service",
          "name": "GenieFlow Agentic AI Orchestration",
          "provider": {
            "@type": "Organization",
            "name": siteName,
            "url": url
          },
          "areaServed": "Global",
          "hasOfferCatalog": {
            "@type": "OfferCatalog",
            "name": "AI Agent Suite",
            "itemListElement": [
              {
                "@type": "Offer",
                "itemOffered": {
                  "@type": "Service",
                  "name": "Elite Law (Legal Orchestrator)"
                }
              },
              {
                "@type": "Offer",
                "itemOffered": {
                  "@type": "Service",
                  "name": "Wolf of Wall Street (Trading Intelligence)"
                }
              }
            ]
          }
        })}
      </script>
    </Helmet>
  );
};
