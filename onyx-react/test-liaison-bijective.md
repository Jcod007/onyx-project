# Test Manuel - Liaison Bijective Cours-Timer

## 🎯 Objectif
Vérifier que le système respecte strictement la règle : **1 timer ↔ 1 cours maximum**

## 📋 Scénarios de Test

### ✅ Test 1 : Liaison Simple
1. **Créer** un timer "Timer Test 1"
2. **Créer** un cours "Mathématiques"
3. **Dans la page Cours** : Éditer "Mathématiques" → Lier à "Timer Test 1"
4. **Vérifier** :
   - ✓ La carte du cours affiche "Lié à un timer"
   - ✓ La carte du timer affiche "Lié à Mathématiques"

### ✅ Test 2 : Déliaison Automatique (Timer vers Nouveau Cours)
**Prérequis** : Timer Test 1 est lié à Mathématiques

1. **Créer** un nouveau cours "Physique"
2. **Dans la page Cours** : Éditer "Physique" → Lier à "Timer Test 1"
3. **Vérifier** :
   - ✓ "Physique" affiche "Lié à un timer"
   - ✓ "Timer Test 1" affiche "Lié à Physique" (plus Mathématiques!)
   - ✓ "Mathématiques" affiche "Aucune liaison" (déliaison automatique)

### ✅ Test 3 : Déliaison Automatique (Cours vers Nouveau Timer)
**Prérequis** : Timer Test 1 est lié à Physique

1. **Créer** un nouveau timer "Timer Test 2"
2. **Dans la page Timer** : Éditer "Timer Test 2" → Lier à "Physique"
3. **Vérifier** :
   - ✓ "Timer Test 2" affiche "Lié à Physique"
   - ✓ "Physique" affiche "Lié à un timer" (maintenant Timer Test 2)
   - ✓ "Timer Test 1" affiche "Aucun cours lié" (déliaison automatique)

### ✅ Test 4 : Double Conflit
**Setup** :
- Timer A lié à Cours 1
- Timer B lié à Cours 2

1. **Action** : Lier Timer B à Cours 1
2. **Résultat attendu** :
   - ✓ Timer B est lié à Cours 1
   - ✓ Timer A devient libre (délié de Cours 1)
   - ✓ Cours 2 devient libre (délié de Timer B)
   - ✓ Cours 1 affiche "Lié à Timer B"

### ✅ Test 5 : Suppression avec Conversion
**Prérequis** : Timer Test 2 est lié à Physique

1. **Supprimer** Timer Test 2
2. **Vérifier** :
   - ✓ Timer Test 2 n'existe plus
   - ✓ "Physique" affiche "Aucune liaison"
   - ✓ La configuration du timer dans Physique est convertie en "Timer rapide"

### ✅ Test 6 : Création avec Liaison Directe
1. **Créer** un nouveau timer "Timer Test 3"
2. **Pendant la création**, sélectionner un cours disponible
3. **Vérifier** :
   - ✓ Le timer est créé ET lié immédiatement
   - ✓ Le cours affiche la liaison
   - ✓ Si le cours était déjà lié, l'ancien timer est délié

## 🔄 Synchronisation à Vérifier

### Entre Pages
1. Faire une liaison dans la page **Timers**
2. Naviguer vers la page **Cours**
3. **Vérifier** : Le statut est mis à jour immédiatement

### Rafraîchissement
1. Faire une liaison
2. Rafraîchir la page (F5)
3. **Vérifier** : Les liaisons sont persistées correctement

## ⚠️ Cas Limites à Tester

### 1. Liaison Circulaire
- Lier A→B, puis essayer B→A
- **Attendu** : Impossible, un seul lien par entité

### 2. Suppression en Cascade
- Supprimer un cours lié
- **Attendu** : Le timer devient libre, pas supprimé

### 3. Édition Simultanée
- Ouvrir 2 onglets
- Lier dans l'onglet 1
- **Attendu** : L'onglet 2 se met à jour après action

## 📊 Matrice de Test

| Scénario | Timer Initial | Cours Initial | Action | Timer Final | Cours Final |
|----------|--------------|---------------|---------|-------------|-------------|
| Liaison simple | Libre | Libre | Lier T→C | Lié à C | Lié à T |
| Remplacement timer | T1→C1 | C1←T1, C2 libre | Lier T2→C1 | T1 libre, T2→C1 | C1←T2, C2 libre |
| Remplacement cours | T1→C1 | C1←T1, C2 libre | Lier T1→C2 | T1→C2 | C1 libre, C2←T1 |
| Double conflit | T1→C1, T2→C2 | C1←T1, C2←T2 | Lier T2→C1 | T1 libre, T2→C1 | C1←T2, C2 libre |

## 🚀 Commandes de Test

```bash
# Lancer les tests unitaires
npm test courseTimerLinkManager.test.ts

# Lancer l'application pour tests manuels
npm run dev

# Vérifier les logs dans la console
# Rechercher les messages avec 🔗, ✅, 🔓, 🔄
```

## ✨ Points de Validation

- [ ] Aucune liaison multiple (1↔1 strict)
- [ ] Déliaisons automatiques fonctionnelles
- [ ] Conversions en timer rapide correctes
- [ ] Synchronisation temps réel
- [ ] Persistance après rafraîchissement
- [ ] Pas d'incohérence visuelle
- [ ] Messages de confirmation clairs
- [ ] Rollback en cas d'erreur

## 📝 Notes de Test

_Espace pour noter les observations durant les tests :_

---

**Date du test** : ___________
**Testeur** : ___________
**Version** : 1.0.0
**Résultat** : ⬜ PASS / ⬜ FAIL