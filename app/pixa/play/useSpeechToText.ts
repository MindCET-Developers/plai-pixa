"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { he } from "@/lib/i18n/he";

// lib.dom has no SpeechRecognition types, so describe only what we use.
type RecognitionResult = { isFinal: boolean; 0: { transcript: string } };
type RecognitionEvent = { resultIndex: number; results: ArrayLike<RecognitionResult> };
type RecognitionErrorEvent = { error: string };

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: RecognitionEvent) => void) | null;
  onerror: ((event: RecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const subscribeNever = () => () => {};

function errorMessage(code: string) {
  if (code === "not-allowed" || code === "service-not-allowed") return he.play.dictateErrorPermission;
  if (code === "no-speech") return he.play.dictateErrorNoSpeech;
  return he.play.dictateErrorGeneric;
}

/**
 * Browser-native dictation (no server round trip, no AI cost). Final transcripts
 * are handed to `onFinal`; the caller appends them to whatever text already exists.
 */
export function useSpeechToText(onFinal: (text: string) => void) {
  // false on the server and during hydration, then the real capability on the client.
  const supported = useSyncExternalStore(
    subscribeNever,
    () => getRecognitionCtor() !== null,
    () => false,
  );
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState("");
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const onFinalRef = useRef(onFinal);

  useEffect(() => {
    onFinalRef.current = onFinal;
  }, [onFinal]);

  useEffect(() => {
    return () => recognitionRef.current?.abort();
  }, []);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const start = useCallback(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor || recognitionRef.current) return;

    const recognition = new Ctor();
    recognition.lang = "he-IL";
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      let finalText = "";
      let interimText = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        if (result.isFinal) finalText += result[0].transcript;
        else interimText += result[0].transcript;
      }
      setInterim(interimText);
      if (finalText.trim()) onFinalRef.current(finalText.trim());
    };
    recognition.onerror = (event) => setError(errorMessage(event.error));
    recognition.onend = () => {
      recognitionRef.current = null;
      setListening(false);
      setInterim("");
    };

    setError("");
    recognitionRef.current = recognition;
    try {
      recognition.start();
      setListening(true);
    } catch {
      recognitionRef.current = null;
      setError(he.play.dictateErrorGeneric);
    }
  }, []);

  const abort = useCallback(() => {
    recognitionRef.current?.abort();
  }, []);

  return { supported, listening, interim, error, start, stop, abort };
}
