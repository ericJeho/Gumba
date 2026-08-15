'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AudioEngine } from '@/daw/engine';
import { downloadBlob, encodeWav, renderProject, safeFilename } from '@/daw/export';
import {
  DEFAULT_MASTER,
  STEPS_PER_BAR,
  createTrack,
  uid,
  type InstrumentId,
  type MasterChain,
  type Note,
  type Project,
  type Track,
  type TrackEffects,
} from '@/daw/types';
import {
  drumRoles,
  generate808,
  generateDrums,
  progressionRoots,
  rootsFromNotes,
} from '@/daw/generate';
import type { Kit } from '@/daw/samples';

/**
 * Project state and the engine binding.
 *
 * The engine is a mutable object living in a ref; the project is immutable
 * React state. Every project change is pushed into the engine by an effect,
 * which keeps a single source of truth and means the audio graph can never
 * disagree with what is on screen.
 *
 * Undo is a bounded stack of whole project snapshots. Projects here are a few
 * kilobytes of JSON, so snapshotting is far simpler than a command log and the
 * memory cost is irrelevant.
 */

const STORAGE_KEY = 'gumba-project';
const UNDO_LIMIT = 40;

function starterProject(): Project {
  const kick = createTrack('kick');
  const snare = createTrack('snare');
  const hat = createTrack('hat');
  const bass = createTrack('bass');
  const keys = createTrack('keys');

  // A four-bar sketch that plays the moment the studio opens. An empty grid is
  // the fastest way to lose someone who has never used a DAW.
  kick.notes = generateDrums('Trap', 'kick', 4, 7);
  snare.notes = generateDrums('Trap', 'snare', 4, 11);
  hat.notes = generateDrums('Trap', 'hat', 4, 13);

  bass.notes = [0, 1, 2, 3].flatMap((bar) => {
    const roots = [45, 41, 43, 40];
    return [
      {
        id: uid('n'),
        step: bar * STEPS_PER_BAR,
        length: 6,
        pitch: roots[bar]! - 12,
        velocity: 0.9,
      },
      {
        id: uid('n'),
        step: bar * STEPS_PER_BAR + 10,
        length: 4,
        pitch: roots[bar]! - 12,
        velocity: 0.7,
      },
    ];
  });

  keys.notes = [0, 1, 2, 3].flatMap((bar) => {
    const chords = [
      [69, 72, 76],
      [65, 69, 72],
      [67, 71, 74],
      [64, 67, 71],
    ];
    return chords[bar]!.map((pitch) => ({
      id: uid('n'),
      step: bar * STEPS_PER_BAR,
      length: 14,
      pitch,
      velocity: 0.5,
    }));
  });

  keys.effects = { ...keys.effects, reverb: 0.28, delay: 0.12 };
  bass.effects = { ...bass.effects, compress: 0.4 };

  return {
    version: 1,
    name: 'Untitled sketch',
    bpm: 140,
    swing: 0,
    bars: 4,
    tracks: [kick, snare, hat, bass, keys],
    master: { ...DEFAULT_MASTER },
  };
}

type StoreValue = {
  project: Project;
  engine: AudioEngine | null;
  playing: boolean;
  step: number;
  metronome: boolean;
  selectedTrackId: string;
  exporting: boolean;
  canUndo: boolean;
  canRedo: boolean;

  setProject: (updater: (project: Project) => Project, options?: { history?: boolean }) => void;
  selectTrack: (id: string) => void;
  togglePlay: () => void;
  stop: () => void;
  setMetronome: (on: boolean) => void;

  addTrack: (instrument: InstrumentId) => void;
  removeTrack: (id: string) => void;
  updateTrack: (id: string, patch: Partial<Track>) => void;
  updateEffects: (id: string, patch: Partial<TrackEffects>) => void;
  setNotes: (id: string, notes: Note[]) => void;
  toggleStep: (trackId: string, step: number, pitch?: number) => void;

  setMaster: (patch: Partial<MasterChain>) => void;
  preview: (trackId: string, pitch: number) => void;
  /** Auditions an instrument that has no channel yet — the sample library. */
  previewInstrument: (instrument: InstrumentId, pitch: number) => void;
  /** Adds a channel at a set pitch, optionally with notes already in it. */
  addChannel: (instrument: InstrumentId, options?: { name?: string; notes?: Note[] }) => void;
  /** Replaces the project with a genre starting point. */
  loadKit: (kit: Kit) => void;

  undo: () => void;
  redo: () => void;
  newProject: () => void;
  exportWav: () => Promise<void>;
  exportJson: () => void;
  importJson: (file: File) => Promise<void>;
};

