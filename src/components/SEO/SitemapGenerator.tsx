import React from 'react';
import { useSitemapGenerator } from '../../hooks/useSitemapGenerator';

const SitemapGenerator: React.FC = () => {
  useSitemapGenerator();
  return null; // Ce composant ne rend rien, il gère juste la génération du sitemap
};

export default SitemapGenerator;