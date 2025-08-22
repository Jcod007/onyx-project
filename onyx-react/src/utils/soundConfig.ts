/**
 * Configuration globale pour le son dans l'application
 */

class SoundConfig {
  private static instance: SoundConfig;
  private _enabled: boolean = true;

  static getInstance(): SoundConfig {
    if (!SoundConfig.instance) {
      SoundConfig.instance = new SoundConfig();
    }
    return SoundConfig.instance;
  }

  constructor() {
    // Charger la préférence depuis localStorage
    const saved = localStorage.getItem('onyx_sound_enabled');
    this._enabled = saved !== null ? saved === 'true' : true;
  }

  get enabled(): boolean {
    return this._enabled;
  }

  set enabled(value: boolean) {
    this._enabled = value;
    localStorage.setItem('onyx_sound_enabled', value.toString());
  }

  /**
   * Jouer un son uniquement si activé
   */
  playSound(audioElement: HTMLAudioElement | (() => void)): void {
    if (!this._enabled) return;

    if (typeof audioElement === 'function') {
      audioElement();
    } else {
      audioElement.play().catch(error => {
        console.error('Erreur lors de la lecture du son:', error);
      });
    }
  }
}

export const soundConfig = SoundConfig.getInstance();