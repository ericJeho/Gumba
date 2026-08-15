import { playVoice } from '@/daw/instruments';
import {
  DEFAULT_MASTER,
  STEPS_PER_BAR,
  type MasterChain,
  type Project,
  type Track,
  type TrackEffects,
} from '@/daw/types';

/**
 * The audio engine.
 *
 * Signal path per track:
 *   voice → [filter → EQ → compressor] → panner → volume → analyser → master
 *                                              ↘ reverb send
 *                                              ↘ delay send
 *
 * Master bus:
 *   sum → width → EQ → glue compressor → limiter → output gain → analyser → out
 *
 * Timing uses the standard Web Audio lookahead pattern: a `setInterval` wakes
 * roughly every 25 ms and schedules every note falling inside the next 120 ms
 * against `audioContext.currentTime`. Scheduling notes from timers directly
 * would inherit the main thread's jitter, which is audible as a wobbling
 * hi-hat the moment the UI does any work.
 */

const LOOKAHEAD_MS = 25;
const SCHEDULE_WINDOW = 0.12;

/** Gain applied to the summed mix before the master chain. See buildMaster. */
const MASTER_HEADROOM = 0.55;

/** Builds a decaying-noise impulse response for the reverb send. */
function impulseResponse(ctx: BaseAudioContext, seconds: number, decay: number): AudioBuffer {
  const length = Math.floor(ctx.sampleRate * seconds);
  const buffer = ctx.createBuffer(2, length, ctx.sampleRate);

  for (let channel = 0; channel < 2; channel += 1) {
    const data = buffer.getChannelData(channel);
    for (let i = 0; i < length; i += 1) {
      // Independent noise per channel is what makes the tail stereo; a shared
      // buffer would collapse to the centre.
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
    }
  }

  return buffer;
}

/** One track's mixer strip. */
type Strip = {
  input: GainNode;
  filter: BiquadFilterNode;
  low: BiquadFilterNode;
  mid: BiquadFilterNode;
  high: BiquadFilterNode;
  compressor: DynamicsCompressorNode;
  /** Dry path after processing, before pan. */
  postFx: GainNode;
  panner: StereoPannerNode;
  volume: GainNode;
  analyser: AnalyserNode;
  reverbSend: GainNode;
  delaySend: GainNode;
};

export type EngineBuses = {
  master: GainNode;
  reverb: ConvolverNode;
  delay: DelayNode;
};

export type MasterNodes = {
  input: GainNode;
  low: BiquadFilterNode;
  mid: BiquadFilterNode;
  high: BiquadFilterNode;
  glue: DynamicsCompressorNode;
  limiter: DynamicsCompressorNode;
  output: GainNode;
  analyser: AnalyserNode | null;
};

/**
 * Builds the master chain onto a destination and hands back every node in it.
 *
 * Shared by live playback and offline rendering, so an exported WAV goes
 * through exactly the same processing as the monitor path — an export that
 * sounds different from what you mixed is worse than no export at all.
 *
 * The nodes are returned rather than hidden because the live engine has to
 * retune them as the mastering controls move; rebuilding the chain per change
 * would click on every drag.
 */
export function buildMaster(
  ctx: BaseAudioContext,
  destination: AudioNode,
  settings: MasterChain,
): MasterNodes {
  const input = ctx.createGain();
  // Headroom trim on the sum bus.
  //
  // DynamicsCompressorNode has no look-ahead, so the limiter below cannot
  // catch a fast transient that is already over the ceiling — it clamps the
  // sustain and lets the attack through. Summing a dozen tracks at unity
  // reliably produces those transients, and the result is an export that
  // clips at full scale. Trimming the sum first gives the limiter something
  // to work with; the output gain restores the level afterwards.
  input.gain.value = MASTER_HEADROOM;

  const low = ctx.createBiquadFilter();
  low.type = 'lowshelf';
  low.frequency.value = 160;
  low.gain.value = settings.low;

  const mid = ctx.createBiquadFilter();
  mid.type = 'peaking';
  mid.frequency.value = 1200;
  mid.Q.value = 0.8;
  mid.gain.value = settings.mid;

  const high = ctx.createBiquadFilter();
  high.type = 'highshelf';
  high.frequency.value = 6500;
  high.gain.value = settings.high;

  const glue = ctx.createDynamicsCompressor();
  glue.threshold.value = -20 - (1 - settings.glue) * 12;
  glue.ratio.value = 1.5 + settings.glue * 3.5;
  glue.attack.value = 0.02;
  glue.release.value = 0.25;
  glue.knee.value = 8;

  // A brick-wall-ish limiter: a fast, high-ratio compressor at the ceiling.
  // Not a true look-ahead limiter — Web Audio has no such node — but it holds
  // the ceiling for anything short of deliberate abuse.
  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = settings.ceiling;
  limiter.ratio.value = 20;
  limiter.attack.value = 0.001;
  limiter.release.value = 0.06;
  limiter.knee.value = 0;

  const output = ctx.createGain();
  output.gain.value = settings.gain;

  input.connect(low).connect(mid).connect(high).connect(glue).connect(limiter).connect(output);

  // An OfflineAudioContext can create an analyser but nothing would ever read
  // it, so the render path skips one rather than paying for the FFT.
  let analyser: AnalyserNode | null = null;
  if (ctx instanceof OfflineAudioContext) {
    output.connect(destination);
  } else {
    analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.8;
    output.connect(analyser).connect(destination);
  }

  return { input, low, mid, high, glue, limiter, output, analyser };
}

