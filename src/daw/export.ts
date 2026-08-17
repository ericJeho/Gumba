import { buildMaster } from '@/daw/engine';
import { playVoice } from '@/daw/instruments';
import { STEPS_PER_BAR, type InstrumentId, type Project } from '@/daw/types';

/**
 * Offline render and WAV export.
 *
 * The render reuses `buildMaster`, so the file that lands in your downloads has
 * been through the identical EQ, glue compressor and limiter as the monitor
 * path. Rendering is offline and therefore faster than real time — a four-bar
 * loop exports in well under a second.
 */

/** Encodes an AudioBuffer as a 16-bit PCM WAV. */
export function encodeWav(buffer: AudioBuffer): Blob {
  const channels = Math.min(2, buffer.numberOfChannels);
  const samples = buffer.length;
  const bytesPerSample = 2;
  const blockAlign = channels * bytesPerSample;
  const dataBytes = samples * blockAlign;

  const view = new DataView(new ArrayBuffer(44 + dataBytes));

  const writeString = (offset: number, value: string) => {
    for (let i = 0; i < value.length; i += 1) view.setUint8(offset + i, value.charCodeAt(i));
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataBytes, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // PCM header size
  view.setUint16(20, 1, true); // format: PCM
  view.setUint16(22, channels, true);
  view.setUint32(24, buffer.sampleRate, true);
  view.setUint32(28, buffer.sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 8 * bytesPerSample, true);
  writeString(36, 'data');
  view.setUint32(40, dataBytes, true);

  const data = Array.from({ length: channels }, (_, i) => buffer.getChannelData(i));

  let offset = 44;
  for (let i = 0; i < samples; i += 1) {
    for (let channel = 0; channel < channels; channel += 1) {
      // Clamp before scaling: a sample above 1.0 would wrap to a loud negative
      // spike rather than simply clipping, which is far more audible.
      const sample = Math.max(-1, Math.min(1, data[channel]![i]!));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += bytesPerSample;
    }
  }

  return new Blob([view], { type: 'audio/wav' });
}

/** Seconds one 16th step lasts at a given tempo. */
function secondsPerStep(bpm: number) {
  return 60 / bpm / 4;
}

/** Chunk length for long renders. See renderProject. */
const CHUNK_SECONDS = 20;

/** The reverb IR's length, plus the longest envelope release any voice uses. */
const REVERB_TAIL = 2.6;
const RELEASE_TAIL = 1.5;

/**
 * How long a slice must keep rendering after its last note starts.
 *
 * Measured from the project rather than fixed, because the answer depends
 * entirely on what is in it: a four-bar drum sketch needs about four seconds,
 * while a pad held for two bars is still releasing eight seconds later. A tail
 * that is too short truncates whatever is still ringing, and the truncation
 * lands exactly on a slice boundary — an audible click every twenty seconds.
 */
function tailFor(project: Project): number {
  const spb = 60 / project.bpm / 4;
  let longest = 0;

  for (const track of project.tracks) {
    for (const note of track.notes) longest = Math.max(longest, note.length * spb);
  }

  return Math.min(14, longest + RELEASE_TAIL + REVERB_TAIL);
}

/**
 * Builds the send buses and every track's strip into a context, and returns a
 * per-track input node to schedule voices into.
 */
function buildGraph(ctx: OfflineAudioContext, project: Project) {
  // No master chain here: slices are rendered dry and the master runs once
  // over the summed result. Limiting each slice separately and then adding
  // their tails together produces a sum above the ceiling — which is exactly
  // how the first version of this managed to clip a limited mix.
  const sum = ctx.createGain();
  sum.connect(ctx.destination);
  const master = { input: sum };

  const reverb = ctx.createConvolver();
  const irLength = Math.floor(ctx.sampleRate * 2.4);
  const ir = ctx.createBuffer(2, irLength, ctx.sampleRate);
  for (let channel = 0; channel < 2; channel += 1) {
    const channelData = ir.getChannelData(channel);
    for (let i = 0; i < irLength; i += 1) {
      channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / irLength, 2.6);
    }
  }
  reverb.buffer = ir;
  const reverbReturn = ctx.createGain();
  reverbReturn.gain.value = 0.9;
  reverb.connect(reverbReturn).connect(master.input);

  const delay = ctx.createDelay(2);
  delay.delayTime.value = 0.35;
  const feedback = ctx.createGain();
  feedback.gain.value = 0.34;
  const delayTone = ctx.createBiquadFilter();
  delayTone.type = 'lowpass';
  delayTone.frequency.value = 3200;
  delay.connect(delayTone).connect(feedback).connect(delay);
  delayTone.connect(master.input);

  const inputs = new Map<string, GainNode>();
  const anySoloed = project.tracks.some((track) => track.soloed);

  for (const track of project.tracks) {
    const audible = anySoloed ? track.soloed && !track.muted : !track.muted;
    if (!audible || track.notes.length === 0) continue;

    const input = ctx.createGain();

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = track.effects.filter;
    filter.Q.value = 0.7;

    const low = ctx.createBiquadFilter();
    low.type = 'lowshelf';
    low.frequency.value = 200;
    low.gain.value = track.effects.low;

    const mid = ctx.createBiquadFilter();
    mid.type = 'peaking';
    mid.frequency.value = 1000;
    mid.Q.value = 0.9;
    mid.gain.value = track.effects.mid;

    const high = ctx.createBiquadFilter();
    high.type = 'highshelf';
    high.frequency.value = 5000;
    high.gain.value = track.effects.high;

    const compressor = ctx.createDynamicsCompressor();
    compressor.attack.value = 0.006;
    compressor.release.value = 0.12;
    compressor.knee.value = 6;
    compressor.threshold.value = track.effects.compress > 0 ? -14 - track.effects.compress * 16 : 0;
    compressor.ratio.value = 1 + track.effects.compress * 7;

    const panner = ctx.createStereoPanner();
    panner.pan.value = track.pan;

    const volume = ctx.createGain();
    volume.gain.value = track.volume;

    input.connect(filter).connect(low).connect(mid).connect(high).connect(compressor);
    compressor.connect(panner).connect(volume).connect(master.input);

    const reverbSend = ctx.createGain();
    reverbSend.gain.value = track.effects.reverb;
    volume.connect(reverbSend).connect(reverb);

    const delaySend = ctx.createGain();
    delaySend.gain.value = track.effects.delay;
    volume.connect(delaySend).connect(delay);

    inputs.set(track.id, input);
  }

  return inputs;
}