const StoreContext = createContext<StoreValue | null>(null);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [project, setProjectState] = useState<Project>(starterProject);
  const [playing, setPlaying] = useState(false);
  const [step, setStep] = useState(0);
  const [metronome, setMetronome] = useState(false);
  const [selectedTrackId, setSelectedTrackId] = useState('');
  const [exporting, setExporting] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const engineRef = useRef<AudioEngine | null>(null);
  const undoStack = useRef<Project[]>([]);
  const redoStack = useRef<Project[]>([]);
  const [historyVersion, setHistoryVersion] = useState(0);

  /** Restores the last session. Deferred to an effect so SSR markup matches. */
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Project;
        if (parsed?.version === 1 && Array.isArray(parsed.tracks)) setProjectState(parsed);
      }
    } catch {
      // A corrupt entry should cost the last session, not the whole studio.
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (selectedTrackId) return;

    // The piano roll follows the selection, and a drum channel is played from
    // the step grid rather than written note by note — opening on one shows an
    // empty roll for a channel that already has a pattern. Start on the first
    // melodic channel instead, falling back to whatever exists.
    const melodic = project.tracks.find((track) => track.kind !== 'drum');
    const first = melodic ?? project.tracks[0];
    if (first) setSelectedTrackId(first.id);
  }, [hydrated, project.tracks, selectedTrackId]);

  /** Autosave, debounced — every keystroke on the name field must not hit disk. */
  useEffect(() => {
    if (!hydrated) return;

    const timer = window.setTimeout(() => {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
      } catch {
        // Quota exceeded or private mode: the session still works in memory.
      }
    }, 600);

    return () => window.clearTimeout(timer);
  }, [project, hydrated]);

  const setProject = useCallback(
    (updater: (current: Project) => Project, options?: { history?: boolean }) => {
      setProjectState((current) => {
        if (options?.history !== false) {
          undoStack.current.push(current);
          if (undoStack.current.length > UNDO_LIMIT) undoStack.current.shift();
          redoStack.current = [];
          setHistoryVersion((value) => value + 1);
        }
        return updater(current);
      });
    },
    [],
  );

  /* ---------------------------------------------------------------------- */
  /* Engine                                                                  */
  /* ---------------------------------------------------------------------- */

  const ensureEngine = useCallback(async () => {
    if (!engineRef.current) {
      engineRef.current = new AudioEngine();
      engineRef.current.onStep = (value) => setStep(value);
    }
    await engineRef.current.resume();
    return engineRef.current;
  }, []);

  // Keep the audio graph in step with the project on every change.
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;

    const anySoloed = project.tracks.some((track) => track.soloed);
    for (const track of project.tracks) engine.syncTrack(track, anySoloed);
    engine.setMaster(project.master);
  }, [project]);

  // Restart the scheduler when tempo, swing or length change mid-playback, so
  // a tempo drag takes effect immediately rather than at the next loop.
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine || !playing) return;
    engine.start(project, step, metronome);
    // Only the transport-shaping fields belong here; re-running on every note
    // edit would retrigger the scheduler on each click of the grid.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.bpm, project.swing, project.bars, metronome]);

  useEffect(() => {
    return () => {
      engineRef.current?.dispose();
      engineRef.current = null;
    };
  }, []);

  const togglePlay = useCallback(() => {
    void (async () => {
      const engine = await ensureEngine();

      const anySoloed = project.tracks.some((track) => track.soloed);
      for (const track of project.tracks) engine.syncTrack(track, anySoloed);
      engine.setMaster(project.master);

      if (playing) {
        engine.stop();
        setPlaying(false);
      } else {
        engine.start(project, step, metronome);
        setPlaying(true);
      }
    })();
  }, [ensureEngine, metronome, playing, project, step]);

  const stop = useCallback(() => {
    engineRef.current?.stop();
    setPlaying(false);
    setStep(0);
  }, []);

  const preview = useCallback(
    (trackId: string, pitch: number) => {
      void (async () => {
        const engine = await ensureEngine();
        const track = project.tracks.find((entry) => entry.id === trackId);
        if (!track) return;

        engine.syncTrack(track, false);
        engine.preview(track, pitch);
      })();
    },
    [ensureEngine, project.tracks],
  );

  /**
   * Auditions an instrument with no channel of its own.
   *
   * The sample library needs to make a sound before you commit to a channel,
   * so this plays the voice straight into the master bus, bypassing the mixer
   * entirely — there is no strip to route it through yet.
   */
  const previewInstrument = useCallback(
    (instrument: InstrumentId, pitch: number) => {
      void (async () => {
        const engine = await ensureEngine();
        engine.previewInstrument(instrument, pitch);
      })();
    },
    [ensureEngine],
  );

  /* ---------------------------------------------------------------------- */
  /* Editing                                                                 */
  /* ---------------------------------------------------------------------- */

  const addTrack = useCallback(
    (instrument: InstrumentId) => {
      const track = createTrack(instrument);
      setProject((current) => ({ ...current, tracks: [...current.tracks, track] }));
      setSelectedTrackId(track.id);
    },
    [setProject],
  );

  const addChannel = useCallback(
    (instrument: InstrumentId, options?: { name?: string; notes?: Note[] }) => {
      const track = createTrack(instrument, options?.name);
      if (options?.notes) track.notes = options.notes;

      setProject((current) => ({ ...current, tracks: [...current.tracks, track] }));
      setSelectedTrackId(track.id);
    },
    [setProject],
  );

  /**
   * Loads a genre kit over the current project.
   *
   * Tempo and swing come with it, because they are as much a part of a genre as
   * the pattern is — a dembow at 140 straight is not dancehall. The project
   * name is left alone: overwriting what somebody called their track while
   * they are auditioning kits is the kind of small theft that makes a tool feel
   * careless.
   */
  const loadKit = useCallback(
    (kit: Kit) => {
      setProject((current) => {
        const bars = current.bars;
        const seed = Math.floor(Math.random() * 1e9);

        const drums = drumRoles(kit.drumStyle).map((role, index) => {
          const track = createTrack(role as InstrumentId);
          track.notes = generateDrums(kit.drumStyle, role, bars, seed + index);
          return track;
        });

        const tracks: Track[] = [...drums];

        if (kit.bass808) {
          // Follow whatever harmony is already in the project; only invent a
          // progression when there is nothing to follow.
          const chords = current.tracks.filter((track) => track.kind === 'synth');
          const existing = chords.flatMap((track) => track.notes);
          const followed = existing.length ? rootsFromNotes(existing, bars) : null;

          const roots =
            followed && followed.some((value) => value !== null)
              ? followed
              : progressionRoots({ root: 33, scale: 'minor', style: 'Trap / dark', bars, seed });

          const track = createTrack('808');
          track.notes = generate808({ roots, bars, pattern: kit.bass808, seed, glide: true });
          tracks.push(track);
        }

        for (const instrument of kit.extras) tracks.push(createTrack(instrument));

        return { ...current, bpm: kit.bpm, swing: kit.swing, tracks };
      });

      setSelectedTrackId('');
    },
    [setProject],
  );

  const removeTrack = useCallback(
    (id: string) => {
      engineRef.current?.removeTrack(id);
      setProject((current) => ({
        ...current,
        tracks: current.tracks.filter((track) => track.id !== id),
      }));
    },
    [setProject],
  );

  const updateTrack = useCallback(
    (id: string, patch: Partial<Track>) => {
      // Mixer moves are continuous drags; recording every frame would fill the
      // undo stack with hundreds of one-pixel fader steps.
      const isContinuous = 'volume' in patch || 'pan' in patch;
      setProject(
        (current) => ({
          ...current,
          tracks: current.tracks.map((track) => (track.id === id ? { ...track, ...patch } : track)),
        }),
        { history: !isContinuous },
      );
    },
    [setProject],
  );

  const updateEffects = useCallback(
    (id: string, patch: Partial<TrackEffects>) => {
      setProject(
        (current) => ({
          ...current,
          tracks: current.tracks.map((track) =>
            track.id === id ? { ...track, effects: { ...track.effects, ...patch } } : track,
          ),
        }),
        { history: false },
      );
    },
    [setProject],
  );

  const setNotes = useCallback(
    (id: string, notes: Note[]) => {
      setProject((current) => ({
        ...current,
        tracks: current.tracks.map((track) => (track.id === id ? { ...track, notes } : track)),
      }));
    },
    [setProject],
  );

  const toggleStep = useCallback(
    (trackId: string, targetStep: number, pitch?: number) => {
      setProject((current) => ({
        ...current,
        tracks: current.tracks.map((track) => {
          if (track.id !== trackId) return track;

          const existing = track.notes.find(
            (note) =>
              note.step === targetStep && (pitch === undefined || note.pitch === pitch),
          );

          if (existing) {
            return { ...track, notes: track.notes.filter((note) => note.id !== existing.id) };
          }

          return {
            ...track,
            notes: [
              ...track.notes,
              {
                id: uid('n'),
                step: targetStep,
                length: 1,
                pitch: pitch ?? 36,
                velocity: 0.9,
              },
            ],
          };
        }),
      }));
    },
    [setProject],
  );

  const setMaster = useCallback(
    (patch: Partial<MasterChain>) => {
      setProject((current) => ({ ...current, master: { ...current.master, ...patch } }), {
        history: false,
      });
    },
    [setProject],
  );

  /* ---------------------------------------------------------------------- */
  /* History and files                                                       */
  /* ---------------------------------------------------------------------- */

  const undo = useCallback(() => {
    const previous = undoStack.current.pop();
    if (!previous) return;

    setProjectState((current) => {
      redoStack.current.push(current);
      return previous;
    });
    setHistoryVersion((value) => value + 1);
  }, []);

  const redo = useCallback(() => {
    const next = redoStack.current.pop();
    if (!next) return;

    setProjectState((current) => {
      undoStack.current.push(current);
      return next;
    });
    setHistoryVersion((value) => value + 1);
  }, []);

  const newProject = useCallback(() => {
    const fresh: Project = {
      version: 1,
      name: 'Untitled sketch',
      bpm: 120,
      swing: 0,
      bars: 4,
      tracks: [createTrack('kick'), createTrack('snare'), createTrack('hat')],
      master: { ...DEFAULT_MASTER },
    };
    setProject(() => fresh);
    setSelectedTrackId(fresh.tracks[0]!.id);
  }, [setProject]);

  const exportWav = useCallback(async () => {
    setExporting(true);
    try {
      const buffer = await renderProject(project);
      downloadBlob(encodeWav(buffer), safeFilename(project.name, 'wav'));
    } finally {
      setExporting(false);
    }
  }, [project]);

  const exportJson = useCallback(() => {
    const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
    downloadBlob(blob, safeFilename(project.name, 'json'));
  }, [project]);

  const importJson = useCallback(
    async (file: File) => {
      const parsed = JSON.parse(await file.text()) as Project;
      if (parsed?.version !== 1 || !Array.isArray(parsed.tracks)) {
        throw new Error('That does not look like a project file.');
      }
      setProject(() => parsed);
      setSelectedTrackId(parsed.tracks[0]?.id ?? '');
    },
    [setProject],
  );

  /** Transport and edit shortcuts, ignored while typing. */
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('input, textarea, select, [contenteditable="true"]')) return;

      if (event.code === 'Space') {
        event.preventDefault();
        togglePlay();
      } else if (event.key.toLowerCase() === 'z' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [redo, togglePlay, undo]);

  const value = useMemo<StoreValue>(
    () => ({
      project,
      engine: engineRef.current,
      playing,
      step,
      metronome,
      selectedTrackId,
      exporting,
      canUndo: undoStack.current.length > 0,
      canRedo: redoStack.current.length > 0,
      setProject,
      selectTrack: setSelectedTrackId,
      togglePlay,
      stop,
      setMetronome,
      addTrack,
      removeTrack,
      updateTrack,
      updateEffects,
      setNotes,
      toggleStep,
      setMaster,
      preview,
      previewInstrument,
      addChannel,
      loadKit,
      undo,
      redo,
      newProject,
      exportWav,
      exportJson,
      importJson,
    }),
    // historyVersion is not read here, but changing it is what re-publishes
    // canUndo/canRedo, which are derived from mutable refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      project,
      playing,
      step,
      metronome,
      selectedTrackId,
      exporting,
      historyVersion,
      setProject,
      togglePlay,
      stop,
      addTrack,
      removeTrack,
      updateTrack,
      updateEffects,
      setNotes,
      toggleStep,
      setMaster,
      preview,
      previewInstrument,
      addChannel,
      loadKit,
      undo,
      redo,
      newProject,
      exportWav,
      exportJson,
      importJson,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useProject(): StoreValue {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useProject must be used inside <ProjectProvider>');
  return context;
}
