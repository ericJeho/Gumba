'use client';

import { useEffect, useRef, useState } from 'react';
import { Circle, Download, Mic, Square, Trash2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { downloadBlob } from '@/daw/export';
import { formatClock } from '@/lib/format';

/**
 * Microphone recording.
 *
 * Uses MediaRecorder for capture and a live analyser for the input meter, so
 * you can set a level before committing to a take. Recordings stay in the
 * browser — nothing is uploaded anywhere, which the panel states plainly
 * because "where does my voice go?" is a fair question to have about a free
 * tool.
 *
 * Takes are held as object URLs and played back through a plain <audio>
 * element. They are deliberately not written into the project: PCM is
 * megabytes, and localStorage would be full after one vocal.
 */

type Take = { id: string; url: string; blob: Blob; seconds: number; at: string };

export function Recorder() {
  const [permission, setPermission] = useState<'idle' | 'granted' | 'denied'>('idle');
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [takes, setTakes] = useState<Take[]>([]);
  const [error, setError] = useState<string | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const meterRef = useRef<HTMLDivElement>(null);
  const contextRef = useRef<AudioContext | null>(null);
  const startedRef = useRef(0);

  // Revoking on unmount, or the object URLs leak for the page's lifetime.
  useEffect(() => {
    return () => {
      for (const take of takes) URL.revokeObjectURL(take.url);
      streamRef.current?.getTracks().forEach((track) => track.stop());
      void contextRef.current?.close();
    };
    // Intentionally empty: this is a teardown that must run once, at unmount,
    // over whatever takes exist by then.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!recording) return;
    const timer = window.setInterval(() => setElapsed((Date.now() - startedRef.current) / 1000), 100);
    return () => window.clearInterval(timer);
  }, [recording]);

  const arm = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          // Off by default: these are tuned for speech and audibly damage a
          // sung take or an instrument.
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      streamRef.current = stream;
      setPermission('granted');

      const context = new AudioContext();
      contextRef.current = context;

      const source = context.createMediaStreamSource(stream);
      const analyser = context.createAnalyser();
      analyser.fftSize = 1024;
      source.connect(analyser);

      const data = new Uint8Array(analyser.fftSize);
      const tick = () => {
        if (!contextRef.current) return;
        analyser.getByteTimeDomainData(data);

        let sum = 0;
        for (let i = 0; i < data.length; i += 1) {
          const sample = (data[i]! - 128) / 128;
          sum += sample * sample;
        }

        const rms = Math.sqrt(sum / data.length);
        if (meterRef.current) meterRef.current.style.width = `${Math.min(100, rms * 260)}%`;
        window.requestAnimationFrame(tick);
      };
      tick();
    } catch {
      setPermission('denied');
      setError('Microphone access was refused. Allow it in your browser settings to record.');
    }
  };

  const start = () => {
    const stream = streamRef.current;
    if (!stream) return;

    chunksRef.current = [];
    // webm/opus is the broadly supported MediaRecorder format; leaving the type
    // unset lets the browser pick whatever it actually supports.
    const recorder = new MediaRecorder(stream);

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
      const seconds = (Date.now() - startedRef.current) / 1000;

      setTakes((current) => [
        {
          id: `take-${Date.now()}`,
          url: URL.createObjectURL(blob),
          blob,
          seconds,
          at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
        ...current,
      ]);
    };

    recorderRef.current = recorder;
    startedRef.current = Date.now();
    setElapsed(0);
    recorder.start();
    setRecording(true);
  };

  const stop = () => {
    recorderRef.current?.stop();
    setRecording(false);
  };

  return (
    <section aria-label="Recorder" className="rounded-panel border border-line bg-surface/50">
      <header className="flex items-center gap-2 border-b border-line px-4 py-3">
        <Mic className="size-4 text-brand" aria-hidden />
        <h2 className="font-display text-sm font-medium uppercase tracking-widest text-ink-subtle">
          Record
        </h2>
      </header>

      <div className="space-y-4 p-4">
        {permission !== 'granted' ? (
          <>
            <p className="text-sm text-ink-muted">
              Record vocals or an instrument straight into the browser. Nothing is uploaded — takes
              stay on your machine until you download them.
            </p>
            <button
              type="button"
              onClick={() => void arm()}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand py-2.5 text-sm font-medium text-canvas transition-all hover:brightness-110"
            >
              <Mic className="size-4" />
              Enable microphone
            </button>
          </>
        ) : (
          <>
            <div>
              <div className="mb-1.5 flex items-center justify-between text-xs text-ink-subtle">
                <span>Input level</span>
                <span className="font-mono tabular-nums">{formatClock(elapsed)}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-line">
                <div
                  ref={meterRef}
                  className="h-full rounded-full bg-gradient-to-r from-success via-warning to-danger transition-[width] duration-75"
                  style={{ width: '0%' }}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => (recording ? stop() : start())}
              className={cn(
                'flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-all',
                recording
                  ? 'bg-danger text-canvas'
                  : 'border border-danger/50 text-danger hover:bg-danger/10',
              )}
            >
              {recording ? <Square className="size-4" /> : <Circle className="size-4 fill-current" />}
              {recording ? 'Stop' : 'Record'}
            </button>
          </>
        )}

        {error ? (
          <p role="alert" className="rounded-lg bg-danger/10 px-3 py-2 text-xs text-danger">
            {error}
          </p>
        ) : null}

        {takes.length > 0 ? (
          <ul className="space-y-2 border-t border-line pt-4">
            {takes.map((take, index) => (
              <li key={take.id} className="rounded-xl border border-line p-3">
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="font-medium">
                    Take {takes.length - index}
                    <span className="ml-2 font-normal text-ink-subtle">
                      {formatClock(take.seconds)} · {take.at}
                    </span>
                  </span>

                  <span className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => downloadBlob(take.blob, `take-${takes.length - index}.webm`)}
                      aria-label={`Download take ${takes.length - index}`}
                      className="rounded p-1.5 text-ink-subtle transition-colors hover:text-brand"
                    >
                      <Download className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        URL.revokeObjectURL(take.url);
                        setTakes((current) => current.filter((entry) => entry.id !== take.id));
                      }}
                      aria-label={`Delete take ${takes.length - index}`}
                      className="rounded p-1.5 text-ink-subtle transition-colors hover:text-danger"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </span>
                </div>

                <audio controls src={take.url} className="mt-2 w-full" />
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
