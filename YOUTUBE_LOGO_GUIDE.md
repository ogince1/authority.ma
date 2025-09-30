# 🎨 Guide des logos Back.ma pour YouTube

## 📁 Fichiers disponibles

### 1. **logo-youtube-cover.svg** (2048x1152px)
- **Usage** : Image de couverture YouTube principale
- **Format** : SVG vectoriel haute résolution
- **Couleurs** : Bleu gradient avec texte blanc
- **Téléchargement** : `/public/logo-youtube-cover.svg`

### 2. **logo-youtube-cover-modern.svg** (2048x1152px)
- **Usage** : Image de couverture YouTube moderne
- **Format** : SVG vectoriel avec badges de fonctionnalités
- **Couleurs** : Gradient bleu foncé avec éléments décoratifs
- **Téléchargement** : `/public/logo-youtube-cover-modern.svg`

### 3. **logo-youtube-square.svg** (400x400px)
- **Usage** : Avatar de chaîne, miniatures
- **Format** : SVG carré avec coins arrondis
- **Couleurs** : Bleu gradient avec icône de lien
- **Téléchargement** : `/public/logo-youtube-square.svg`

### 4. **logo-simple.svg** (120x40px)
- **Usage** : Logo horizontal pour bannières
- **Format** : SVG horizontal compact
- **Couleurs** : Bleu gradient
- **Téléchargement** : `/public/logo-simple.svg`

## 🎯 Recommandations YouTube

### **Image de couverture (2048x1152px)**
- Utilisez `logo-youtube-cover.svg` ou `logo-youtube-cover-modern.svg`
- Format 16:9 obligatoire
- Haute résolution pour tous les écrans
- Texte lisible sur mobile et desktop

### **Avatar de chaîne (400x400px)**
- Utilisez `logo-youtube-square.svg`
- Format carré avec coins arrondis
- Visible même en petite taille
- Cohérent avec l'identité visuelle

### **Logo de chaîne (800x800px)**
- Utilisez `logo-youtube-square.svg` agrandi
- Format carré obligatoire
- Fond transparent ou uni
- Lisible sur fond sombre et clair

## 🎨 Palette de couleurs

```css
/* Couleurs principales */
--blue-500: #3B82F6
--blue-700: #1E40AF
--blue-900: #1E3A8A

/* Couleurs secondaires */
--blue-400: #60A5FA
--white: #FFFFFF
--gray-600: #6B7280
```

## 📱 Utilisation sur les réseaux sociaux

### **YouTube**
- Logo principal : `logo-youtube.svg`
- Avatar : `logo-youtube-square.svg`
- Bannière : `logo-simple.svg` (agrandi)

### **Facebook**
- Avatar : `logo-youtube-square.svg`
- Couverture : `logo-simple.svg`

### **Twitter/X**
- Avatar : `logo-youtube-square.svg`
- Header : `logo-simple.svg`

### **LinkedIn**
- Logo entreprise : `logo-youtube.svg`
- Bannière : `logo-simple.svg`

## 🔧 Personnalisation

### **Modifier les couleurs**
Éditez les gradients dans les fichiers SVG :
```xml
<linearGradient id="mainGradient">
  <stop offset="0%" style="stop-color:#3B82F6"/>
  <stop offset="100%" style="stop-color:#1E40AF"/>
</linearGradient>
```

### **Modifier le texte**
Changez le contenu des balises `<text>` :
```xml
<text x="400" y="480" font-size="120" fill="white">
  Back
</text>
```

## 📐 Spécifications techniques

### **Formats supportés**
- ✅ SVG (recommandé)
- ✅ PNG (haute résolution)
- ✅ JPG (avec fond)

### **Résolutions recommandées**
- **Logo chaîne** : 800x800px minimum
- **Avatar** : 400x400px minimum
- **Bannière** : 2560x1440px
- **Miniature** : 1280x720px

## 🚀 Téléchargement

1. **Accédez au dossier** : `/public/`
2. **Sélectionnez le logo** selon votre usage
3. **Téléchargez** le fichier SVG
4. **Convertissez** en PNG si nécessaire
5. **Uploadez** sur YouTube

## 💡 Conseils d'utilisation

- **Cohérence** : Utilisez toujours la même version
- **Qualité** : Préférez le SVG pour la qualité
- **Lisibilité** : Testez sur différents fonds
- **Taille** : Vérifiez la visibilité en petit format

---

**Créé par** : Back.ma Team  
**Dernière mise à jour** : Septembre 2025  
**Version** : 1.0