/** Applies per-track effect settings to an existing strip. */
function applyEffects(strip: Strip, effects: TrackEffects) {
  strip.filter.frequency.value = effects.filter;
  strip.low.gain.value = effects.low;
  strip.mid.gain.value = effects.mid;
  strip.high.gain.value = effects.high;

  strip.compressor.threshold.value = effects.compress > 0 ? -14 - effects.compress * 16 : 0;
  strip.compressor.ratio.value = 1 + effects.compress * 7;

  strip.reverbSend.gain.value = effects.reverb;
  strip.delaySend.gain.value = effects.delay;
}

export class AudioEngine {
  readonly ctx: AudioContext;
  readonly buses: EngineBuses;
  masterAnalyser: AnalyserNode | null = null;

  private masterNodes: MasterNodes;
  private masterSettings: MasterChain = { ...DEFAULT_MASTER };
  private strips = new Map<string, Strip>();
  private timer: number | null = null;

  /** Context time at which the current playthrough started. */
  private startTime = 0;
  /** Step the playthrough started from. */
  private startStep = 0;
  /** Next step index waiting to be scheduled. */
  private nextStep = 0;

  private project: Project | null = null;
  private metronome = false;

  /** Called with the current step on each scheduler tick, for the playhead. */
  onStep: ((step: number) => void) | null = null;

  constructor() {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new Ctor();

    this.masterNodes = buildMaster(this.ctx, this.ctx.destination, this.masterSettings);
    this.masterAnalyser = this.masterNodes.analyser;
    const masterInput = this.masterNodes.input;

    const reverb = this.ctx.createConvolver();
    reverb.buffer = impulseResponse(this.ctx, 2.4, 2.6);
    const reverbReturn = this.ctx.createGain();
    reverbReturn.gain.value = 0.9;
    reverb.connect(reverbReturn).connect(masterInput);

    const delay = this.ctx.createDelay(2);
    delay.delayTime.value = 0.35;
    const feedback = this.ctx.createGain();
    feedback.gain.value = 0.34;
    const delayTone = this.ctx.createBiquadFilter();
    delayTone.type = 'lowpass';
    delayTone.frequency.value = 3200;
    // Darkening each repeat is what makes an echo sit behind the source
    // instead of fighting it.
    delay.connect(delayTone).connect(feedback).connect(delay);
    delayTone.connect(masterInput);

    this.buses = { master: masterInput, reverb, delay };
  }

  get currentTime() {
    return this.ctx.currentTime;
  }

  async resume() {
    if (this.ctx.state === 'suspended') await this.ctx.resume();
  }

  /** Creates or updates a track's strip. */
  syncTrack(track: Track, anySoloed: boolean) {
    let strip = this.strips.get(track.id);

    if (!strip) {
      const ctx = this.ctx;
      const input = ctx.createGain();

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.Q.value = 0.7;

      const low = ctx.createBiquadFilter();
      low.type = 'lowshelf';
      low.frequency.value = 200;

      const mid = ctx.createBiquadFilter();
      mid.type = 'peaking';
      mid.frequency.value = 1000;
      mid.Q.value = 0.9;

      const high = ctx.createBiquadFilter();
      high.type = 'highshelf';
      high.frequency.value = 5000;

      const compressor = ctx.createDynamicsCompressor();
      compressor.attack.value = 0.006;
      compressor.release.value = 0.12;
      compressor.knee.value = 6;

      const postFx = ctx.createGain();
      const panner = ctx.createStereoPanner();
      const volume = ctx.createGain();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.7;

      const reverbSend = ctx.createGain();
      reverbSend.gain.value = 0;
      const delaySend = ctx.createGain();
      delaySend.gain.value = 0;

      input.connect(filter).connect(low).connect(mid).connect(high).connect(compressor).connect(postFx);
      postFx.connect(panner).connect(volume).connect(analyser).connect(this.masterNodes.input);

      // Sends tap the processed signal post-fader, so pulling a fader down also
      // pulls its reverb — the behaviour people expect from a mixer.
      volume.connect(reverbSend).connect(this.buses.reverb);
      volume.connect(delaySend).connect(this.buses.delay);

      strip = {
        input,
        filter,
        low,
        mid,
        high,
        compressor,
        postFx,
        panner,
        volume,
        analyser,
        reverbSend,
        delaySend,
      };
      this.strips.set(track.id, strip);
    }

    // Solo is exclusive-by-omission: any soloed track silences every track that
    // is not itself soloed.
    const audible = anySoloed ? track.soloed && !track.muted : !track.muted;
    strip.volume.gain.value = audible ? track.volume : 0;
    strip.panner.pan.value = track.pan;
    applyEffects(strip, track.effects);
  }

  removeTrack(id: string) {
    const strip = this.strips.get(id);
    if (!strip) return;
    strip.volume.disconnect();
    strip.input.disconnect();
    this.strips.delete(id);
  }

  /**
   * Retunes the live master chain in place.
   *
   * Parameters are set directly on the existing nodes rather than rebuilding
   * the chain, so dragging a mastering control is continuous and silent.
   */
  setMaster(settings: MasterChain) {
    this.masterSettings = settings;

    const nodes = this.masterNodes;
    nodes.low.gain.value = settings.low;
    nodes.mid.gain.value = settings.mid;
    nodes.high.gain.value = settings.high;
    nodes.glue.threshold.value = -20 - (1 - settings.glue) * 12;
    nodes.glue.ratio.value = 1.5 + settings.glue * 3.5;
    nodes.limiter.threshold.value = settings.ceiling;
    nodes.output.gain.value = settings.gain;
  }

  trackAnalyser(id: string): AnalyserNode | null {
    return this.strips.get(id)?.analyser ?? null;
  }

  /** Plays a single note immediately — used for previewing in the piano roll. */
  preview(track: Track, pitch: number, duration = 0.4) {
    const strip = this.strips.get(track.id);
    if (!strip) return;

    playVoice(track.instrument, {
      ctx: this.ctx,
      destination: strip.input,
      time: this.ctx.currentTime + 0.01,
      pitch,
      velocity: 0.9,
      duration,
    });
  }

  private secondsPerStep(bpm: number) {
    // A step is a 16th note: one beat is four steps.
    return 60 / bpm / 4;
  }

  /** Swing delays every odd 16th, which is what gives a straight grid a groove. */
  private stepTime(step: number, project: Project) {
    const spb = this.secondsPerStep(project.bpm);
    const swing = step % 2 === 1 ? spb * project.swing : 0;
    return (step - this.startStep) * spb + this.startTime + swing;
  }

  start(project: Project, fromStep: number, metronome: boolean) {
    this.stop(false);

    this.project = project;
    this.metronome = metronome;
    this.startStep = fromStep;
    this.nextStep = fromStep;
    this.startTime = this.ctx.currentTime + 0.08;

    this.timer = window.setInterval(() => this.tick(), LOOKAHEAD_MS);
    this.tick();
  }

  stop(silence = true) {
    if (this.timer !== null) {
      window.clearInterval(this.timer);
      this.timer = null;
    }

    if (silence) {
      // Voices already scheduled cannot be cancelled individually, so the
      // master is ducked briefly and restored — a hard disconnect would click.
      const now = this.ctx.currentTime;
      const gain = this.masterNodes.output.gain;
      {
        const level = this.masterSettings.gain;
        gain.cancelScheduledValues(now);
        gain.setValueAtTime(gain.value, now);
        gain.linearRampToValueAtTime(0, now + 0.03);
        gain.setValueAtTime(0, now + 0.25);
        gain.linearRampToValueAtTime(level, now + 0.32);
      }
    }
  }

  private tick() {
    const project = this.project;
    if (!project) return;

    const totalSteps = project.bars * STEPS_PER_BAR;
    const anySoloed = project.tracks.some((track) => track.soloed);
    const spb = this.secondsPerStep(project.bpm);
    const horizon = this.ctx.currentTime + SCHEDULE_WINDOW;

    while (this.stepTime(this.nextStep, project) < horizon) {
      const step = this.nextStep;
      const time = this.stepTime(step, project);
      // The grid wraps, so the loop is seamless rather than restarting the
      // whole transport at the end of each pass.
      const gridStep = ((step % totalSteps) + totalSteps) % totalSteps;

      for (const track of project.tracks) {
        const audible = anySoloed ? track.soloed && !track.muted : !track.muted;
        if (!audible) continue;

        const strip = this.strips.get(track.id);
        if (!strip) continue;

        for (const note of track.notes) {
          if (note.step !== gridStep) continue;

          playVoice(track.instrument, {
            ctx: this.ctx,
            destination: strip.input,
            time,
            pitch: note.pitch,
            velocity: note.velocity,
            duration: Math.max(0.05, note.length * spb),
          });
        }
      }

      if (this.metronome && gridStep % 4 === 0) {
        const click = this.ctx.createGain();
        click.gain.setValueAtTime(0.0001, time);
        click.gain.exponentialRampToValueAtTime(gridStep % STEPS_PER_BAR === 0 ? 0.3 : 0.14, time + 0.002);
        click.gain.exponentialRampToValueAtTime(0.0001, time + 0.05);
        click.connect(this.ctx.destination);

        const osc = this.ctx.createOscillator();
        osc.frequency.value = gridStep % STEPS_PER_BAR === 0 ? 1600 : 1100;
        osc.connect(click);
        osc.start(time);
        osc.stop(time + 0.06);
      }

      this.nextStep += 1;
    }

    if (this.onStep) {
      const elapsed = this.ctx.currentTime - this.startTime;
      const current = Math.max(0, Math.floor(elapsed / spb) + this.startStep);
      this.onStep(((current % totalSteps) + totalSteps) % totalSteps);
    }
  }

  dispose() {
    this.stop(false);
    void this.ctx.close();
  }
}
