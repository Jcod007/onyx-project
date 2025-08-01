import { useRef, useEffect } from 'react';

export const useTimerSounds = (enabled: boolean = true) => {
  const workEndSoundRef = useRef<HTMLAudioElement | null>(null);
  const breakEndSoundRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (enabled) {
      // Create simple audio tones using Web Audio API since we don't have actual sound files
      workEndSoundRef.current = createBeepSound(800, 200); // Higher pitch for work end
      breakEndSoundRef.current = createBeepSound(400, 300); // Lower pitch for break end
    }
  }, [enabled]);

  const createBeepSound = (frequency: number, duration: number): HTMLAudioElement => {
    // Create a simple beep using data URL
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const sampleRate = audioContext.sampleRate;
    const numSamples = duration * sampleRate / 1000;
    const buffer = audioContext.createBuffer(1, numSamples, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < numSamples; i++) {
      data[i] = Math.sin(2 * Math.PI * frequency * i / sampleRate) * 0.3;
      // Apply fade out to avoid clicks
      if (i > numSamples * 0.8) {
        data[i] *= (numSamples - i) / (numSamples * 0.2);
      }
    }

    // Convert to WAV and create audio element
    const wavData = bufferToWav(buffer);
    const blob = new Blob([wavData], { type: 'audio/wav' });
    const audio = new Audio(URL.createObjectURL(blob));
    audio.volume = 0.5;
    return audio;
  };

  const bufferToWav = (buffer: AudioBuffer): ArrayBuffer => {
    const length = buffer.length;
    const arrayBuffer = new ArrayBuffer(44 + length * 2);
    const view = new DataView(arrayBuffer);
    const data = buffer.getChannelData(0);

    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, buffer.sampleRate, true);
    view.setUint32(28, buffer.sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, length * 2, true);

    // PCM data
    let offset = 44;
    for (let i = 0; i < length; i++) {
      const sample = Math.max(-1, Math.min(1, data[i]));
      view.setInt16(offset, sample * 0x7FFF, true);
      offset += 2;
    }

    return arrayBuffer;
  };

  const playWorkEndSound = () => {
    if (enabled && workEndSoundRef.current) {
      workEndSoundRef.current.currentTime = 0;
      workEndSoundRef.current.play().catch(console.error);
    }
  };

  const playBreakEndSound = () => {
    if (enabled && breakEndSoundRef.current) {
      breakEndSoundRef.current.currentTime = 0;
      breakEndSoundRef.current.play().catch(console.error);
    }
  };

  return {
    playWorkEndSound,
    playBreakEndSound
  };
};