import React from 'react';
import { Filter, X, Tag, Building, Laptop } from 'lucide-react';
import { ProjectFilterOptions, ProjectType } from '../../types';
import { trackFilter } from '../../utils/analytics';
import { DIGITAL_CATEGORIES, REAL_CATEGORIES, INDUSTRY_SECTORS } from '../../utils/categories';

interface ProjectFiltersProps {
  filters: ProjectFilterOptions;
  onFiltersChange: (filters: ProjectFilterOptions) => void;
}

const ProjectFilters: React.FC<ProjectFiltersProps> = ({ filters, onFiltersChange }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  // Anciennes catégories pour rétrocompatibilité
  const legacyCategories = [
    { value: 'mvp', label: 'MVP' },
    { value: 'startup', label: 'Startup' },
    { value: 'website', label: 'Site Web' }
  ];

  // Nouvelles catégories digitales
  const digitalCategories = Object.entries(DIGITAL_CATEGORIES).map(([key, info]) => ({
    value: key,
    label: info.label,
    description: info.description
  }));

  // Nouvelles catégories réelles
  const realCategories = Object.entries(REAL_CATEGORIES).map(([key, info]) => ({
    value: key,
    label: info.label,
    description: info.description
  }));

  // Secteurs d'activité
  const industrySectors = Object.entries(INDUSTRY_SECTORS).map(([key, info]) => ({
    value: key,
    label: info.label,
    icon: info.icon
  }));

  const priceRanges = [
    { min: 0, max: 50000, label: '0 - 50k MAD' },
    { min: 50000, max: 100000, label: '50k - 100k MAD' },
    { min: 100000, max: 200000, label: '100k - 200k MAD' },
    { min: 200000, max: 500000, label: '200k - 500k MAD' },
    { min: 500000, max: 1000000, label: '500k - 1M MAD' },
    { min: 1000000, max: undefined, label: '1M+ MAD' }
  ];

  const industryTags = [
    'SaaS', 'E-commerce', 'Applications Mobiles', 'Fintech', 'EdTech', 'HealthTech',
    'Intelligence Artificielle', 'Blockchain', 'Gaming', 'Contenu & Médias',
    'Immobilier', 'Tourisme & Hôtellerie', 'Logistique & Transport', 'AgriTech',
    'Énergies Renouvelables', 'Marketing Digital', 'Cybersécurité', 'RH Tech',
    'Artisanat & Produits Locaux', 'Services aux Entreprises', 'Services aux Particuliers',
    'Retail', 'FoodTech', 'Smart City', 'Franchise', 'Luxe & Premium'
  ];

  const handleProjectTypeChange = (type: ProjectType) => {
    const newFilters = {
      ...filters,
      project_type: filters.project_type === type ? undefined : type,
      // Reset category filters when changing type
      category: undefined,
      real_category: undefined
    };
    
    onFiltersChange(newFilters);
    trackFilter('project_type', newFilters.project_type || 'all', 0);
  };

  const handleCategoryChange = (category: string) => {
    const newFilters = {
      ...filters,
      category: filters.category === category ? undefined : category as any
    };
    
    onFiltersChange(newFilters);
    trackFilter('category', newFilters.category || 'all', 0);
  };

  const handleRealCategoryChange = (category: string) => {
    const newFilters = {
      ...filters,
      real_category: filters.real_category === category ? undefined : category as any
    };
    
    onFiltersChange(newFilters);
    trackFilter('real_category', newFilters.real_category || 'all', 0);
  };

  const handleIndustrySectorChange = (sector: string) => {
    const newFilters = {
      ...filters,
      industry_sector: filters.industry_sector === sector ? undefined : sector as any
    };
    
    onFiltersChange(newFilters);
    trackFilter('industry_sector', newFilters.industry_sector || 'all', 0);
  };

  const handlePriceRangeChange = (min: number, max?: number) => {
    const newFilters = {
      ...filters,
      minPrice: min,
      maxPrice: max
    };
    
    onFiltersChange(newFilters);
    trackFilter('price_range', `${min}-${max || 'max'}`, 0);
  };

  const handleIndustryTagChange = (tag: string) => {
    const currentTags = filters.industryTags || [];
    const newTags = currentTags.includes(tag)
      ? currentTags.filter(t => t !== tag)
      : [...currentTags, tag];
    
    const newFilters = {
      ...filters,
      industryTags: newTags.length > 0 ? newTags : undefined
    };
    
    onFiltersChange(newFilters);
    trackFilter('industry_tag', tag, 0);
  };

  const clearFilters = () => {
    onFiltersChange({});
    trackFilter('clear_all', 'all', 0);
  };

  const hasActiveFilters = 
    filters.project_type || 
    filters.category || 
    filters.real_category || 
    filters.industry_sector || 
    filters.minPrice || 
    filters.maxPrice || 
    (filters.industryTags && filters.industryTags.length > 0) ||
    filters.rental_option;

  return (
    <div className="relative">
      {/* Mobile Filter Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden flex items-center space-x-2 bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium hover:bg-gray-50"
      >
        <Filter className="h-4 w-4" />
        <span>Filtres</span>
        {hasActiveFilters && (
          <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-1">
            {Object.values(filters).filter(v => v !== undefined && v !== null && (Array.isArray(v) ? v.length > 0 : true)).length}
          </span>
        )}
      </button>

      {/* Filters Panel */}
      <div className={`${isOpen ? 'block' : 'hidden'} md:block absolute md:relative top-full left-0 right-0 z-20 bg-white border border-gray-200 rounded-lg p-4 shadow-lg md:shadow-none md:border-0 md:p-0`}>
        <div className="flex items-center justify-between mb-4 md:hidden">
          <h3 className="text-lg font-semibold">Filtres</h3>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-6 md:grid md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 md:gap-6 md:space-y-0">
          
          {/* Type de Projet */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Type de Projet
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleProjectTypeChange('digital')}
                className={`flex items-center px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  filters.project_type === 'digital'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Laptop className="h-3 w-3 mr-1" />
                Digital
              </button>
              <button
                onClick={() => handleProjectTypeChange('real')}
                className={`flex items-center px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  filters.project_type === 'real'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Building className="h-3 w-3 mr-1" />
                Réel
              </button>
            </div>
          </div>

          {/* Catégories Digitales */}
          {filters.project_type === 'digital' && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Catégories Digitales
              </label>
              <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-2">
                <div className="space-y-1">
                  {digitalCategories.map((category) => (
                    <button
                      key={category.value}
                      onClick={() => handleCategoryChange(category.value)}
                      className={`w-full text-left px-2 py-1 rounded text-sm transition-colors ${
                        filters.category === category.value
                          ? 'bg-blue-100 text-blue-800'
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      {category.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Catégories Réelles */}
          {filters.project_type === 'real' && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Catégories Réelles
              </label>
              <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-2">
                <div className="space-y-1">
                  {realCategories.map((category) => (
                    <button
                      key={category.value}
                      onClick={() => handleRealCategoryChange(category.value)}
                      className={`w-full text-left px-2 py-1 rounded text-sm transition-colors ${
                        filters.real_category === category.value
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      {category.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Secteurs d'Activité */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              <Tag className="h-4 w-4 inline mr-2" />
              Secteur d'Activité
            </label>
            <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-2">
              <div className="grid grid-cols-2 gap-1">
                {industrySectors.map((sector) => (
                  <button
                    key={sector.value}
                    onClick={() => handleIndustrySectorChange(sector.value)}
                    className={`flex items-center space-x-1 text-left px-2 py-1 rounded text-xs transition-colors ${
                      filters.industry_sector === sector.value
                        ? 'bg-purple-100 text-purple-800'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <span>{sector.icon}</span>
                    <span>{sector.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Tags d'Industrie */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Tags d'Industrie
            </label>
            <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-2">
              <div className="grid grid-cols-2 gap-1">
                {industryTags.map((tag) => (
                  <label
                    key={tag}
                    className="flex items-center space-x-2 text-xs hover:bg-gray-50 p-1 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={filters.industryTags?.includes(tag) || false}
                      onChange={() => handleIndustryTagChange(tag)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-gray-700">{tag}</span>
                  </label>
                ))}
              </div>
            </div>
            {filters.industryTags && filters.industryTags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {filters.industryTags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2 py-1 bg-emerald-100 text-emerald-800 rounded-md text-xs font-medium"
                  >
                    {tag}
                    <button
                      onClick={() => handleIndustryTagChange(tag)}
                      className="ml-1 text-emerald-600 hover:text-emerald-800"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Price Range Filter */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Gamme de Prix
            </label>
            <div className="flex flex-wrap gap-2">
              {priceRanges.map((range, index) => (
                <button
                  key={index}
                  onClick={() => handlePriceRangeChange(range.min, range.max)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    filters.minPrice === range.min && filters.maxPrice === range.max
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>

          {/* Options de Location (pour projets réels) */}
          {filters.project_type === 'real' && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Options
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="rental_option"
                  checked={filters.rental_option || false}
                  onChange={(e) => onFiltersChange({
                    ...filters,
                    rental_option: e.target.checked || undefined
                  })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="rental_option" className="text-sm text-gray-700">
                  Disponible en location
                </label>
              </div>
            </div>
          )}

          {/* Clear Filters */}
          {hasActiveFilters && (
            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="text-sm text-red-600 hover:text-red-700 font-medium"
              >
                Effacer tout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectFilters;