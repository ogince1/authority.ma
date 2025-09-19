// Google Tag Manager Data Layer
declare global {
  interface Window {
    dataLayer: Array<Record<string, any>>;
  }
}

// Initialize dataLayer if it doesn't exist
if (typeof window !== 'undefined') {
  window.dataLayer = window.dataLayer || [];
}

// Helper functions for tracking events
export const trackEvent = (eventName: string, eventParams: Record<string, any> = {}) => {
  if (typeof window !== 'undefined') {
    // Ajouter des informations communes à tous les événements
    const commonData = {
      timestamp: new Date().toISOString(),
      page_url: window.location.href,
      page_path: window.location.pathname,
      referrer: document.referrer || 'direct',
      user_agent: navigator.userAgent,
      screen_size: `${window.innerWidth}x${window.innerHeight}`,
      language: navigator.language
    };
    
    window.dataLayer.push({
      event: eventName,
      ...commonData,
      ...eventParams
    });
    
    console.log(`[GTM Event] ${eventName}`, { ...commonData, ...eventParams });
  }
};

// Common events
export const trackPageView = (pagePath: string, pageTitle: string) => {
  trackEvent('page_view', {
    page_path: pagePath,
    page_title: pageTitle,
    page_type: getPageType(pagePath)
  });
};

// Déterminer le type de page
const getPageType = (path: string): string => {
  if (path === '/' || path === '') return 'home';
  if (path.startsWith('/lien/')) return 'link_detail';
  if (path.startsWith('/site/')) return 'website_detail';
  if (path.startsWith('/liens')) return 'links_category';
      if (path.startsWith('/sites-web')) return 'links';
  if (path.startsWith('/vendre-liens')) return 'sell_links';
  if (path.startsWith('/blog')) return 'blog';
  if (path.startsWith('/success-stories')) return 'success_story';
  if (path.startsWith('/dashboard')) return 'user_dashboard';
  if (path.startsWith('/admin')) return 'admin';
  return 'other';
};

export const trackLinkView = (linkId: string, linkTitle: string, linkType: string, linkPrice: number) => {
  trackEvent('link_view', {
    link_id: linkId,
    link_title: linkTitle,
    link_type: linkType,
    link_price: linkPrice,
    currency: 'MAD',
    item_type: 'link'
  });
};

export const trackWebsiteView = (websiteId: string, websiteTitle: string, websiteCategory: string) => {
  trackEvent('website_view', {
    website_id: websiteId,
    website_title: websiteTitle,
    website_category: websiteCategory,
    item_type: 'website'
  });
};

export const trackLinkPurchaseRequest = (linkId: string, proposedPrice: number) => {
  trackEvent('link_purchase_request', {
    link_id: linkId,
    proposed_price: proposedPrice,
    currency: 'MAD',
    event_category: 'engagement',
    event_label: 'purchase_request'
  });
};

export const trackLinkListing = (linkId: string, linkType: string, price: number) => {
  trackEvent('link_listing', {
    link_id: linkId,
    link_type: linkType,
    price: price,
    currency: 'MAD',
    event_category: 'conversion',
    event_label: 'link_listing'
  });
};

export const trackUserSignup = () => {
  trackEvent('user_signup', {
    event_category: 'user',
    event_label: 'signup',
    method: 'email'
  });
};

export const trackUserLogin = () => {
  trackEvent('user_login', {
    event_category: 'user',
    event_label: 'login',
    method: 'email'
  });
};

// Nouveaux événements de suivi
export const trackSearch = (searchTerm: string, resultsCount: number, category?: string) => {
  trackEvent('search', {
    search_term: searchTerm,
    results_count: resultsCount,
    category: category || 'all',
    event_category: 'engagement',
    event_label: 'search'
  });
};

export const trackFilter = (filterType: string, filterValue: string, resultsCount: number) => {
  trackEvent('filter_use', {
    filter_type: filterType,
    filter_value: filterValue,
    results_count: resultsCount,
    event_category: 'engagement',
    event_label: 'filter'
  });
};

export const trackWebsiteSubmission = (category: string, domainAuthority: number) => {
  trackEvent('website_submission', {
    category: category,
    domain_authority: domainAuthority,
    event_category: 'conversion',
    event_label: 'website_submission'
  });
};

export const trackLinkListingSubmission = (linkType: string, position: string, price: number) => {
  trackEvent('link_listing_submission', {
    link_type: linkType,
    position: position,
    price: price,
    currency: 'MAD',
    event_category: 'conversion',
    event_label: 'link_listing_submission'
  });
};

export const trackOutboundLink = (url: string, linkType: string, linkText: string) => {
  trackEvent('outbound_link_click', {
    outbound_url: url,
    link_type: linkType,
    link_text: linkText,
    event_category: 'engagement',
    event_label: 'outbound_link'
  });
};

export const trackDownload = (fileUrl: string, fileType: string, fileName: string) => {
  trackEvent('file_download', {
    file_url: fileUrl,
    file_type: fileType,
    file_name: fileName,
    event_category: 'engagement',
    event_label: 'download'
  });
};

// Événements e-commerce
export const trackAddToCart = (linkId: string, linkTitle: string, price: number) => {
  trackEvent('add_to_cart', {
    items: [{
      item_id: linkId,
      item_name: linkTitle,
      price: price,
      currency: 'MAD',
      item_category: 'link'
    }],
    event_category: 'ecommerce',
    event_label: 'add_to_cart'
  });
};

export const trackPurchase = (transactionId: string, linkId: string, linkTitle: string, price: number) => {
  trackEvent('purchase', {
    transaction_id: transactionId,
    value: price,
    currency: 'MAD',
    items: [{
      item_id: linkId,
      item_name: linkTitle,
      price: price,
      currency: 'MAD',
      item_category: 'link'
    }],
    event_category: 'ecommerce',
    event_label: 'purchase'
  });
};