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
  if (path.startsWith('/project/')) return 'project_detail';
  if (path.startsWith('/mvp') || path.startsWith('/startups') || path.startsWith('/websites')) return 'category';
  if (path.startsWith('/investir')) return 'fundraising';
  if (path.startsWith('/blog')) return 'blog';
  if (path.startsWith('/success-stories')) return 'success_story';
  if (path.startsWith('/dashboard')) return 'user_dashboard';
  if (path.startsWith('/admin')) return 'admin';
  return 'other';
};

export const trackProjectView = (projectId: string, projectTitle: string, projectCategory: string, projectPrice: number) => {
  trackEvent('project_view', {
    project_id: projectId,
    project_title: projectTitle,
    project_category: projectCategory,
    project_price: projectPrice,
    currency: 'MAD',
    item_type: 'project'
  });
};

export const trackProposalSubmit = (projectId: string, proposedPrice: number) => {
  trackEvent('proposal_submit', {
    project_id: projectId,
    proposed_price: proposedPrice,
    currency: 'MAD',
    event_category: 'engagement',
    event_label: 'proposal'
  });
};

export const trackInvestmentInterest = (fundraisingId: string, investmentAmount: number) => {
  trackEvent('investment_interest', {
    fundraising_id: fundraisingId,
    investment_amount: investmentAmount,
    currency: 'MAD',
    event_category: 'engagement',
    event_label: 'investment'
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

export const trackProjectSubmission = (category: string, price: number) => {
  trackEvent('project_submission', {
    category: category,
    price: price,
    currency: 'MAD',
    event_category: 'conversion',
    event_label: 'project_submission'
  });
};

export const trackFundraisingSubmission = (stage: string, targetAmount: number, equityOffered?: number) => {
  trackEvent('fundraising_submission', {
    investment_stage: stage,
    target_amount: targetAmount,
    equity_offered: equityOffered,
    currency: 'MAD',
    event_category: 'conversion',
    event_label: 'fundraising_submission'
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
export const trackAddToCart = (projectId: string, projectTitle: string, price: number) => {
  trackEvent('add_to_cart', {
    items: [{
      item_id: projectId,
      item_name: projectTitle,
      price: price,
      currency: 'MAD',
      item_category: 'project'
    }],
    event_category: 'ecommerce',
    event_label: 'add_to_cart'
  });
};

export const trackPurchase = (transactionId: string, projectId: string, projectTitle: string, price: number) => {
  trackEvent('purchase', {
    transaction_id: transactionId,
    value: price,
    currency: 'MAD',
    items: [{
      item_id: projectId,
      item_name: projectTitle,
      price: price,
      currency: 'MAD',
      item_category: 'project'
    }],
    event_category: 'ecommerce',
    event_label: 'purchase'
  });
};