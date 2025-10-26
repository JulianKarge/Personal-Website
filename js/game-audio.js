// Game Audio System using Web Audio API
// Generates retro-style arcade sounds programmatically

class GameAudio {
  constructor() {
    this.audioContext = null;
    this.masterGain = null;
    this.isMuted = false;
    this.musicGain = null;
    this.sfxGain = null;
    this.musicOscillators = [];

    // Initialize on user interaction (required by browsers)
    this.initialized = false;
  }

  // Initialize audio context (must be called after user interaction)
  init() {
    if (this.initialized) return;

    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

      // Master gain (controls overall volume)
      this.masterGain = this.audioContext.createGain();
      this.masterGain.connect(this.audioContext.destination);
      this.masterGain.gain.value = this.isMuted ? 0 : 0.3;

      // SFX gain (for sound effects)
      this.sfxGain = this.audioContext.createGain();
      this.sfxGain.connect(this.masterGain);
      this.sfxGain.gain.value = 1.0;

      // Music gain (for background music)
      this.musicGain = this.audioContext.createGain();
      this.musicGain.connect(this.masterGain);
      this.musicGain.gain.value = 0.4;

      this.initialized = true;
      console.log('Game audio initialized');
    } catch (error) {
      console.error('Failed to initialize audio:', error);
    }
  }

  // Toggle mute
  toggleMute() {
    if (!this.initialized) return;

    this.isMuted = !this.isMuted;
    const targetVolume = this.isMuted ? 0 : 0.3;

    // Smooth volume transition
    this.masterGain.gain.linearRampToValueAtTime(
      targetVolume,
      this.audioContext.currentTime + 0.1
    );

    return this.isMuted;
  }

  // Get mute status
  getMuteStatus() {
    return this.isMuted;
  }

  // Laser shoot sound
  playShoot() {
    if (!this.initialized || this.isMuted) return;

    const now = this.audioContext.currentTime;

    // Oscillator for laser sound
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.connect(gain);
    gain.connect(this.sfxGain);

    // Laser sweep from high to low
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.1);

    // Quick fade out
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

    osc.start(now);
    osc.stop(now + 0.1);
  }

  // Explosion sound
  playExplosion() {
    if (!this.initialized || this.isMuted) return;

    const now = this.audioContext.currentTime;

    // White noise for explosion
    const bufferSize = this.audioContext.sampleRate * 0.3;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.audioContext.createBufferSource();
    noise.buffer = buffer;

    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2000, now);
    filter.frequency.exponentialRampToValueAtTime(100, now + 0.3);

    const gain = this.audioContext.createGain();
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(now);
    noise.stop(now + 0.3);
  }

  // Damage sound (player hit)
  playDamage() {
    if (!this.initialized || this.isMuted) return;

    const now = this.audioContext.currentTime;

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.type = 'sawtooth';

    // Harsh downward sweep
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.3);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

    osc.start(now);
    osc.stop(now + 0.3);
  }

  // Power-up collected sound
  playPowerUp() {
    if (!this.initialized || this.isMuted) return;

    const now = this.audioContext.currentTime;

    // Ascending arpeggio
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5

    notes.forEach((freq, i) => {
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.type = 'square';
      osc.frequency.value = freq;

      const startTime = now + (i * 0.08);
      gain.gain.setValueAtTime(0.15, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15);

      osc.start(startTime);
      osc.stop(startTime + 0.15);
    });
  }

  // Victory/High score sound
  playVictory() {
    if (!this.initialized || this.isMuted) return;

    const now = this.audioContext.currentTime;

    // Victory fanfare
    const melody = [
      { freq: 523.25, time: 0 },    // C5
      { freq: 659.25, time: 0.15 },  // E5
      { freq: 783.99, time: 0.3 },   // G5
      { freq: 1046.50, time: 0.45 }  // C6
    ];

    melody.forEach(note => {
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.type = 'triangle';
      osc.frequency.value = note.freq;

      const startTime = now + note.time;
      gain.gain.setValueAtTime(0.2, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);

      osc.start(startTime);
      osc.stop(startTime + 0.3);
    });
  }

  // Game over sound
  playGameOver() {
    if (!this.initialized || this.isMuted) return;

    const now = this.audioContext.currentTime;

    // Descending sad trombone
    const melody = [
      { freq: 392.00, time: 0 },    // G4
      { freq: 349.23, time: 0.2 },  // F4
      { freq: 293.66, time: 0.4 },  // D4
      { freq: 261.63, time: 0.6 }   // C4
    ];

    melody.forEach(note => {
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.type = 'sawtooth';
      osc.frequency.value = note.freq;

      const startTime = now + note.time;
      gain.gain.setValueAtTime(0.25, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.35);

      osc.start(startTime);
      osc.stop(startTime + 0.35);
    });
  }

  // Background music (simple ambient space theme)
  startBackgroundMusic() {
    if (!this.initialized || this.isMuted) return;

    this.stopBackgroundMusic();

    const now = this.audioContext.currentTime;

    // Simple ambient bass drone
    const bass = this.audioContext.createOscillator();
    bass.type = 'sine';
    bass.frequency.value = 55; // A1
    bass.connect(this.musicGain);
    bass.start(now);
    this.musicOscillators.push(bass);

    // Subtle high atmosphere
    const pad = this.audioContext.createOscillator();
    pad.type = 'triangle';
    pad.frequency.value = 220; // A3

    const padGain = this.audioContext.createGain();
    padGain.gain.value = 0.3;
    pad.connect(padGain);
    padGain.connect(this.musicGain);
    pad.start(now);
    this.musicOscillators.push(pad);
  }

  // Stop background music
  stopBackgroundMusic() {
    if (!this.initialized) return;

    this.musicOscillators.forEach(osc => {
      try {
        osc.stop(this.audioContext.currentTime);
        osc.disconnect();
      } catch (e) {
        // Already stopped or disconnected
      }
    });
    this.musicOscillators = [];
  }

  // Pause audio context (for game pause)
  pauseAudio() {
    if (!this.initialized || !this.audioContext) return;
    if (this.audioContext.state === 'running') {
      this.audioContext.suspend();
    }
  }

  // Resume audio context (for game resume)
  resumeAudio() {
    if (!this.initialized || !this.audioContext) return;
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }
}

// Create global instance
window.gameAudio = new GameAudio();
