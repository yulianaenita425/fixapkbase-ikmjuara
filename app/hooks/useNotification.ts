// hooks/useNotification.ts
import { useState } from 'react';

export const useNotification = () => {
  const [toast, setToast] = useState<{ show: boolean; msg: string } | null>(null);

  const playDing = () => {
    if (typeof window === 'undefined') return; // Mencegah error di server-side
    
    try {
      const context = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, context.currentTime); 
      oscillator.frequency.exponentialRampToValueAtTime(440, context.currentTime + 0.5);
      
      gainNode.gain.setValueAtTime(0.1, context.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.5);

      oscillator.connect(gainNode);
      gainNode.connect(context.destination);

      oscillator.start();
      oscillator.stop(context.currentTime + 0.5);
    } catch (e) {
      console.warn("Audio error:", e);
    }
  };

  const showNotification = (msg: string) => {
    playDing();
    setToast({ show: true, msg });
    setTimeout(() => setToast(null), 3500);
  };

  return { toast, showNotification };
};