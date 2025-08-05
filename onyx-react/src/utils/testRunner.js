/**
 * Simple test runner for coherence tests
 * Can be executed directly in the browser console
 */

// Import nécessaire pour les tests
import('./testSystemCoherence.ts').then(async (module) => {
  console.log('🚀 Début des tests de cohérence système...\n');
  
  try {
    const results = await module.runAllCoherenceTests();
    
    console.log('\n📊 RÉSULTATS FINAUX:');
    console.table(results.results);
    
    if (results.success) {
      console.log('🎉 TOUS LES TESTS ONT RÉUSSI !');
      console.log('✅ Le système Timer-Cours est entièrement cohérent');
    } else {
      console.log('⚠️ CERTAINS TESTS ONT ÉCHOUÉ');
      const failedTests = Object.entries(results.results)
        .filter(([, passed]) => !passed)
        .map(([test]) => test);
      console.log('❌ Tests échoués:', failedTests);
    }
    
    return results;
  } catch (error) {
    console.error('❌ Erreur lors de l\'exécution des tests:', error);
    return { success: false, error: error.message };
  }
});