# Configuration Brevo

## Variables d'environnement à ajouter dans .env :

```bash
# Brevo Email Service
VITE_BREVO_API_KEY=your_brevo_api_key_here
BREVO_API_KEY=your_brevo_api_key_here

# App Configuration
VITE_APP_URL=http://localhost:5173
```

## Installation du package :

```bash
npm install @getbrevo/brevo
```

## Templates à créer dans Brevo Dashboard :

1. **editor-welcome** - Bienvenue éditeur
2. **editor-site-approved** - Site approuvé
3. **editor-site-rejected** - Site rejeté
4. **editor-new-request** - Nouvelle demande
5. **advertiser-welcome** - Bienvenue annonceur
6. **advertiser-order-placed** - Commande passée
7. **advertiser-link-placed** - Lien placé
8. **password-reset** - Réinitialisation mot de passe