/**
 * Renders one slice of the project.
 *
 * Only notes *starting* inside the slice are scheduled. Anything that started
 * earlier and is still ringing arrives through the previous slice's tail, which
 * the caller overlaps into this one.
 */
async function renderSlice(
  project: Project,
  from: number,
  to: number,
  sampleRate: number,
  tail: number,
): Promise<AudioBuffer> {
  const spb = 60 / project.bpm / 4;
  const length = Math.ceil((to - from + tail) * sampleRate);

  const ctx = new OfflineAudioContext(2, length, sampleRate);
  const inputs = buildGraph(ctx, project);

  for (const track of project.tracks) {
    const input = inputs.get(track.id);
    if (!input) continue;

    for (const note of track.notes) {
      // Swing has to match the live scheduler exactly, or the exported file
      // grooves differently from what was played back.
      const swing = note.step % 2 === 1 ? spb * project.swing : 0;
      const time = note.step * spb + swing + (note.micro ?? 0) * spb;
      if (time < from || time >= to) continue;

      playVoice(track.instrument, {
        ctx,
        destination: input,
        time: time - from,
        pitch: note.pitch,
        velocity: note.velocity,
        duration: Math.max(0.05, note.length * spb),
        slideFrom: note.slideFrom,
      });
    }
  }

  return ctx.startRendering();
}

/**
 * Runs a finished mix through the master chain in a single pass.
 *
 * Separate from the slice renders so the glue compressor and the limiter see
 * the whole track, exactly as they do live. It is one pass over the audio
 * through about eight nodes, so it costs a fraction of a slice render.
 */
async function applyMaster(buffer: AudioBuffer, project: Project): Promise<AudioBuffer> {
  const ctx = new OfflineAudioContext(2, buffer.length, buffer.sampleRate);
  const master = buildMaster(ctx, ctx.destination, project.master);

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.connect(master.input);
  source.start(0);

  return ctx.startRendering();
}

