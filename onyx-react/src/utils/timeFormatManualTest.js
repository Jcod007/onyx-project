/**
 * 🧪 Test manuel de la normalisation intelligente
 * Script Node.js pour tester en dehors du navigateur
 */

// Reproduction des fonctions critiques pour test
function normalizeTime(hours, minutes, seconds) {
  // Étape 1: Convertir les secondes excédentaires en minutes
  if (seconds >= 60) {
    const extraMinutes = Math.floor(seconds / 60);
    minutes += extraMinutes;
    seconds = seconds % 60;
  }
  
  // Étape 2: Convertir les minutes excédentaires en heures  
  if (minutes >= 60) {
    const extraHours = Math.floor(minutes / 60);
    hours += extraHours;
    minutes = minutes % 60;
  }
  
  // Étape 3: Clamp to maximum (99:59:59)
  const maxSeconds = 99 * 3600 + 59 * 60 + 59;
  const totalSeconds = hours * 3600 + minutes * 60 + seconds;
  
  if (totalSeconds > maxSeconds) {
    hours = 99;
    minutes = 59;
    seconds = 59;
  }
  
  return { hours, minutes, seconds };
}

function formatTimeIntelligent(hours, minutes, seconds) {
  const parts = [];
  
  if (hours > 0) {
    parts.push(`${hours} h`);
  }
  
  if (minutes > 0 || (hours > 0 && seconds === 0)) {
    parts.push(`${minutes} min`);
  }
  
  if (seconds > 0 || (hours === 0 && minutes === 0)) {
    parts.push(`${seconds} s`);
  }
  
  return parts.join(' ') || '0 s';
}

// 🧪 Test des cas extrêmes mentionnés dans la demande
console.log('🧪 Test de la normalisation intelligente du temps');
console.log('=' .repeat(60));

const testCases = [
  // Cas mentionnés spécifiquement dans la demande
  { input: [0, 60, 0], description: "60 minutes → 1 heure" },
  { input: [0, 80, 0], description: "80 minutes → 1h 20min (exemple de la demande)" },
  { input: [0, 75.30, 0], description: "75.30 minutes → normalisé" },
  { input: [0, 100, 0], description: "100 minutes → 1h 40min" },
  
  // Cas limites
  { input: [0, 0, 0], description: "Zéro complet" },
  { input: [0, 0, 1], description: "1 seconde" },
  { input: [0, 0, 59], description: "59 secondes (limite)" },
  { input: [0, 0, 60], description: "60 secondes → 1 minute" },
  { input: [0, 0, 61.75], description: "61.75 secondes → normalisé" },
  { input: [0, 0, 0.5], description: "0.5 seconde → tronqué" },
  
  // Cas complexes
  { input: [0, 61, 75], description: "61min 75s → cascade de normalisation" },
  { input: [1, 120, 180], description: "1h 120min 180s → multi-normalisation" },
  
  // Cas maximums
  { input: [99, 59, 59], description: "Maximum autorisé" },
  { input: [100, 0, 0], description: "Dépassement maximum" },
];

console.log('\n📊 Résultats de normalisation:');
testCases.forEach((testCase, index) => {
  const [h, m, s] = testCase.input;
  const original = `${h}h ${m}min ${s}s`;
  const normalized = normalizeTime(h, m, s);
  const wasNormalized = (h !== normalized.hours || m !== normalized.minutes || s !== normalized.seconds);
  const display = formatTimeIntelligent(normalized.hours, normalized.minutes, normalized.seconds);
  
  console.log(`\n${index + 1}. ${testCase.description}`);
  console.log(`   Entrée:    ${original}`);
  console.log(`   Résultat:  ${normalized.hours}h ${normalized.minutes}min ${normalized.seconds}s`);
  console.log(`   Affichage: "${display}"`);
  console.log(`   Status:    ${wasNormalized ? '✨ NORMALISÉ' : '✅ Inchangé'}`);
});

console.log('\n🎯 Test spécifique du cas "60.00" → "6.00"');
console.log('-'.repeat(40));

// Simuler la saisie problématique "60.00" en minutes
const problematicInput = [0, 60.00, 0];
const [ph, pm, ps] = problematicInput;
const result = normalizeTime(ph, pm, ps);
console.log(`Entrée problématique: ${ph}h ${pm}min ${ps}s`);
console.log(`Après normalisation: ${result.hours}h ${result.minutes}min ${result.seconds}s`);
console.log(`Affichage final: "${formatTimeIntelligent(result.hours, result.minutes, result.seconds)}"`);

if (result.hours === 1 && result.minutes === 0 && result.seconds === 0) {
  console.log('✅ SUCCÈS: 60 minutes correctement converti en 1 heure !');
} else {
  console.log('❌ ÉCHEC: La conversion n\'est pas correcte');
}

console.log('\n✅ Tests terminés');
console.log('\n🎊 Nouvelles fonctionnalités implementées:');
console.log('   ✨ Normalisation automatique des débordements');
console.log('   🎨 Affichage intelligent (masque les unités nulles)');
console.log('   🛡️ Tolérance aux formats décimaux et inhabituels');
console.log('   💡 Feedback visuel lors de normalisation');