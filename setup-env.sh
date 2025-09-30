#!/bin/bash

# Script de configuration des variables d'environnement
echo "🚀 Configuration des variables d'environnement pour Back.ma"

# Vérifier si .env.local existe déjà
if [ -f ".env.local" ]; then
    echo "⚠️  Le fichier .env.local existe déjà."
    read -p "Voulez-vous le remplacer ? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Configuration annulée."
        exit 1
    fi
fi

# Créer le fichier .env.local
cat > .env.local << 'EOF'
# ===== CONFIGURATION SUPABASE LOCAL =====
# URL de Supabase local (générée automatiquement)
VITE_SUPABASE_URL=http://127.0.0.1:54321

# Clé anonyme Supabase local (générée automatiquement)
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0

# Clé de service Supabase local (pour les opérations admin)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU

# ===== CONFIGURATION APPLICATION =====
# URL de l'application locale
VITE_APP_URL=http://localhost:3000

# Mode de l'application
NODE_ENV=development

# ===== CONFIGURATION PAYMENT (DÉVELOPPEMENT) =====
# Clés de test pour les paiements
PAYPAL_CLIENT_ID=test-paypal-client-id
PAYPAL_CLIENT_SECRET=test-paypal-client-secret
STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-test-key
STRIPE_SECRET_KEY=sk_test_your-stripe-test-key

# ===== CONFIGURATION EMAIL (DÉVELOPPEMENT) =====
# Configuration SMTP pour les emails de test
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=test@example.com
SMTP_PASS=test-app-password

# ===== CONFIGURATION ANALYTICS =====
# Google Analytics (ID de test)
VITE_GA_TRACKING_ID=G-TEST123456

# ===== CONFIGURATION SEO =====
# URL du site pour le sitemap (développement)
SITE_URL=http://localhost:3000

# ===== CONFIGURATION STORAGE =====
# Configuration du stockage des images
VITE_STORAGE_BUCKET=website-images
EOF

echo "✅ Fichier .env.local créé avec succès !"
echo ""
echo "📋 Prochaines étapes :"
echo "1. Modifiez les valeurs dans .env.local selon vos besoins"
echo "2. Lancez 'supabase start' pour démarrer la base de données locale"
echo "3. Lancez 'npm run dev' pour démarrer l'application"
echo ""
echo "🔐 Note : Le fichier .env.local est ignoré par Git pour la sécurité" 