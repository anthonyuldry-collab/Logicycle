# 🚀 Guide de Déploiement Netlify

## Prérequis

- Un compte Netlify (gratuit)
- Votre projet sur GitHub/GitLab/Bitbucket

## Étapes de déploiement

### 1. Méthode Drag & Drop (Rapide)

1. Exécutez `npm run build` localement
2. Allez sur [netlify.com](https://netlify.com)
3. Connectez-vous à votre compte
4. Glissez-déposez le dossier `dist` sur la zone de déploiement
5. Votre site sera en ligne en quelques secondes !

### 2. Méthode Git (Recommandée)

1. Poussez votre code sur GitHub/GitLab/Bitbucket
2. Allez sur [netlify.com](https://netlify.com)
3. Cliquez sur "New site from Git"
4. Sélectionnez votre repository
5. Configurez :
   - **Build command** : `npm run build`
   - **Publish directory** : `dist`
6. Cliquez sur "Deploy site"

## Configuration Firebase

⚠️ **Important** : Pour que Firebase fonctionne en production, vous devez :

1. Aller dans la [Console Firebase](https://console.firebase.google.com)
2. Sélectionner votre projet `logicycle01`
3. Aller dans **Authentication** > **Settings** > **Authorized domains**
4. Ajouter votre domaine Netlify (ex: `votre-app.netlify.app`)

## Variables d'environnement (Optionnel)

Si vous voulez utiliser des variables d'environnement :

1. Dans Netlify, allez dans **Site settings** > **Environment variables**
2. Ajoutez vos variables si nécessaire

## Optimisations

Le fichier `netlify.toml` configure automatiquement :

- ✅ Redirection SPA (React Router)
- ✅ Cache des assets statiques
- ✅ Headers de sécurité
- ✅ Version Node.js 18

## Support

En cas de problème :

- Vérifiez les logs de build dans Netlify
- Assurez-vous que Firebase est configuré pour votre domaine
- Testez localement avec `npm run build` avant de déployer
