/**
 * useVoice – Browser Web Speech API hook
 * TTS: window.speechSynthesis  (read aloud)
 * STT: window.SpeechRecognition (voice input)
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import apiClient from '../api/client';

const SUPPORTED = typeof window !== 'undefined';
const TTS_SUPPORTED = SUPPORTED && 'speechSynthesis' in window;
const STT_SUPPORTED =
  SUPPORTED &&
  ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

export interface UseVoiceOptions {
  /** BCP-47 language tag: 'en-US', 'hi-IN', 'mr-IN' */
  lang?: string;
  rate?: number;  // 0.1–10, default 1
  pitch?: number; // 0–2, default 1
}

export interface UseVoiceReturn {
  isSpeaking: boolean;
  isListening: boolean;
  isLoadingVoice: boolean;
  ttsSupported: boolean;
  sttSupported: boolean;
  speak: (text: string) => void;
  stopSpeaking: () => void;
  startListening: (onResult: (transcript: string) => void, onEnd?: () => void) => void;
  stopListening: () => void;
}

export function useVoice(options: UseVoiceOptions = {}): UseVoiceReturn {
  const { lang = 'en-IN', rate = 1, pitch = 1 } = options;

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isLoadingVoice, setIsLoadingVoice] = useState(false);
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (TTS_SUPPORTED) window.speechSynthesis.cancel();
      if (recognitionRef.current) recognitionRef.current.abort();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  /** Browser Fallback TTS */
  const fallbackSpeak = useCallback((text: string) => {
    if (!TTS_SUPPORTED) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = rate;
    utterance.pitch = pitch;

    const voices = window.speechSynthesis.getVoices();
    const match = voices.find((v) => v.lang.startsWith(lang.split('-')[0]));
    if (match) utterance.voice = match;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, [lang, rate, pitch]);

  /** TTS: Read text aloud */
  const speak = useCallback(
    async (text: string) => {
      if (!text) return;

      // Stop any current speech
      if (TTS_SUPPORTED) window.speechSynthesis.cancel();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setIsSpeaking(false);

      // Attempt high-quality Sarvam TTS via backend
      try {
        setIsLoadingVoice(true);
        console.log('Attempting Sarvam TTS for:', text.substring(0, 20) + '...', 'Lang:', lang);

        const response = await apiClient.post('/voice/tts', {
          text,
          language_code: lang
        });

        if (response.data.success && response.data.audio_base64) {
          console.log('Sarvam TTS success, playing audio...');
          const audioSrc = `data:audio/mpeg;base64,${response.data.audio_base64}`;
          const audio = new Audio(audioSrc);
          audioRef.current = audio;

          audio.onplay = () => {
            setIsSpeaking(true);
            setIsLoadingVoice(false);
          };
          audio.onended = () => {
            setIsSpeaking(false);
            audioRef.current = null;
          };
          audio.onerror = (e) => {
            console.error('Sarvam audio playback error:', e);
            fallbackSpeak(text);
          };

          await audio.play();
          return;
        } else {
          console.warn('Sarvam TTS backend returned failure:', response.data.error);
        }
      } catch (err) {
        console.error('Sarvam TTS API call failed:', err);
      } finally {
        setIsLoadingVoice(false);
      }

      // Fallback to browser TTS
      console.log('Falling back to browser TTS');
      fallbackSpeak(text);
    },
    [lang, fallbackSpeak]
  );

  const stopSpeaking = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (TTS_SUPPORTED) window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsLoadingVoice(false);
  }, []);

  /** STT: Listen for voice input */
  const startListening = useCallback(
    (onResult: (transcript: string) => void, onEnd?: () => void) => {
      if (!STT_SUPPORTED) return;

      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      recognition.lang = lang;
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        onResult(transcript);
      };

      recognition.onend = () => {
        setIsListening(false);
        if (onEnd) onEnd();
      };

      recognition.onerror = () => setIsListening(false);

      recognition.start();
      setIsListening(true);
    },
    [lang]
  );

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, []);

  return {
    isSpeaking,
    isListening,
    isLoadingVoice,
    ttsSupported: TTS_SUPPORTED,
    sttSupported: STT_SUPPORTED,
    speak,
    stopSpeaking,
    startListening,
    stopListening,
  };
}
