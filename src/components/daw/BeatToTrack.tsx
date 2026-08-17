'use client';

import { useEffect, useRef, useState } from 'react';
import { Circle, Loader2, Mic, Square, Upload, Wand2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useProject } from '@/daw/store';
import { analyse, type Analysis } from '@/daw/analyse';
import { SECTIONS, TOTAL_BARS, arrange } from '@/daw/arrange';
import { formatClock } from '@/lib/format';

/**
 * Beat imitation to finished instrumental.
 *
 * Record yourself beatboxing, tapping or humming, and this reads the rhythm and
 * the pitches out of the audio and builds an arrangement from them.
 *
 * It is signal processing rather than a model, which matters for what it can
 * promise: it cannot invent a part, so it never wanders off into a melody you
 * did not perform. It also runs entirely on your machine — your voice is never
 * uploaded, which is the honest reason a free tool can offer this at all.
 */

type Stage = 'idle' | 'armed' | 'recording' | 'analysing' | 'done';

const TEMPO_RANGE = { min: 96, max: 104 };

export function BeatToTrack() {
  const { setProject, selectTrack } = useProject();

  const [stage, setStage] = useState<Stage>('idle');
  const [elapsed, setElapsed] = useState(0);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const contextRef = useRef<AudioContext | null>(null);
  const meterRef = useRef<HTMLDivElement>(null);
  const startedRef = useRef(0);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      void contextRef.current?.close();
    };
  }, []);

  useEffect(() => {
    if (stage !== 'recording') return;
    const timer = window.setInterval(() => setElapsed((Date.now() - startedRef.current) / 1000), 100);
    return () => window.clearInterval(timer);
  }, [stage]);

  const arm = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          // All three are tuned for speech on a call. Noise suppression in
          // particular eats the very transients this feature has to detect,
          // and gain control flattens the accents that become velocities.
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      streamRef.current = stream;

      const context = new AudioContext();
      contextRef.current = context;

      const source = context.createMediaStreamSource(stream);
      const meter = context.createAnalyser();
      meter.fftSize = 1024;
      source.connect(meter);

      const data = new Uint8Array(meter.fftSize);
      const tick = () => {
        if (!contextRef.current) return;
        meter.getByteTimeDomainData(data);

        let sum = 0;
        for (let i = 0; i < data.length; i += 1) {
          const sample = (data[i]! - 128) / 128;
          sum += sample * sample;
        }

        if (meterRef.current) {
          meterRef.current.style.width = `${Math.min(100, Math.sqrt(sum / data.length) * 260)}%`;
        }
        window.requestAnimationFrame(tick);
      };
      tick();

      setStage('armed');
    } catch {
      setError('Microphone access was refused. Allow it in your browser settings to record.');
    }
  };

  const runAnalysis = async (blob: Blob) => {
    setStage('analysing');
    setError(null);

    try {
      const context = contextRef.current ?? new AudioContext();
      contextRef.current = context;

      const buffer = await context.decodeAudioData(await blob.arrayBuffer());
      const result = analyse(buffer, TEMPO_RANGE);

      if (result.onsets.length < 4) {
        setError(
          'Not enough hits to read a rhythm from. Try four bars of a steady pattern, close to the microphone.',
        );
        setStage(streamRef.current ? 'armed' : 'idle');
        return;
      }

      setAnalysis(result);
      setStage('done');
    } catch {
      setError('That recording could not be decoded. Try a WAV, MP3, M4A or WebM file.');
      setStage(streamRef.current ? 'armed' : 'idle');
    }
  };

  const start = () => {
    const stream = streamRef.current;
    if (!stream) return;

    chunksRef.current = [];
    const recorder = new MediaRecorder(stream);
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };
    recorder.onstop = () => {
      void runAnalysis(new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' }));
    };

    recorderRef.current = recorder;
    startedRef.current = Date.now();
    setElapsed(0);
    setAnalysis(null);
    recorder.start();
    setStage('recording');
  };

  const build = () => {
    if (!analysis) return;

    const project = arrange({ analysis, name: 'From my beat' });
    setProject(() => project);
    selectTrack('');
  };

  return (
    <section aria-label="Beat to track" className="rounded-panel border border-line bg-surface/50">
      <header className="flex items-center gap-2 border-b border-line px-4 py-3">
        <Wand2 className="size-4 text-brand" aria-hidden />
        <h2 className="font-display text-sm font-medium uppercase tracking-widest text-ink-subtle">
          Beat → track
        </h2>
      </header>

      <div className="space-y-4 p-4">
        <p className="text-sm leading-relaxed text-ink-muted">
          Beatbox, tap or hum your idea. This reads the rhythm and the pitches out of the recording
          and builds a full arrangement from them — Afro-fusion, dancehall and trap, in A natural
          minor.
        </p>

        {stage === 'idle' ? (
          <button
            type="button"
            onClick={() => void arm()}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand py-2.5 text-sm font-medium text-canvas transition-all hover:brightness-110"
          >
            <Mic className="size-4" />
            Enable microphone
          </button>
        ) : null}

        {stage === 'armed' || stage === 'recording' ? (
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
              onClick={() => {
                if (stage === 'recording') {
                  recorderRef.current?.stop();
                  setStage('analysing');
                } else {
                  start();
                }
              }}
              className={cn(
                'flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-all',
                stage === 'recording'
                  ? 'bg-danger text-canvas'
                  : 'border border-danger/50 text-danger hover:bg-danger/10',
              )}
            >
              {stage === 'recording' ? (
                <Square className="size-4" />
              ) : (
                <Circle className="size-4 fill-current" />
              )}
              {stage === 'recording' ? 'Stop and analyse' : 'Record your beat'}
            </button>

            <p className="text-xs leading-relaxed text-ink-subtle">
              Four bars of a steady pattern is plenty. Keep a clear difference between your kick,
              snare and hat sounds — that difference is what the classifier reads.
            </p>
          </>
        ) : null}

        {stage === 'analysing' ? (
          <p role="status" className="flex items-center gap-2 text-sm text-ink-muted">
            <Loader2 className="size-4 animate-spin text-brand" aria-hidden />
            Reading the rhythm…
          </p>
        ) : null}

        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-line py-2 text-sm text-ink-muted transition-colors hover:border-brand hover:text-brand">
          <Upload className="size-4" />
          Or use an audio file
          <input
            type="file"
            accept="audio/*"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void runAnalysis(file);
              event.target.value = '';
            }}
          />
        </label>

        {error ? (
          <p role="alert" className="rounded-lg bg-danger/10 px-3 py-2 text-xs text-danger">
            {error}
          </p>
        ) : null}

        {analysis ? (
          <div className="space-y-3 rounded-xl border border-brand/40 bg-brand/[0.05] p-3">
            <h3 className="text-sm font-medium">What it heard</h3>

            <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
              <dt className="text-ink-subtle">Tempo</dt>
              <dd className="text-right font-mono">{analysis.bpm} BPM</dd>

              <dt className="text-ink-subtle">Hits</dt>
              <dd className="text-right font-mono">{analysis.onsets.length}</dd>

              <dt className="text-ink-subtle">Kick / snare / hat</dt>
              <dd className="text-right font-mono">
                {analysis.counts.kick} / {analysis.counts.snare} / {analysis.counts.hat}
              </dd>

              <dt className="text-ink-subtle">Hummed notes</dt>
              <dd className="text-right font-mono">{analysis.pitches.length}</dd>

              <dt className="text-ink-subtle">Swing</dt>
              <dd className="text-right font-mono">{Math.round(analysis.swing * 100)}%</dd>

              <dt className="text-ink-subtle">Timing confidence</dt>
              <dd className="text-right font-mono">{Math.round(analysis.confidence * 100)}%</dd>
            </dl>

            {analysis.confidence < 0.4 ? (
              <p className="text-[0.7rem] leading-relaxed text-warning">
                The hits did not agree strongly on one tempo, so {analysis.bpm} BPM is a best guess.
                It will still build — you can drag the tempo afterwards.
              </p>
            ) : null}

            {analysis.pitches.length === 0 ? (
              <p className="text-[0.7rem] leading-relaxed text-ink-subtle">
                No pitch found, so this will be built as a rhythm arrangement. Hum a line over your
                beat and it becomes the lead.
              </p>
            ) : null}

            <button
              type="button"
              onClick={build}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand py-2.5 text-sm font-medium text-canvas transition-all hover:brightness-110"
            >
              <Wand2 className="size-4" />
              Build the instrumental
            </button>

            <p className="text-[0.7rem] leading-relaxed text-ink-subtle">
              Replaces your current channels with a {TOTAL_BARS}-bar arrangement:{' '}
              {SECTIONS.map((section) => section.name).join(', ')}.
            </p>
          </div>
        ) : null}

        <p className="border-t border-line pt-3 text-xs leading-relaxed text-ink-subtle">
          Your recording never leaves this browser — the analysis runs on your machine. Everything
          it writes comes from what you performed: the drums are your hits, the lead is your hum,
          the bass follows your kicks. It does not invent a melody, and it does not write chords —
          the pad holds a root and a fifth, so the harmony stays open.
        </p>
      </div>
    </section>
  );
}
