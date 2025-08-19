// Debug script to check Histoire course data
console.log('=== DEBUG HISTOIRE COURSE DATA ===');

// Check localStorage directly
const subjects = JSON.parse(localStorage.getItem('onyx_subjects') || '[]');
const histoireCourse = subjects.find(s => s.name.toLowerCase().includes('histoire'));
console.log('Histoire in localStorage:', histoireCourse);

// Check localforage storage
if (typeof localforage !== 'undefined') {
  localforage.getItem('onyx_subjects').then(data => {
    const subjects = data || [];
    const histoireCourse = subjects.find(s => s.name.toLowerCase().includes('histoire'));
    console.log('Histoire in localforage:', histoireCourse);
  });
}

// Check active timers
const timers = JSON.parse(localStorage.getItem('onyx_active_timers') || '[]');
console.log('Active timers:', timers);
console.log('Histoire-linked timers:', timers.filter(t => t.linkedSubject && t.linkedSubject.name.toLowerCase().includes('histoire')));