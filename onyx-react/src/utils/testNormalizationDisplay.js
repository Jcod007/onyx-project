/**
 * 🧪 Test spécifique pour l'affichage normalisé
 * Test du cas : 00:80:00 → 01:20:00
 */

// Reproduction de la logique de normalisation
function normalizeTime(hours, minutes, seconds) {
  // Conversion en entiers
  hours = Math.floor(hours);
  minutes = Math.floor(minutes);
  seconds = Math.floor(seconds);
  
  // Normalisation des secondes
  if (seconds >= 60) {
    const extraMinutes = Math.floor(seconds / 60);
    minutes += extraMinutes;
    seconds = seconds % 60;
  }
  
  // Normalisation des minutes
  if (minutes >= 60) {
    const extraHours = Math.floor(minutes / 60);
    hours += extraHours;
    minutes = minutes % 60;
  }
  
  return { hours, minutes, seconds };
}

// Test de formatage comme dans GoogleTimerInput
function formatDisplay(value) {
  const padded = value.padStart(6, '0');
  const h = padded.slice(0, 2);
  const m = padded.slice(2, 4);
  const s = padded.slice(4, 6);
  return `${h}:${m}:${s}`;
}

// Simulation de la logique de parsing de GoogleTimerInput
function simulateGoogleTimerInput(inputValue) {
  console.log(`\n🎯 Test de saisie: "${inputValue}"`);
  console.log('-'.repeat(40));
  
  // Étape 1: Formatage initial
  const formatted = formatDisplay(inputValue);
  console.log(`1. Formatage initial: ${formatted}`);
  
  // Étape 2: Parsing
  const padded = inputValue.padStart(6, '0');
  const h = parseInt(padded.slice(0, 2), 10);
  const m = parseInt(padded.slice(2, 4), 10);
  const s = parseInt(padded.slice(4, 6), 10);
  console.log(`2. Valeurs parsées: ${h}h ${m}min ${s}s`);
  
  // Étape 3: Normalisation
  const normalized = normalizeTime(h, m, s);
  console.log(`3. Après normalisation: ${normalized.hours}h ${normalized.minutes}min ${normalized.seconds}s`);
  
  // Étape 4: Vérification si normalisation nécessaire
  const wasNormalized = (h !== normalized.hours || m !== normalized.minutes || s !== normalized.seconds);
  console.log(`4. Normalisation nécessaire: ${wasNormalized ? 'OUI' : 'NON'}`);
  
  // Étape 5: Affichage Final
  let finalDisplay;
  if (wasNormalized) {
    const normalizedDisplay = 
      normalized.hours.toString().padStart(2, '0') +
      normalized.minutes.toString().padStart(2, '0') +
      normalized.seconds.toString().padStart(2, '0');
    finalDisplay = formatDisplay(normalizedDisplay);
  } else {
    finalDisplay = formatted;
  }
  
  console.log(`5. Affichage final: ${finalDisplay}`);
  
  return {
    original: formatted,
    final: finalDisplay,
    wasNormalized,
    normalized
  };
}

console.log('🧪 Test d\'affichage avec normalisation automatique');
console.log('='.repeat(60));

// Test des cas spécifiques
const testCases = [
  '008000',  // 00:80:00 → doit devenir 01:20:00
  '007500',  // 00:75:00 → doit devenir 01:15:00
  '001260',  // 00:12:60 → doit devenir 00:13:00
  '006175',  // 00:61:75 → doit devenir 01:02:15
  '002500',  // 00:25:00 → reste 00:25:00
  '010000',  // 01:00:00 → reste 01:00:00
];

console.log('\n📊 Résultats des tests:');

testCases.forEach((testCase, index) => {
  const result = simulateGoogleTimerInput(testCase);
  
  console.log(`\n${index + 1}. Cas de test: ${testCase}`);
  console.log(`   Saisie affichée: ${result.original}`);
  console.log(`   Résultat final: ${result.final}`);
  console.log(`   Status: ${result.wasNormalized ? '✨ NORMALISÉ' : '✅ Inchangé'}`);
  
  // Vérification spéciale pour le cas 00:80:00
  if (testCase === '008000') {
    if (result.final === '01:20:00') {
      console.log(`   🎯 SUCCÈS: 00:80:00 → 01:20:00 ✅`);
    } else {
      console.log(`   ❌ ÉCHEC: Attendu 01:20:00, obtenu ${result.final}`);
    }
  }
});

console.log('\n✅ Test terminé');
console.log('\n🎊 Comportement attendu:');
console.log('   📝 Utilisateur tape: 008000');
console.log('   👀 Affichage initial: 00:80:00'); 
console.log('   ⚡ Normalisation automatique');
console.log('   🎯 Affichage final: 01:20:00');
console.log('   💡 Message: "✨ Temps normalisé automatiquement !"');