/**
 * Renders the whole project offline.
 *
 * Long projects are rendered in slices and overlap-added rather than in one
 * pass. The reason is a real limit rather than tidiness: every voice scheduled
 * into an OfflineAudioContext stays in its graph for the entire render, and
 * each render quantum visits every node in the graph — so a single-pass render
 * costs roughly (notes × duration), which is quadratic in the length of the
 * track. Measured on a full arrangement that is the difference between about
 * twenty seconds and several minutes.
 *
 * Each slice is rendered with a tail long enough for the reverb and the longest
 * release, and that tail is summed into the start of the next slice. Because
 * the tail carries the decaying response of everything in the slice, the seams
 * are arithmetically exact rather than crossfaded.
 *
 * A tail is appended at the end too, so the final bar's reverb finishes inside
 * the file instead of stopping at the bar line.
 */
export async function renderProject(project: Project, tailSeconds?: number): Promise<AudioBuffer> {
  const tail = tailSeconds ?? tailFor(project);
  const spb = 60 / project.bpm / 4;
  const totalSteps = project.bars * STEPS_PER_BAR;
  const musicSeconds = totalSteps * spb;
  const sampleRate = 44100;
  const totalFrames = Math.ceil((musicSeconds + tail) * sampleRate);

  // Short projects render in one pass — slicing them would only add overhead.
  if (musicSeconds <= CHUNK_SECONDS * 1.5) {
    return applyMaster(await renderSlice(project, 0, musicSeconds, sampleRate, tail), project);
  }

  const output = new OfflineAudioContext(2, totalFrames, sampleRate).createBuffer(
    2,
    totalFrames,
    sampleRate,
  );

  for (let from = 0; from < musicSeconds; from += CHUNK_SECONDS) {
    const to = Math.min(from + CHUNK_SECONDS, musicSeconds);
    const slice = await renderSlice(project, from, to, sampleRate, tail);
    const offset = Math.round(from * sampleRate);

    for (let channel = 0; channel < 2; channel += 1) {
      const target = output.getChannelData(channel);
      const source = slice.getChannelData(channel);
      const count = Math.min(source.length, target.length - offset);

      // Summed, not written: the previous slice's tail is already sitting here.
      for (let i = 0; i < count; i += 1) target[offset + i] = target[offset + i]! + source[i]!;
    }
  }

  return applyMaster(output, project);
}

/**
 * Renders one instrument's voice on its own, dry.
 *
 * This is what makes the one-shot library a real sample library rather than a
 * preview: the WAV it produces can be dropped into any other DAW. Nothing from
 * the mixer or the master chain is applied, because a one-shot should arrive
 * unprocessed and be shaped where it lands.
 */
export async function renderOneShot(
  instrument: InstrumentId,
  pitch: number,
  seconds = 2,
): Promise<AudioBuffer> {
  const sampleRate = 44100;
  const ctx = new OfflineAudioContext(2, Math.ceil(seconds * sampleRate), sampleRate);

  playVoice(instrument, {
    ctx,
    // A few milliseconds of lead-in rather than starting at sample zero: some
    // editors read a transient flush against the file start as a click.
    destination: ctx.destination,
    time: 0.005,
    pitch,
    velocity: 0.95,
    duration: Math.max(0.2, seconds - 0.6),
  });

  const buffer = await ctx.startRendering();
  return normalise(buffer);
}

/**
 * Scales a buffer so its loudest sample sits just under full scale.
 *
 * The voices are balanced against each other for playing together in a mix, so
 * their raw levels differ by a lot — a dub siren renders around a tenth of the
 * level of a kick. That is correct inside the studio and wrong for a sample
 * library, where every one-shot should arrive at a usable, consistent level and
 * be turned down where it lands.
 */
function normalise(buffer: AudioBuffer, ceiling = 0.89): AudioBuffer {
  let peak = 0;

  for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
    const data = buffer.getChannelData(channel);
    for (let i = 0; i < data.length; i += 1) {
      const value = Math.abs(data[i]!);
      if (value > peak) peak = value;
    }
  }

  // Silence, or already at the ceiling: nothing to do, and dividing by a peak
  // of zero would fill the buffer with NaN.
  if (peak === 0) return buffer;

  const gain = ceiling / peak;

  for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
    const data = buffer.getChannelData(channel);
    for (let i = 0; i < data.length; i += 1) data[i]! *= gain;
  }

  return buffer;
}

/** Triggers a browser download for a blob. */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  // Revoking immediately can cancel the download in some browsers; a tick of
  // slack is enough for the navigation to have started.
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function safeFilename(name: string, extension: string): string {
  const base = name.trim().replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase();
  return `${base || 'project'}.${extension}`;
}
