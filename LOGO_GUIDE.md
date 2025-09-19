# Guide des Logos Back.ma

## 🎨 **Logos Créés**

### 1. **Logo Simple** (`/public/logo-simple.svg`)
- **Usage** : Header, navigation, favicon
- **Dimensions** : 120x40px
- **Style** : Minimaliste, moderne
- **Couleurs** : Dégradé bleu (#3B82F6 → #1E40AF)
- **Éléments** : Icône de lien + texte "Back.ma"

### 2. **Logo Complet** (`/public/logo-back-ma.svg`)
- **Usage** : Pages importantes, documents officiels
- **Dimensions** : 200x60px
- **Style** : Détaillé avec éléments décoratifs
- **Couleurs** : Dégradé bleu avec éléments verts
- **Éléments** : Icône de lien + texte + indicateurs de qualité

### 3. **Logo Pleine Page** (`/public/logo-full.svg`)
- **Usage** : Pages d'accueil, présentations
- **Dimensions** : 300x80px
- **Style** : Complet avec tagline
- **Couleurs** : Dégradé bleu avec texte gris
- **Éléments** : Logo + tagline "Plateforme Marocaine de Backlinks"

### 4. **Favicon** (`/public/favicon.svg`)
- **Usage** : Onglet navigateur, bookmarks
- **Dimensions** : 32x32px
- **Style** : Icône simple avec "B"
- **Couleurs** : Dégradé bleu avec blanc
- **Éléments** : Icône de lien + lettre "B"

### 5. **Logo Social** (`/public/logo-social.png`)
- **Usage** : Réseaux sociaux, partages
- **Dimensions** : 1200x630px (format Facebook/Twitter)
- **Style** : Pleine page avec fond dégradé
- **Couleurs** : Dégradé bleu avec texte blanc
- **Éléments** : Logo complet + tagline

## 🎯 **Concept Design**

### **Symbolisme**
- **Icône de Lien** : Représente la connexion, le netlinking
- **Couleur Bleue** : Confiance, professionnalisme, technologie
- **Dégradé** : Modernité, dynamisme
- **Éléments Verts** : Qualité, succès, validation

### **Typographie**
- **Police** : Arial, sans-serif
- **"Back"** : Gras, taille importante
- **".ma"** : Normal, plus petit
- **Tagline** : Gris clair, discret

## 📱 **Utilisation Responsive**

### **Desktop**
- Header : `logo-simple.svg`
- Footer : `logo-simple.svg` (version inversée)
- Pages importantes : `logo-full.svg`

### **Mobile**
- Header : `logo-simple.svg` (adapté)
- Favicon : `favicon.svg`

### **Réseaux Sociaux**
- Facebook/Twitter : `logo-social.png`
- LinkedIn : `logo-full.svg`

## 🔧 **Intégration Technique**

### **Header Component**
```tsx
<img 
  src="/logo-simple.svg" 
  alt="Back.ma Logo" 
  className="h-8 w-auto"
/>
```

### **Footer Component**
```tsx
<img 
  src="/logo-simple.svg" 
  alt="Back.ma Logo" 
  className="h-8 w-auto filter brightness-0 invert"
/>
```

### **SEO Meta Tags**
```html
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<meta property="og:image" content="https://back.ma/logo-social.png" />
```

## 🎨 **Palette de Couleurs**

### **Primaires**
- **Bleu Principal** : #3B82F6
- **Bleu Foncé** : #1E40AF
- **Bleu Moyen** : #2563EB

### **Secondaires**
- **Vert Succès** : #10B981
- **Gris Texte** : #6B7280
- **Gris Clair** : #9CA3AF

### **Neutres**
- **Blanc** : #FFFFFF
- **Gris Foncé** : #1F2937
- **Gris Moyen** : #374151

## 📐 **Guidelines d'Usage**

### **✅ À Faire**
- Utiliser les logos dans leurs proportions originales
- Maintenir un espacement minimum autour du logo
- Utiliser les couleurs officielles
- Respecter la lisibilité sur tous les fonds

### **❌ À Éviter**
- Déformer les proportions
- Changer les couleurs
- Ajouter des effets non autorisés
- Utiliser sur des fonds qui nuisent à la lisibilité

## 🔄 **Mise à Jour**

Tous les logos ont été créés en SVG pour une qualité parfaite à toutes les tailles et une facilité de modification. Les fichiers sont optimisés pour le web et compatibles avec tous les navigateurs modernes.

---

**Créé le** : 21 Janvier 2025  
**Version** : 1.0  
**Format** : SVG (vectoriel) + PNG (social)
