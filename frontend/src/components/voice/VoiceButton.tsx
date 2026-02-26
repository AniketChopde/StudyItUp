/**
 * VoiceButton.tsx
 * Reusable TTS "Read Aloud" + STT "Voice Input" components.
 */
import React from 'react';
import { Volume2, VolumeX, Mic, Loader2 } from 'lucide-react';
import { useVoice } from '../../hooks/useVoice';
import type { UseVoiceOptions } from '../../hooks/useVoice';

// ---- Read Aloud Button (TTS) ----------------------------------------

interface ReadAloudButtonProps {
  text: string;
  voiceOptions?: UseVoiceOptions;
  className?: string;
}

export const ReadAloudButton: React.FC<ReadAloudButtonProps> = ({
  text,
  voiceOptions,
  className = '',
}) => {
  const { isSpeaking, isLoadingVoice, ttsSupported, speak, stopSpeaking } = useVoice(voiceOptions);

  if (!ttsSupported) return null;

  return (
    <button
      type="button"
      disabled={isLoadingVoice}
      onClick={() => (isSpeaking ? stopSpeaking() : speak(text))}
      title={isSpeaking ? 'Stop reading' : 'Read aloud'}
      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all
        ${isSpeaking
          ? 'bg-primary/10 text-primary ring-1 ring-primary/30 hover:bg-primary/20'
          : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
        } ${isLoadingVoice ? 'opacity-70 cursor-not-allowed' : ''} ${className}`}
    >
      {isLoadingVoice ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Generating...
        </>
      ) : isSpeaking ? (
        <>
          <VolumeX className="h-3.5 w-3.5" /> Stop
        </>
      ) : (
        <>
          <Volume2 className="h-3.5 w-3.5" /> Read Aloud
        </>
      )}
    </button>
  );
};

// ---- Voice Input Button (STT) ----------------------------------------

interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
  voiceOptions?: UseVoiceOptions;
  className?: string;
  label?: string;
}

export const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({
  onTranscript,
  voiceOptions,
  className = '',
  label = 'Voice Input',
}) => {
  const { isListening, sttSupported, startListening, stopListening } = useVoice(voiceOptions);

  if (!sttSupported) return null;

  const handleClick = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening(onTranscript);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      title={isListening ? 'Stop listening' : label}
      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all
        ${isListening
          ? 'bg-red-500/10 text-red-600 ring-1 ring-red-400/30 animate-pulse hover:bg-red-500/20'
          : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
        } ${className}`}
    >
      {isListening ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Listening…
        </>
      ) : (
        <>
          <Mic className="h-3.5 w-3.5" /> {label}
        </>
      )}
    </button>
  );
};
