-- Solution simple : Désactiver RLS pour les tables services
-- À exécuter dans Supabase SQL Editor

-- 1. Désactiver RLS pour services
ALTER TABLE services DISABLE ROW LEVEL SECURITY;

-- 2. Désactiver RLS pour service_requests
ALTER TABLE service_requests DISABLE ROW LEVEL SECURITY;

-- 3. Ajouter les colonnes manquantes pour le workflow des services
ALTER TABLE service_requests 
ADD COLUMN IF NOT EXISTS admin_notes TEXT,
ADD COLUMN IF NOT EXISTS placement_details TEXT,
ADD COLUMN IF NOT EXISTS execution_notes TEXT,
ADD COLUMN IF NOT EXISTS result_report TEXT,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS result_links JSONB DEFAULT '[]'::jsonb;