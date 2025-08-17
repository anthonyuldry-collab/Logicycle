<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Logicyle - Gestion d'équipe cycliste

Ce projet est une application web pour gérer la logistique d'une équipe cycliste, construite avec React, TypeScript et Firebase, et compilée avec Vite.

## Lancer le projet localement

**Prérequis :** [Node.js](https://nodejs.org/) (version 18 ou supérieure recommandée).

1.  **Installer les dépendances :**
    Ouvrez un terminal à la racine du projet et exécutez :
    ```bash
    npm install
    ```

2.  **Configurer les variables d'environnement :**
    Créez un fichier nommé `.env` à la racine du projet et ajoutez votre clé d'API Gemini :
    ```
    VITE_GEMINI_API_KEY=VOTRE_CLE_API_GEMINI
    ```
    Remplacez `VOTRE_CLE_API_GEMINI` par votre clé réelle.

3.  **Lancer le serveur de développement :**
    ```bash
    npm run dev
    ```
    L'application sera accessible à l'adresse `http://localhost:5173` (ou un autre port si celui-ci est occupé).

## Déployer sur Netlify

Pour déployer ce projet sur Netlify, suivez ces étapes :

1.  **Connectez votre dépôt Git** à un nouveau site sur Netlify.

2.  **Configurez les paramètres de build :**
    *   **Build command :** `npm run build`
    *   **Publish directory :** `dist`

3.  **Ajoutez votre variable d'environnement :**
    *   Allez dans `Site settings` > `Build & deploy` > `Environment`.
    *   Ajoutez une nouvelle variable :
        *   **Key :** `VITE_GEMINI_API_KEY`
        *   **Value :** (votre clé d'API Gemini secrète)

4.  **Déployez votre site.** Netlify installera les dépendances, exécutera la commande de build et déploiera les fichiers statiques du dossier `dist`.
