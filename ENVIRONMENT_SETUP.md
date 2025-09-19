# Configuration de l'Environnement

## Variables d'Environnement Requises

Créez un fichier `.env` à la racine du projet avec les variables suivantes :

```bash
# Configuration Supabase
VITE_SUPABASE_URL=https://lqldqgbpaxqaazfjzlsz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxbGRxZ2JwYXhxYWF6Zmp6bHN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1NjQxOTEsImV4cCI6MjA2OTE0MDE5MX0.b3c4OMwKQwNgFBQSS-oGXsWzsdXY1NPnEcxXQUz7HLI
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxbGRxZ2JwYXhxYWF6Zmp6bHN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzU2NDE5MSwiZXhwIjoyMDY5MTQwMTkxfQ.rVOMDNv6DVaAq3202AcAacXaM2-hGqppyeI617eWieI

# Configuration PayPal
VITE_PAYPAL_CLIENT_ID=AUSqfLs6zruS_LVHpmZlb5MR8WZvHmRmFFgi5PIHzm4JEOcgGVa3w5PwTYBbCq7jwdR1DKe0sLf19Tm6
VITE_PAYPAL_CLIENT_SECRET=EN_jTEIQ3_WUCyDAwlFw6NqrWQJZzlsfvImIc2L0I6-ByCfOHP9_cji5A0QdcmmNKfo0WA_Yia2pbSzx
VITE_PAYPAL_MODE=sandbox  # ou 'live' pour la production
```

## Instructions d'Installation

1. **Cloner le repository**
   ```bash
   git clone https://github.com/ogince1/authority.ma.git
   cd authority.ma
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Créer le fichier .env**
   ```bash
   cp ENVIRONMENT_SETUP.md .env
   # Puis éditer le fichier .env avec les vraies valeurs
   ```

4. **Appliquer les migrations de base de données**
   ```bash
   # Les migrations sont dans supabase/migrations/
   # Appliquez-les via l'interface Supabase ou CLI
   ```

5. **Démarrer le serveur de développement**
   ```bash
   npm run dev
   ```

## Base de Données

Le projet utilise Supabase (PostgreSQL) avec les migrations suivantes :
- `20250121000001_base_tables.sql` - Tables de base
- `20250121000004_purchase_system.sql` - Système d'achat
- `20250121000005_credit_system.sql` - Système de crédit
- `20250121000006_add_custom_content.sql` - Contenu personnalisé
- Et d'autres migrations pour les fonctionnalités avancées

## Fonctionnalités Principales

- ✅ Éditeur de contenu riche pour les demandes personnalisées
- ✅ Pagination dans les dashboards utilisateur
- ✅ Design moderne avec thème bleu RocketLinks
- ✅ Système de messagerie intégré
- ✅ Gestion des paiements PayPal
- ✅ Administration complète
- ✅ Blog et success stories
- ✅ SEO optimisé

## Support

Pour toute question, consultez la documentation dans le repository ou contactez l'équipe de développement.