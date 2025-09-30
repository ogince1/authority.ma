#!/bin/bash

# Script pour nettoyer Supabase local et récupérer les données du cloud
echo "🧹 Nettoyage complet de Supabase local et synchronisation avec le cloud"

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Étape 1: Arrêter Supabase
print_status "Arrêt de Supabase local..."
supabase stop 2>/dev/null || true
print_success "Supabase arrêté"

# Étape 2: Supprimer les conteneurs Supabase
print_status "Suppression des conteneurs Supabase..."
docker rm -f supabase_db_platformelink 2>/dev/null || true
docker rm -f supabase_api_platformelink 2>/dev/null || true
docker rm -f supabase_studio_platformelink 2>/dev/null || true
docker rm -f supabase_realtime_platformelink 2>/dev/null || true
docker rm -f supabase_storage_platformelink 2>/dev/null || true
docker rm -f supabase_inbucket_platformelink 2>/dev/null || true
print_success "Conteneurs supprimés"

# Étape 3: Supprimer les volumes Supabase
print_status "Suppression des volumes Supabase..."
docker volume rm supabase_db_platformelink 2>/dev/null || true
docker volume rm supabase_storage_platformelink 2>/dev/null || true
print_success "Volumes supprimés"

# Étape 4: Nettoyer Docker
print_status "Nettoyage de Docker..."
docker system prune -f 2>/dev/null || true
print_success "Docker nettoyé"

# Étape 5: Supprimer les migrations problématiques
print_status "Suppression des migrations problématiques..."
rm -f supabase/migrations/20250121000006_fix_payment_system.sql
rm -f supabase/migrations/20250121000007_fix_purchase_requests.sql
rm -f supabase/migrations/20250121000016_fix_rls_duplicates.sql
print_success "Migrations problématiques supprimées"

# Étape 6: Demander le Project ID
echo ""
print_status "Configuration de la synchronisation avec le cloud"
echo ""

# Demander le Project ID
read -p "Entrez votre Project ID Supabase cloud: " PROJECT_ID

if [ -z "$PROJECT_ID" ]; then
    print_error "Project ID requis pour continuer"
    exit 1
fi

# Étape 7: Lier le projet cloud
print_status "Liaison avec le projet cloud: $PROJECT_ID"
supabase link --project-ref "$PROJECT_ID" 2>/dev/null || {
    print_error "Impossible de lier le projet. Vérifiez votre Project ID."
    exit 1
}
print_success "Projet lié avec succès"

# Étape 8: Récupérer le schéma du cloud
print_status "Récupération du schéma depuis le cloud..."
supabase db pull 2>/dev/null || {
    print_error "Impossible de récupérer le schéma du cloud"
    exit 1
}
print_success "Schéma récupéré avec succès"

# Étape 9: Démarrer Supabase avec le nouveau schéma
print_status "Démarrage de Supabase avec le schéma cloud..."
supabase start 2>/dev/null || {
    print_error "Impossible de démarrer Supabase"
    exit 1
}
print_success "Supabase démarré avec succès"

# Étape 10: Vérification finale
print_status "Vérification de la synchronisation..."
supabase status 2>/dev/null || {
    print_warning "Impossible de vérifier le statut"
}

echo ""
print_success "🎉 Synchronisation terminée avec succès !"
echo ""
echo "📋 Services disponibles :"
echo "   • Supabase Studio: http://127.0.0.1:54323"
echo "   • API REST: http://127.0.0.1:54321"
echo "   • Base de données: postgresql://postgres:postgres@127.0.0.1:54322/postgres"
echo ""
echo "🔗 Ouvrez votre navigateur et allez à: http://127.0.0.1:54323"
echo "" 