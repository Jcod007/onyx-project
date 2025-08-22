/**
 * 🔍 Diagnostic des liaisons timer-cours
 * 
 * Utilitaire pour diagnostiquer et réparer les problèmes de liaison
 */

import { subjectService } from '@/services/subjectService';
import { integratedTimerService } from '@/services/integratedTimerService';
import { Subject } from '@/types/Subject';
import { ActiveTimer } from '@/types/ActiveTimer';

interface DiagnosticResult {
  status: 'OK' | 'WARNING' | 'ERROR';
  issues: string[];
  subjects: Subject[];
  timers: ActiveTimer[];
  orphanedSubjects: Subject[];
  orphanedTimers: ActiveTimer[];
  validLinks: Array<{ subject: Subject; timer: ActiveTimer }>;
}

export async function diagnoseLinkageIssues(): Promise<DiagnosticResult> {
  console.log('🔍 Démarrage du diagnostic des liaisons timer-cours');
  
  try {
    // Récupérer toutes les données
    const subjects = await subjectService.getAllSubjects();
    const timers = integratedTimerService.getTimers();
    
    console.log(`📊 Données récupérées: ${subjects.length} subjects, ${timers.length} timers`);
    
    const issues: string[] = [];
    const orphanedSubjects: Subject[] = [];
    const orphanedTimers: ActiveTimer[] = [];
    const validLinks: Array<{ subject: Subject; timer: ActiveTimer }> = [];
    
    // Vérifier les subjects avec linkedTimerId
    for (const subject of subjects) {
      if (subject.linkedTimerId) {
        const linkedTimer = timers.find(t => t.id === subject.linkedTimerId);
        
        if (!linkedTimer) {
          issues.push(`❌ Subject "${subject.name}" référence timer inexistant: ${subject.linkedTimerId}`);
          orphanedSubjects.push(subject);
        } else {
          // Vérifier la liaison bidirectionnelle
          if (!linkedTimer.linkedSubject || linkedTimer.linkedSubject.id !== subject.id) {
            issues.push(`⚠️ Subject "${subject.name}" lié au timer "${linkedTimer.title}" mais liaison non bidirectionnelle`);
          } else {
            validLinks.push({ subject, timer: linkedTimer });
            console.log(`✅ Liaison valide: "${subject.name}" ↔ "${linkedTimer.title}"`);
          }
        }
      }
    }
    
    // Vérifier les timers avec linkedSubject
    for (const timer of timers) {
      if (timer.linkedSubject && !timer.isEphemeral) {
        const linkedSubject = subjects.find(s => s.id === timer.linkedSubject!.id);
        
        if (!linkedSubject) {
          issues.push(`❌ Timer "${timer.title}" référence subject inexistant: ${timer.linkedSubject.id}`);
          orphanedTimers.push(timer);
        } else {
          // Vérifier la liaison bidirectionnelle
          if (linkedSubject.linkedTimerId !== timer.id) {
            issues.push(`⚠️ Timer "${timer.title}" lié au subject "${linkedSubject.name}" mais liaison non bidirectionnelle`);
          }
        }
      }
    }
    
    // Déterminer le statut global
    let status: 'OK' | 'WARNING' | 'ERROR' = 'OK';
    if (orphanedSubjects.length > 0 || orphanedTimers.length > 0) {
      status = 'ERROR';
    } else if (issues.length > 0) {
      status = 'WARNING';
    }
    
    const result: DiagnosticResult = {
      status,
      issues,
      subjects,
      timers,
      orphanedSubjects,
      orphanedTimers,
      validLinks
    };
    
    // Afficher le rapport
    console.log('\n📊 RAPPORT DE DIAGNOSTIC:');
    console.log(`Status: ${status}`);
    console.log(`Liaisons valides: ${validLinks.length}`);
    console.log(`Subjects orphelins: ${orphanedSubjects.length}`);
    console.log(`Timers orphelins: ${orphanedTimers.length}`);
    console.log(`Issues détectées: ${issues.length}`);
    
    if (issues.length > 0) {
      console.log('\n🚨 ISSUES DÉTECTÉES:');
      issues.forEach(issue => console.log(issue));
    }
    
    return result;
    
  } catch (error) {
    console.error('Erreur lors du diagnostic:', error);
    throw error;
  }
}

export async function repairLinkageIssues(): Promise<void> {
  console.log('🔧 Démarrage de la réparation des liaisons');
  
  const diagnostic = await diagnoseLinkageIssues();
  
  if (diagnostic.status === 'OK') {
    console.log('✅ Aucune réparation nécessaire');
    return;
  }
  
  try {
    // Réparer les subjects orphelins
    for (const subject of diagnostic.orphanedSubjects) {
      console.log(`🔧 Réparation subject orphelin: "${subject.name}"`);
      await subjectService.updateSubject(subject.id, {
        linkedTimerId: undefined,
        defaultTimerMode: 'quick_timer'
      });
    }
    
    // Réparer les timers orphelins
    for (const timer of diagnostic.orphanedTimers) {
      console.log(`🔧 Réparation timer orphelin: "${timer.title}"`);
      await integratedTimerService.updateTimer(timer.id, {
        linkedSubject: undefined
      });
    }
    
    console.log('✅ Réparation terminée avec succès');
    
    // Vérifier que la réparation a fonctionné
    const postRepairDiagnostic = await diagnoseLinkageIssues();
    if (postRepairDiagnostic.status === 'OK') {
      console.log('✅ Toutes les incohérences ont été corrigées');
    } else {
      console.warn('⚠️ Certaines incohérences persistent');
    }
    
  } catch (error) {
    console.error('Erreur lors de la réparation:', error);
    throw error;
  }
}

export function logLinkageState(): void {
  console.log('\n🔍 ÉTAT ACTUEL DES LIAISONS:');
  
  // Cette fonction sera appelée depuis la console du navigateur
  // pour diagnostiquer l'état en temps réel
  diagnoseLinkageIssues().then(result => {
    console.table(result.validLinks.map(link => ({
      Subject: link.subject.name,
      Timer: link.timer.title,
      SubjectId: link.subject.id,
      TimerId: link.timer.id
    })));
    
    if (result.issues.length > 0) {
      console.warn('Issues détectées:', result.issues);
    }
  });
}

// Exposer les fonctions globalement pour le debug
if (typeof window !== 'undefined') {
  (window as any).diagnoseLinkageIssues = diagnoseLinkageIssues;
  (window as any).repairLinkageIssues = repairLinkageIssues;
  (window as any).logLinkageState = logLinkageState;
}