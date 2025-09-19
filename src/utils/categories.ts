import { WebsiteCategory } from '../types';

export const WEBSITE_CATEGORIES: { value: WebsiteCategory; label: string }[] = [
  { value: 'adults_only', label: 'Adults Only (18+)' },
  { value: 'arts_entertainment', label: 'Arts & Entertainment' },
  { value: 'auto_vehicles', label: 'Auto & Vehicles' },
  { value: 'beauty_fashion_lifestyle', label: 'Beauty, Fashion & Lifestyle' },
  { value: 'business_consumer_services', label: 'Business & Consumer Services' },
  { value: 'community_society', label: 'Community & Society' },
  { value: 'computers_technology', label: 'Computers & Technology' },
  { value: 'finance_economy', label: 'Finance & Economy' },
  { value: 'food_drink', label: 'Food & Drink' },
  { value: 'gambling', label: 'Gambling' },
  { value: 'games', label: 'Games' },
  { value: 'health_wellness', label: 'Health & Wellness' },
  { value: 'heavy_industry_engineering', label: 'Heavy Industry & Engineering' },
  { value: 'hobbies_leisure', label: 'Hobbies & Leisure' },
  { value: 'home_garden', label: 'Home & Garden' },
  { value: 'jobs_career', label: 'Jobs & Career' },
  { value: 'law_government', label: 'Law & Government' },
  { value: 'news_media', label: 'News & Media' },
  { value: 'pets_animals', label: 'Pets & Animals' },
  { value: 'reference_education', label: 'Reference & Education' },
  { value: 'science_nature', label: 'Science & Nature' },
  { value: 'science_education', label: 'Science & Education' },
  { value: 'shopping_deals', label: 'Shopping & Deals' },
  { value: 'sports_fitness', label: 'Sports & Fitness' },
  { value: 'travel_tourism', label: 'Travel & Tourism' },
  { value: 'various', label: 'Various' },
  { value: 'world_regional', label: 'World & Regional' }
];

export const getCategoryLabel = (category: WebsiteCategory): string => {
  const categoryObj = WEBSITE_CATEGORIES.find(cat => cat.value === category);
  return categoryObj?.label || category;
};

export const getCategoryOptions = () => {
  return [
    { value: 'all', label: 'Toutes les catégories' },
    ...WEBSITE_CATEGORIES
  ];
};

// Fonction pour obtenir la couleur d'une catégorie
export const getCategoryColor = (category: WebsiteCategory): string => {
  switch (category) {
    case 'adults_only':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'arts_entertainment':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'auto_vehicles':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'beauty_fashion_lifestyle':
      return 'bg-pink-100 text-pink-800 border-pink-200';
    case 'business_consumer_services':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    case 'community_society':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'computers_technology':
      return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    case 'finance_economy':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'food_drink':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'gambling':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'games':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'health_wellness':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'heavy_industry_engineering':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    case 'hobbies_leisure':
      return 'bg-cyan-100 text-cyan-800 border-cyan-200';
    case 'home_garden':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'jobs_career':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'law_government':
      return 'bg-slate-100 text-slate-800 border-slate-200';
    case 'news_media':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'pets_animals':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'reference_education':
      return 'bg-violet-100 text-violet-800 border-violet-200';
    case 'science_nature':
      return 'bg-teal-100 text-teal-800 border-teal-200';
    case 'science_education':
      return 'bg-violet-100 text-violet-800 border-violet-200';
    case 'shopping_deals':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'sports_fitness':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'travel_tourism':
      return 'bg-sky-100 text-sky-800 border-sky-200';
    case 'various':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    case 'world_regional':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};
