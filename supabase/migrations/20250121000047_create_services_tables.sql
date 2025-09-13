-- Création des tables pour le système de services

-- Table des services
CREATE TABLE IF NOT EXISTS services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'MAD',
  minimum_quantity INTEGER DEFAULT 1,
  features JSONB DEFAULT '[]'::jsonb,
  status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'unavailable')),
  category VARCHAR(100) NOT NULL,
  estimated_delivery_days INTEGER DEFAULT 7,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des demandes de services
CREATE TABLE IF NOT EXISTS service_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  total_price DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'in_progress', 'completed', 'cancelled')),
  admin_notes TEXT,
  client_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_service_requests_user_id ON service_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_service_id ON service_requests(service_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_status ON service_requests(status);
CREATE INDEX IF NOT EXISTS idx_services_status ON services(status);
CREATE INDEX IF NOT EXISTS idx_services_category ON services(category);

-- RLS (Row Level Security)
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour services (lecture publique)
CREATE POLICY "Services are viewable by everyone" ON services
  FOR SELECT USING (true);

-- Politiques RLS pour service_requests
CREATE POLICY "Users can view their own service requests" ON service_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own service requests" ON service_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own service requests" ON service_requests
  FOR UPDATE USING (auth.uid() = user_id);

-- Politiques pour les admins
CREATE POLICY "Admins can view all service requests" ON service_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can update all service requests" ON service_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour updated_at
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_requests_updated_at BEFORE UPDATE ON service_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insérer des services par défaut
INSERT INTO services (name, description, price, currency, minimum_quantity, features, category, estimated_delivery_days) VALUES
(
  'Pack de liens forums thématisés',
  'Liens de qualité sur des forums spécialisés dans votre secteur d''activité',
  250.00,
  'MAD',
  10,
  '["Liens sur forums thématisés", "Minimum 10 liens", "Forums de qualité", "Ancres optimisées", "Livraison sous 7 jours"]'::jsonb,
  'SEO',
  7
),
(
  'Soumission dans annuaires généralistes',
  'Soumission de votre site dans 15 annuaires généralistes de qualité',
  2000.00,
  'MAD',
  1,
  '["15 annuaires généralistes", "Soumission manuelle", "Descriptions optimisées", "Catégorisation appropriée", "Livraison sous 14 jours"]'::jsonb,
  'SEO',
  14
),
(
  'Backlinks optimisés pour LLMs',
  'Liens optimisés pour l''indexation dans les modèles de langage (ChatGPT, etc.)',
  450.00,
  'MAD',
  1,
  '["Optimisation LLM", "Liens contextuels", "Contenu structuré", "Métadonnées enrichies", "Livraison sous 10 jours"]'::jsonb,
  'SEO',
  10
),
(
  'Audit SEO complet',
  'Analyse complète de votre site web avec recommandations détaillées',
  900.00,
  'MAD',
  1,
  '["Audit technique complet", "Analyse des mots-clés", "Recommandations personnalisées", "Rapport détaillé", "Plan d''action"]'::jsonb,
  'Audit',
  5
),
(
  'Rédaction de contenu SEO',
  'Rédaction de 5 articles optimisés SEO de 1000 mots chacun',
  1500.00,
  'MAD',
  1,
  '["5 articles de 1000 mots", "Optimisation SEO", "Recherche de mots-clés", "Structure optimisée", "Livraison sous 10 jours"]'::jsonb,
  'Contenu',
  10
);
