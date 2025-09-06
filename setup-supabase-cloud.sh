#!/bin/bash

echo "🚀 Configuration de la connexion Supabase Cloud"
echo "=============================================="

# Créer le fichier .env s'il n'existe pas
if [ ! -f .env ]; then
    echo "📝 Création du fichier .env..."
    cat > .env << 'EOF'
# Configuration Supabase Cloud
# Remplacez ces valeurs par celles de votre projet Supabase cloud

# URL de votre projet Supabase (trouvée dans Settings > API)
VITE_SUPABASE_URL=https://votre-projet-id.supabase.co

# Clé publique anonyme (trouvée dans Settings > API)
VITE_SUPABASE_ANON_KEY=votre-clé-anonyme-ici

# Clé de service (optionnelle, pour les opérations admin)
SUPABASE_SERVICE_ROLE_KEY=votre-clé-service-ici
EOF
    echo "✅ Fichier .env créé"
else
    echo "⚠️  Le fichier .env existe déjà"
fi

echo ""
echo "📋 Instructions pour configurer votre projet Supabase :"
echo "1. Allez sur https://supabase.com/dashboard"
echo "2. Sélectionnez votre projet"
echo "3. Allez dans Settings > API"
echo "4. Copiez l'URL du projet et la clé anonyme"
echo "5. Remplacez les valeurs dans le fichier .env"
echo ""
echo "🔧 Pour utiliser le projet local :"
echo "   VITE_SUPABASE_URL=http://127.0.0.1:54321"
echo "   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"
echo ""
echo "🔄 Pour synchroniser votre base de données locale avec le cloud :"
echo "   supabase db pull"
echo "   supabase db push"
echo ""
echo "🎯 Pour démarrer le projet :"
echo "   npm run dev"
