// Web Audio Party Synthesizer & Player for Jukebox Demo / Auto-DJ
let audioCtx = null;
let currentLoopTimer = null;
let isLoopPlaying = false;
let masterGain = null;
let currentAudioElement = null;

function getAudioContext() {
  if (!audioCtx) {
    const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
    if (AudioCtxClass) {
      audioCtx = new AudioCtxClass();
      masterGain = audioCtx.createGain();
      masterGain.gain.setValueAtTime(0.7, audioCtx.currentTime);
      masterGain.connect(audioCtx.destination);
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// Generates a kick drum sound
function triggerKick(ctx, dest, time) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.frequency.setValueAtTime(140, time);
  osc.frequency.exponentialRampToValueAtTime(38, time + 0.12);
  gain.gain.setValueAtTime(1, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
  osc.connect(gain);
  gain.connect(dest);
  osc.start(time);
  osc.stop(time + 0.16);
}

// Generates a snare / clap sound
function triggerSnare(ctx, dest, time) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(220, time);
  gain.gain.setValueAtTime(0.6, time);
  gain.gain.exponentialRampToValueAtTime(0.01, time + 0.12);
  osc.connect(gain);
  gain.connect(dest);
  osc.start(time);
  osc.stop(time + 0.14);
}

// Generates a hi-hat sound
function triggerHiHat(ctx, dest, time) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'highpass' in ctx ? 'square' : 'triangle';
  osc.frequency.setValueAtTime(8000, time);
  gain.gain.setValueAtTime(0.25, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
  osc.connect(gain);
  gain.connect(dest);
  osc.start(time);
  osc.stop(time + 0.06);
}

// Generates a groovy synth bass note
function triggerBassNote(ctx, dest, time, freq) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(freq, time);
  gain.gain.setValueAtTime(0.3, time);
  gain.gain.exponentialRampToValueAtTime(0.01, time + 0.22);
  osc.connect(gain);
  gain.connect(dest);
  osc.start(time);
  osc.stop(time + 0.25);
}

const BASS_NOTES = [65.41, 73.42, 82.41, 87.31, 98.0, 110.0];

export function startFestiveAudioLoop(genre = 'Cachengue') {
  stopAudio();
  const ctx = getAudioContext();
  if (!ctx) return;

  isLoopPlaying = true;
  let beatStep = 0;
  const tempo = genre.includes('Cuarteto') ? 140 : genre.includes('EDM') ? 128 : 105;
  const intervalMs = (60 / tempo) * 250; // sixteenth note

  currentLoopTimer = setInterval(() => {
    if (!isLoopPlaying || !audioCtx) return;
    const now = ctx.currentTime;
    const stepInBar = beatStep % 16;

    // Four on the floor kick
    if (stepInBar % 4 === 0) {
      triggerKick(ctx, masterGain, now);
    }

    // Snare / clap on beats 2 and 4
    if (stepInBar === 4 || stepInBar === 12) {
      triggerSnare(ctx, masterGain, now);
    }

    // Offbeat Hi-hats
    if (stepInBar % 2 === 1) {
      triggerHiHat(ctx, masterGain, now);
    }

    // Funky bassline groove
    if (stepInBar === 2 || stepInBar === 6 || stepInBar === 10 || stepInBar === 14) {
      const note = BASS_NOTES[(beatStep / 4) % BASS_NOTES.length | 0];
      triggerBassNote(ctx, masterGain, now, note);
    }

    beatStep = (beatStep + 1) % 64;
  }, intervalMs);
}

export function stopAudio() {
  isLoopPlaying = false;
  if (currentLoopTimer) {
    clearInterval(currentLoopTimer);
    currentLoopTimer = null;
  }
  if (currentAudioElement) {
    currentAudioElement.pause();
    currentAudioElement = null;
  }
}

export function setMasterVolume(vol) {
  if (masterGain && audioCtx) {
    masterGain.gain.setValueAtTime(Math.max(0, Math.min(1, vol)), audioCtx.currentTime);
  }
}
