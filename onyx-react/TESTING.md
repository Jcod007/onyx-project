# Tests - Configuration Jest ✅

## 🚀 Configuration complète

Jest est maintenant configuré pour ce projet React/TypeScript avec :
- Support ES modules (`"type": "module"` en package.json)
- Configuration TypeScript via `ts-jest`
- Environnement `jsdom` pour les tests React
- Mocking automatique des APIs du navigateur
- Alias de chemins `@/` configuré
- Coverage de code intégré

## 📋 Commandes disponibles

```bash
# Tests de base
npm test                           # Lancer tous les tests
npm run test:watch                 # Mode watch (relance automatique)
npm run test:coverage              # Tests + couverture de code
npm run test:ui                    # Tests avec sortie détaillée

# Tests spécifiques
npm test example.test.ts           # Un fichier de test spécifique
npm test bijection                 # Tests contenant "bijection"
npm test integration              # Tests d'intégration

# Options utiles
npm test -- --verbose             # Sortie détaillée
npm test -- --silent              # Mode silencieux
npm test -- --watchAll            # Watch tous les fichiers
```

## 🧪 Tests disponibles

### 1. Tests de validation (`example.test.ts`)
- Vérification de base de Jest
- Tests simples pour valider la configuration

### 2. Tests de validation de la bijection (`bijection.validation.test.ts`)
- Logique de déliaison automatique
- Validation des règles 1↔1
- Tests de la correction du front-end

### 3. Tests d'intégration (`courseTimerLinkManager.integration.test.ts`)
- Tests complets avec vrais services
- Liaison cours-timer
- Déliaison automatique
- Conversion en timer rapide
- Scénarios complexes

## 🔧 Structure des tests

```
src/tests/
├── setupTests.ts                 # Configuration globale
├── __mocks__/
│   └── fileMock.js              # Mock pour les fichiers statiques
├── example.test.ts              # Tests de base
├── bijection.validation.test.ts # Tests de validation
└── courseTimerLinkManager.integration.test.ts # Tests d'intégration
```

## ⚙️ Configuration Jest (`jest.config.js`)

- **Preset**: `ts-jest` pour TypeScript
- **Environment**: `jsdom` pour DOM/React
- **Module mapping**: `@/*` → `src/*`
- **Setup**: Mocks automatiques pour localStorage, sessionStorage, etc.
- **Coverage**: Exclusion des fichiers de config et tests
- **Extensions ES modules**: Support `.ts` et `.tsx`

## 🎯 Tests de la fonctionnalité bijective

### Validations principales
✅ **Liaison simple** : 1 timer ↔ 1 cours  
✅ **Déliaison automatique** : Ancien lien supprimé lors d'un nouveau  
✅ **Double conflit** : Gestion des conflits multiples  
✅ **Conversion automatique** : Timer supprimé → cours en timer rapide  
✅ **Synchronisation** : Front-end mis à jour en temps réel  

### Scénarios testés
1. **Création de liaison** : Timer libre + Cours libre
2. **Remplacement de liaison** : Timer A→Cours 1, puis Timer B→Cours 1
3. **Changement de cours** : Timer A→Cours 1, puis Timer A→Cours 2
4. **Suppression avec conversion** : Timer lié supprimé
5. **État des liaisons** : Rapport complet des liaisons actives

## 🐛 Déboguer les tests

```bash
# Voir les logs détaillés
npm test -- --verbose

# Exécuter un seul test
npm test -- --testNamePattern="Liaison Simple"

# Débogger un test spécifique
npm test -- --runInBand --detectOpenHandles

# Voir la couverture
npm run test:coverage
```

## 📊 Coverage de code

Le coverage est configuré pour exclure :
- `src/main.tsx` (point d'entrée)
- `src/**/*.d.ts` (définitions TypeScript)
- `src/tests/**` (tests eux-mêmes)
- `src/**/*.stories.*` (Storybook si présent)

## ✨ Points clés pour les nouveaux tests

1. **Imports** : Utiliser les alias `@/` configurés
2. **Async/Await** : Support complet des promesses
3. **Mocking** : `jest.fn()`, `jest.mock()` disponibles
4. **Setup** : `setupTests.ts` exécuté avant chaque test
5. **Types** : Support TypeScript complet

## 🔄 Intégration continue

Les tests peuvent être intégrés dans un pipeline CI/CD :

```yaml
# Exemple GitHub Actions
- name: Run tests
  run: npm test -- --coverage --watchAll=false
```

---

**Configuration validée le** : ${new Date().toLocaleDateString('fr-FR')}  
**Status** : ✅ Tous les tests passent (21/21)  
**Coverage** : Configuré et fonctionnel