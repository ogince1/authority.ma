#!/bin/bash

# Script simple pour nettoyer Supabase local
echo "🧹 Nettoyage complet de Supabase local"

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Étape 1: Arrêter Supabase
print_status "Arrêt de Supabase local..."
supabase stop 2>/dev/null || true
print_success "Supabase arrêté"

# Étape 2: Supprimer les conteneurs
print_status "Suppression des conteneurs..."
docker rm -f supabase_db_platformelink 2>/dev/null || true
docker rm -f supabase_api_platformelink 2>/dev/null || true
docker rm -f supabase_studio_platformelink 2>/dev/null || true
docker rm -f supabase_realtime_platformelink 2>/dev/null || true
docker rm -f supabase_storage_platformelink 2>/dev/null || true
docker rm -f supabase_inbucket_platformelink 2>/dev/null || true
print_success "Conteneurs supprimés"

# Étape 3: Supprimer les volumes
print_status "Suppression des volumes..."
docker volume rm supabase_db_platformelink 2>/dev/null || true
docker volume rm supabase_storage_platformelink 2>/dev/null || true
print_success "Volumes supprimés"

# Étape 4: Nettoyer Docker
print_status "Nettoyage de Docker..."
docker system prune -f 2>/dev/null || true
print_success "Docker nettoyé"

# Étape 5: Supprimer migrations problématiques
print_status "Suppression des migrations problématiques..."
rm -f supabase/migrations/20250121000006_fix_payment_system.sql
rm -f supabase/migrations/20250121000007_fix_purchase_requests.sql
rm -f supabase/migrations/20250121000016_fix_rls_duplicates.sql
print_success "Migrations problématiques supprimées"

echo ""
print_success "🎉 Nettoyage terminé !"
echo ""
echo "📋 Prochaines étapes :"
echo "   1. Pour démarrer Supabase local : supabase start"
echo "   2. Pour synchroniser avec le cloud : ./clean-and-sync.sh"
echo "" 