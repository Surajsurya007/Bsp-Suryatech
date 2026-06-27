import React, { useEffect } from 'react';
import logoAsset from '../assets/images/bsp_suryatech_logo_1781884205612.jpg';

interface SEOSchemaProps {
  currentPage: string;
  productId?: string | null;
  products: any[];
  solutions: any[];
}

/**
 * SEOSchema Component
 * Dynamically injects Google-compliant Schema.org structured data (JSON-LD) into the document head.
 * Incorporates:
 * - Single Organization Schema (Globally, no duplicates)
 * - WebSite Schema (Globally, with SearchAction, potentialAction, publisher, etc.)
 * - WebPage Schema (For every route with canonical URLs and metadata)
 * - BreadcrumbList Schema (For every route)
 * - FAQPage Schema (Only on Home page, using the real 5 FAQs)
 * - SoftwareApplication Schema (Only on Software details page, if valid, handles price availability/offers safely)
 *
 * All resources and URLs are resolved strictly synchronously for performance and SEO guidelines compliance.
 */
export default function SEOSchema({
  currentPage,
  productId,
  products,
  solutions,
}: SEOSchemaProps) {
  // Resolve the static logo asset URL synchronously to ensure zero runtime network/fetch overhead
  const getLogoUrl = (): string => {
    if (!logoAsset) return 'https://bspsuryatech.in/logo.png';
    if (logoAsset.startsWith('http') || logoAsset.startsWith('data:')) {
      return logoAsset;
    }
    const cleanPath = logoAsset.startsWith('/') ? logoAsset : `/${logoAsset}`;
    return `https://bspsuryatech.in${cleanPath}`;
  };

  const resolvedLogo = getLogoUrl();

  useEffect(() => {
    // 1. Determine canonical path, title, and description for current page
    let path = '';
    let pageName = 'Home';
    let description = 'BSP Suryatech develops Business Management Software including Retail Billing Software, POS Software, ERP Solutions, Transport Management Software, Hospital ERP, School ERP, Restaurant POS, Medical Store Software, and Custom Software Development.';

    if (currentPage === 'features') {
      path = 'features';
      pageName = 'Features';
      description = 'Explore the advanced features of BSP Suryatech billing systems, including barcode scanning, thermal printing, multi-firm configurations, and automatic database back-ups.';
    } else if (currentPage === 'pricing') {
      path = 'pricing';
      pageName = 'Pricing';
      description = 'Explore our flexible pricing plans for premium POS, GST-compliant billing software, and custom ERP systems. Choose a package designed to grow your business.';
    } else if (currentPage === 'downloads') {
      path = 'downloads';
      pageName = 'Downloads';
      description = 'Download raw Windows installer setup packages, stable free trial editions, official training guides, and PDF manuals for BSP Suryatech software.';
    } else if (currentPage === 'tutorials') {
      path = 'tutorials';
      pageName = 'Tutorials';
      description = 'Watch our official step-by-step video tutorials, hardware driver setups, and user training guides for billing, POS, and ERP platforms.';
    } else if (currentPage === 'about') {
      path = 'about';
      pageName = 'About Us';
      description = 'Learn more about BSP Suryatech, our mission, corporate vision, and dedicated support teams building leading POS billing software in Raipur, India.';
    } else if (currentPage === 'contact') {
      path = 'contact';
      pageName = 'Contact Us';
      description = 'Get in touch with BSP Suryatech sales experts and installation engineers. Request a free live remote demo or custom software quote.';
    } else if (currentPage === 'portal') {
      path = 'portal';
      pageName = 'Customer Portal';
      description = 'Access your BSP Suryatech account, manage license keys, check purchase history, and contact customer support.';
    } else if (currentPage === 'payment-verification') {
      path = 'payment-verification';
      pageName = 'Payment Verification';
      description = 'Verify your license purchase order transactions and unlock customer licenses securely.';
    } else if (currentPage === 'software-details' && productId) {
      path = `software/${productId}`;
      
      // Attempt to resolve dynamic product info
      const foundProduct = products.find(p => p.id === productId || p.mappedPlanId === productId);
      const foundSolution = !foundProduct && solutions && solutions.find(s => s.id === productId || s.mappedPlanId === productId);
      
      if (foundProduct) {
        pageName = foundProduct.name;
        description = foundProduct.description || foundProduct.fullDescription;
      } else if (foundSolution) {
        pageName = foundSolution.title || foundSolution.name;
        description = foundSolution.description;
      } else {
        pageName = 'Software Details';
      }
    }

    const canonicalUrl = `https://bspsuryatech.in/${path}`;

    // 2. Build WebPage Node
    const webPageNode: any = {
      '@type': 'WebPage',
      '@id': `${canonicalUrl}#webpage`,
      'url': canonicalUrl,
      'name': `${pageName} - BSP Suryatech`,
      'description': description,
      'isPartOf': { '@id': 'https://bspsuryatech.in/#website' },
      'publisher': { '@id': 'https://bspsuryatech.in/#organization' },
      'primaryImageOfPage': {
        '@type': 'ImageObject',
        'url': resolvedLogo,
      }
    };

    // 3. Build BreadcrumbList Node
    const breadcrumbList: any[] = [
      {
        '@type': 'ListItem',
        'position': 1,
        'name': 'Home',
        'item': 'https://bspsuryatech.in/'
      }
    ];

    if (currentPage !== 'home') {
      if (currentPage === 'software-details') {
        breadcrumbList.push({
          '@type': 'ListItem',
          'position': 2,
          'name': 'Software',
          'item': 'https://bspsuryatech.in/downloads'
        });
        breadcrumbList.push({
          '@type': 'ListItem',
          'position': 3,
          'name': pageName,
          'item': canonicalUrl
        });
      } else {
        breadcrumbList.push({
          '@type': 'ListItem',
          'position': 2,
          'name': pageName,
          'item': canonicalUrl
        });
      }
    }

    const breadcrumbNode = {
      '@type': 'BreadcrumbList',
      '@id': `${canonicalUrl}#breadcrumb`,
      'itemListElement': breadcrumbList
    };

    // 4. Build graph container array
    const graph: any[] = [
      // A) Organization Node
      {
        '@type': 'Organization',
        '@id': 'https://bspsuryatech.in/#organization',
        'name': 'BSP Suryatech',
        'url': 'https://bspsuryatech.in',
        'logo': {
          '@type': 'ImageObject',
          '@id': 'https://bspsuryatech.in/#logo',
          'url': resolvedLogo,
          'caption': 'BSP Suryatech Logo'
        },
        'image': resolvedLogo,
        'email': 'support@bspsuryatech.in',
        'telephone': '+91-9516916415',
        'description': 'BSP Suryatech develops Business Management Software including Retail Billing Software, POS Software, ERP Solutions, Transport Management Software, Hospital ERP, School ERP, Restaurant POS, Medical Store Software, and Custom Software Development.',
        'sameAs': [
          'https://www.youtube.com/@bspsuryatech'
        ],
        'address': {
          '@type': 'PostalAddress',
          'streetAddress': 'SSD Tower, Sector 3, Shivanand Nagar, Raipur',
          'addressLocality': 'Raipur',
          'addressRegion': 'Chhattisgarh',
          'postalCode': '492008',
          'addressCountry': 'IN'
        },
        'contactPoint': {
          '@type': 'ContactPoint',
          'telephone': '+91-9516916415',
          'contactType': 'customer service',
          'email': 'support@bspsuryatech.in',
          'availableLanguage': ['en', 'hi']
        }
      },
      // B) WebSite Node
      {
        '@type': 'WebSite',
        '@id': 'https://bspsuryatech.in/#website',
        'name': 'BSP Suryatech',
        'url': 'https://bspsuryatech.in',
        'inLanguage': 'en',
        'publisher': { '@id': 'https://bspsuryatech.in/#organization' },
        'potentialAction': {
          '@type': 'SearchAction',
          'target': {
            '@type': 'EntryPoint',
            'urlTemplate': 'https://bspsuryatech.in/search?q={search_term_string}'
          },
          'query-input': 'required name=search_term_string'
        }
      },
      // C) WebPage Node
      webPageNode,
      // D) Breadcrumb Node
      breadcrumbNode
    ];

    // 5. Add SoftwareApplication Node (Only on software detail pages)
    if (currentPage === 'software-details' && productId) {
      const foundProduct = products.find(p => p.id === productId || p.mappedPlanId === productId);
      const foundSolution = !foundProduct && solutions && solutions.find(s => s.id === productId || s.mappedPlanId === productId);
      
      const product = foundProduct 
        ? foundProduct 
        : foundSolution 
          ? {
              id: foundSolution.id,
              name: foundSolution.title || foundSolution.name,
              category: foundSolution.category,
              description: foundSolution.description,
              price: foundSolution.price,
              gallery: foundSolution.gallery
            }
          : null;

      if (product) {
        // Setup image URL safely
        let imageUrl = resolvedLogo;
        if (product.logoUrl) {
          imageUrl = product.logoUrl;
        } else if (product.thumbnailUrl) {
          imageUrl = product.thumbnailUrl;
        } else if (product.bannerUrl) {
          imageUrl = product.bannerUrl;
        } else if (product.gallery && product.gallery.length > 0) {
          imageUrl = product.gallery[0];
        }

        // Parse price safely
        const rawPrice = product.price;
        let numericPrice = 0;
        if (typeof rawPrice === 'number') {
          numericPrice = rawPrice;
        } else if (typeof rawPrice === 'string') {
          const cleaned = rawPrice.replace(/[^\d.]/g, '');
          numericPrice = parseFloat(cleaned) || 0;
        }

        const softwareNode: any = {
          '@type': 'SoftwareApplication',
          '@id': `${canonicalUrl}#software`,
          'name': product.name || 'Business Management Software',
          'description': product.description || 'Professional business management software solution.',
          'applicationCategory': 'BusinessApplication',
          'operatingSystem': 'Windows',
          'screenshot': imageUrl,
          'image': imageUrl,
          'publisher': { '@id': 'https://bspsuryatech.in/#organization' },
          'brand': { '@id': 'https://bspsuryatech.in/#organization' },
          'url': canonicalUrl,
          'softwareHelpPage': 'https://bspsuryatech.in/tutorials'
        };

        // Inject version if available
        if (product.version) {
          softwareNode.softwareVersion = product.version;
        }

        // Add offers ONLY if valid numeric price exists and is non-zero
        if (numericPrice > 0) {
          softwareNode.offers = {
            '@type': 'Offer',
            'price': numericPrice,
            'priceCurrency': 'INR',
            'availability': 'https://schema.org/InStock'
          };
        }

        graph.push(softwareNode);
      }
    }

    // 6. Add FAQPage Node (Only on Home page)
    if (currentPage === 'home') {
      const faqNode = {
        '@type': 'FAQPage',
        '@id': 'https://bspsuryatech.in/#faq',
        'isPartOf': { '@id': 'https://bspsuryatech.in/#webpage' },
        'mainEntity': [
          {
            '@type': 'Question',
            'name': 'Does BSP Suryatech software require active internet to function?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'No, BSP Suryatech is a desktop Windows application that operates 100% offline. All store details, stock ledgers, and transactions are securely saved locally on your physical computer. Internet connection is only required for the initial license activation and optional cloud back-ups.'
            }
          },
          {
            '@type': 'Question',
            'name': 'Is this software fully compliant with the Indian GST return standards?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Yes, absolutely. The software fully complies with the latest GST rules. It automatically splits CGST, SGST, and IGST according to inter-state/intra-state laws, registers HSN codes, and exports standard offline JSON schemas that can be directly uploaded to the gst.gov.in portal.'
            }
          },
          {
            '@type': 'Question',
            'name': 'What is a "Lifetime License" and are there any yearly renew charges?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'A Lifetime License (available for only ₹3000 on our retail billing plan) means you make a one-time purchase. You receive a persistent serial registration key with no annual activation fees, no subscription requirements, and free offline update downloads forever.'
            }
          },
          {
            '@type': 'Question',
            'name': 'What local printers are supported by the billing platform?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'We support all standard thermal POS receipt printers (58mm and 80mm) via standard Windows print spoolers (such as Epson, TVS, SEWOO, RONGTA). It also supports normal Laser/Inkjet printers for traditional full-page A4 and A5 bill print designs.'
            }
          },
          {
            '@type': 'Question',
            'name': 'How do I activate the customer serial key after purchasing the software?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Once you make a successful UPI or card payment online through our payment gateway, your serial code key is instantly visible in your Customer Portal. Simply download the EXE installer, open the registration wizard modal in the software, input your email and license key, and the program will unlock instantly.'
            }
          }
        ]
      };

      graph.push(faqNode);
    }

    // 7. Dynamic JSON-LD script insertion/update
    const scriptId = 'seo-schema-jsonld-graph';
    let scriptTag = document.getElementById(scriptId) as HTMLScriptElement | null;

    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.id = scriptId;
      scriptTag.type = 'application/ld+json';
      document.head.appendChild(scriptTag);
    }

    const payload = {
      '@context': 'https://schema.org',
      '@graph': graph
    };

    scriptTag.textContent = JSON.stringify(payload, null, 2);

    // 8. Dynamic Meta Tags Injection (Open Graph and Twitter Cards)
    const pageTitle = `${pageName} - BSP Suryatech`;
    let metaImage = resolvedLogo;

    if (currentPage === 'software-details' && productId) {
      const foundProduct = products.find(p => p.id === productId || p.mappedPlanId === productId);
      const foundSolution = !foundProduct && solutions && solutions.find(s => s.id === productId || s.mappedPlanId === productId);
      
      const product = foundProduct 
        ? foundProduct 
        : foundSolution 
          ? {
              id: foundSolution.id,
              name: foundSolution.title || foundSolution.name,
              category: foundSolution.category,
              description: foundSolution.description,
              price: foundSolution.price,
              gallery: foundSolution.gallery,
              logoUrl: foundSolution.logo_url,
              thumbnailUrl: foundSolution.thumbnail_url
            }
          : null;

      if (product) {
        let rawImageUrl = '';
        if (product.logoUrl && product.logoUrl.startsWith('http')) {
          rawImageUrl = product.logoUrl;
        } else if (product.thumbnailUrl) {
          rawImageUrl = product.thumbnailUrl;
        } else if (product.bannerUrl) {
          rawImageUrl = product.bannerUrl;
        } else if (product.gallery && product.gallery.length > 0) {
          rawImageUrl = product.gallery[0];
        }

        if (rawImageUrl) {
          if (rawImageUrl.startsWith('http')) {
            metaImage = rawImageUrl;
          } else {
            const cleanImgPath = rawImageUrl.startsWith('/') ? rawImageUrl : `/${rawImageUrl}`;
            metaImage = `https://bspsuryatech.in${cleanImgPath}`;
          }
        }
      }
    }

    // Helper to update or create a meta tag safely and prevent duplicates
    const updateOrCreateMetaTag = (nameOrProperty: string, contentValue: string) => {
      let element = document.head.querySelector(`meta[property="${nameOrProperty}"], meta[name="${nameOrProperty}"]`);
      if (!element) {
        element = document.createElement('meta');
        if (nameOrProperty.startsWith('og:')) {
          element.setAttribute('property', nameOrProperty);
        } else {
          element.setAttribute('name', nameOrProperty);
        }
        document.head.appendChild(element);
      }
      element.setAttribute('content', contentValue);
    };

    // Inject Open Graph (OG) tags
    updateOrCreateMetaTag('og:title', pageTitle);
    updateOrCreateMetaTag('og:description', description);
    updateOrCreateMetaTag('og:image', metaImage);
    updateOrCreateMetaTag('og:url', canonicalUrl);
    updateOrCreateMetaTag('og:type', currentPage === 'software-details' ? 'product' : 'website');
    updateOrCreateMetaTag('og:site_name', 'BSP Suryatech');
    updateOrCreateMetaTag('og:locale', 'en_IN');

    // Inject Twitter Card tags
    updateOrCreateMetaTag('twitter:card', 'summary_large_image');
    updateOrCreateMetaTag('twitter:title', pageTitle);
    updateOrCreateMetaTag('twitter:description', description);
    updateOrCreateMetaTag('twitter:image', metaImage);
    updateOrCreateMetaTag('twitter:url', canonicalUrl);

    // Cleanup on unmount
    return () => {
      // Do not clean up on unmount because of rapid SPA state toggles,
      // but on actual script tag update it gets clean payload automatically.
    };
  }, [currentPage, productId, products, solutions, resolvedLogo]);

  return null;
}
