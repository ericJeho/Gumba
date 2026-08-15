import { buildMaster } from '@/daw/engine';
import { playVoice } from '@/daw/instruments';
import { STEPS_PER_BAR, type Project } from '@/daw/types';

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

/**
 * Renders the whole project offline.
 *
 * A tail is appended so reverb, delay repeats and long release envelopes finish
 * inside the file instead of being cut off at the final bar line.
 */
export async function renderProject(project: Project, tailSeconds = 2.5): Promise<AudioBuffer> {
  const spb = secondsPerStep(project.bpm);
  const totalSteps = project.bars * STEPS_PER_BAR;
  const duration = totalSteps * spb + tailSeconds;
  const sampleRate = 44100;

  const ctx = new OfflineAudioContext(2, Math.ceil(duration * sampleRate), sampleRate);
  const master = buildMaster(ctx, ctx.destination, project.master);

  // Sends are per-project, matching the live engine's routing.
  const reverb = ctx.createConvolver();
  const irLength = Math.floor(sampleRate * 2.4);
  const ir = ctx.createBuffer(2, irLength, sampleRate);
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

    for (const note of track.notes) {
      // Swing has to match the live scheduler exactly, or the exported file
      // grooves differently from what was played back.
      const swing = note.step % 2 === 1 ? spb * project.swing : 0;

      playVoice(track.instrument, {
        ctx,
        destination: input,
        time: note.step * spb + swing,
        pitch: note.pitch,
        velocity: note.velocity,
        duration: Math.max(0.05, note.length * spb),
      });
    }
  }

  return ctx.startRendering();
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
