/**
 * JET FIGHTER — single-file component.
 * Everything lives here: constants, audio engine, Zustand store, and all React/Three.js components.
 * To embed the whole game in any parent, just render: <JetFighterGame />
 */

// ─────────────────────────────────────────────────────────────────────────────
// REACT / THREE / LIBRARY IMPORTS
// ─────────────────────────────────────────────────────────────────────────────
import React, { useRef, useEffect, useState, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useTexture, Stars } from '@react-three/drei';
import { EffectComposer, Bloom, Noise, Vignette } from '@react-three/postprocessing';
import { motion, AnimatePresence } from 'framer-motion';
import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import * as THREE from 'three';

// ─────────────────────────────────────────────────────────────────────────────
// IMAGE ASSETS
// ─────────────────────────────────────────────────────────────────────────────
import playerJetImg from '../assets/com_jet.png';
import enemyUfoImg from '../assets/com_ufo.png';
import enemyCidImg from '../assets/com_cid.png';
import bossNormalImg from '../assets/modi_smile.png';
import bossNormalImgReg from '../assets/boss-smile.png';
import bossAngryImg from '../assets/modi-angry.png';
import bossAngryImgReg from '../assets/boss_angry.png';
import batImg from '../assets/com_bat.png';
import bombImg from '../assets/bomb.png';
import fireImg from '../assets/fire-png.png';
import scoreImg from '../assets/score.png';
import speedImg from '../assets/rapid-fire.png';
import immortalityImg from '../assets/immortality.png';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
export type AssetProfile = 'REGULAR' | 'DEVIL';
export type GameState = 'MENU' | 'PLAYING' | 'BOSS_WARNING' | 'BOSS_FIGHT' | 'GAME_OVER' | 'VICTORY';
export type PowerUpType = 'SCORE' | 'SPEED' | 'IMMORTALITY';

export interface GameSettings {
  TRIGGER_BOSS_WARNING: number;
  TRIGGER_BOSS_ENTRY: number;
  PLAYER_SPEED: number;
  PLAYER_ACCELERATION: number;
  PLAYER_FRICTION: number;
  PLAYER_FIRE_RATE_MS: number;
  PLAYER_X_LIMIT: number;
  PLAYER_BASE_Y: number;
  BOSS_MAX_HEALTH: number;
  BOSS_ENTRY_DURATION_SECONDS: number;
  BOSS_FIRE_RATE_START_MS: number;
  BOSS_FIRE_RATE_END_MS: number;
  BOSS_FIRE_RATE_RAMP_TIME_SECONDS: number;
  ENEMY_BASE_SPAWN_RATE_SECONDS: number;
  ENEMY_MIN_SPAWN_RATE_SECONDS: number;
  ENEMY_SPAWN_RATE_DECAY: number;
  POWERUP_DROP_CHANCE: number;
  POWERUP_SCORE_VALUE: number;
  POWERUP_SPEED_DURATION_MS: number;
  POWERUP_SPEED_MULTIPLIER: number;
  POWERUP_IMMORTALITY_DURATION_MS: number;
}

export interface ProfileGameConfig {
  warningTexts: string[];
  settings: GameSettings;
}

export interface PowerUp {
  id: string;
  type: PowerUpType;
  position: [number, number, number];
}

export interface Enemy {
  id: string;
  type: 'BASIC' | 'ZIGZAG' | 'CIRCULAR';
  position: [number, number, number];
  health: number;
  speed: number;
  createdAt: number;
}

export interface Projectile {
  id: string;
  position: [number, number, number];
  velocity: [number, number, number];
  isEnemy: boolean;
  type?: 'BULLET' | 'BAT' | 'FIRE' | 'BOMB';
  soundOverride?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// ██████  REGULAR PROFILE CONFIG  ────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────

const REGULAR_WARNING_TEXTS: string[] = [
  'He who controls the past controls the future',
  'He is unstoppable',
  'Boss fight incoming',
];

const REGULAR_GAME_SETTINGS: GameSettings = {
  // --- Timing ---
  TRIGGER_BOSS_WARNING: 30,       // seconds until boss warning
  TRIGGER_BOSS_ENTRY: 8 * 1000,  // ms from warning until boss spawns

  // --- Player ---
  PLAYER_SPEED: 35,
  PLAYER_ACCELERATION: 120,
  PLAYER_FRICTION: 8,
  PLAYER_FIRE_RATE_MS: 150,       // Lower is faster
  PLAYER_X_LIMIT: 12,
  PLAYER_BASE_Y: -8,

  // --- Boss ---
  BOSS_MAX_HEALTH: 1000,
  BOSS_ENTRY_DURATION_SECONDS: 5,
  BOSS_FIRE_RATE_START_MS: 3000,  // Initial ms between boss attacks
  BOSS_FIRE_RATE_END_MS: 800,     // Fastest ms between boss attacks
  BOSS_FIRE_RATE_RAMP_TIME_SECONDS: 30,

  // --- Enemies ---
  ENEMY_BASE_SPAWN_RATE_SECONDS: 2,
  ENEMY_MIN_SPAWN_RATE_SECONDS: 0.5,
  ENEMY_SPAWN_RATE_DECAY: 0.02,

  // --- Power-ups ---
  POWERUP_DROP_CHANCE: 0.1,       // 10% drop on enemy death
  POWERUP_SCORE_VALUE: 150,
  POWERUP_SPEED_DURATION_MS: 7500,
  POWERUP_SPEED_MULTIPLIER: 2,
  POWERUP_IMMORTALITY_DURATION_MS: 5000,
};

const REGULAR_IMAGES = {
  PLAYER_JET: playerJetImg,
  ENEMY_UFO: enemyUfoImg,
  ENEMY_CID: enemyCidImg,
  BOSS_NORMAL: bossNormalImgReg,
  BOSS_ANGRY: bossAngryImgReg,
  BAT: batImg,
  BOMB: bombImg,
  FIRE: fireImg,
  POWERUP_SCORE: scoreImg,
  POWERUP_SPEED: speedImg,
  POWERUP_IMMORTALITY: immortalityImg,
};

const REGULAR_SOUND_FILES: Record<string, string> = {
  ENEMY_SPAWN:      'https://firebasestorage.googleapis.com/v0/b/global-bucket-for-devils-projects/o/jetfighter%2Fenemy-spawn_reg.mp3?alt=media&token=87b5010c-1ec7-475f-82c3-061ef62f471a',
  THROW_BAT:        'https://firebasestorage.googleapis.com/v0/b/global-bucket-for-devils-projects/o/jetfighter%2Fthrow_bat_reg.mp3?alt=media&token=cd9a5fca-68b9-493d-a5fb-a92bcf5277ed',
  THROW_FIRE:       'https://firebasestorage.googleapis.com/v0/b/global-bucket-for-devils-projects/o/jetfighter%2Fthrow-fire_reg.mp3?alt=media&token=eed88b48-8f90-44d6-ad25-c50b3e6624b9',
  THROW_BOMB:       'https://firebasestorage.googleapis.com/v0/b/global-bucket-for-devils-projects/o/jetfighter%2Fthrow_bomb.mp3?alt=media&token=90a6638c-071b-43ba-920d-974e32ed1fac',
  POWERUP:          '/sounds/powerup.mp3',
  POWERUP_IMMORTALITY: 'https://firebasestorage.googleapis.com/v0/b/global-bucket-for-devils-projects/o/jetfighter%2Fpowerup_immortal.mp3?alt=media&token=3250274d-9087-487c-8243-7f5d24828f7e',
  POWERUP_SPEED:    'https://firebasestorage.googleapis.com/v0/b/global-bucket-for-devils-projects/o/jetfighter%2Fpowerup_speed.mp3?alt=media&token=309bbf63-fe72-49dc-9f1f-58cc35403493',
  POWERUP_SCORE:    '/sounds/powerup_score.mp3',
  LORD_COMMANDER_1: 'https://firebasestorage.googleapis.com/v0/b/global-bucket-for-devils-projects/o/jetfighter%2Flord_commander_sound_1_reg.mp3?alt=media&token=72db71d4-9b3f-4194-8a22-5c063c0cba62',
  LORD_COMMANDER_2: 'https://firebasestorage.googleapis.com/v0/b/global-bucket-for-devils-projects/o/jetfighter%2Flord_commander_sound_2_reg.mp3?alt=media&token=10255d57-432e-461e-8523-87721c9684f5',
  LORD_COMMANDER_3: 'https://firebasestorage.googleapis.com/v0/b/global-bucket-for-devils-projects/o/jetfighter%2Flord_commander_sound_3_reg.mp3?alt=media&token=44c80f08-e3ec-4060-917e-d470ff7f5db4',
  BOSS_ENTRY:       'https://firebasestorage.googleapis.com/v0/b/global-bucket-for-devils-projects/o/jetfighter%2Fboss_entry_reg.mp3?alt=media&token=f01dfae9-807c-4822-9e76-602c93e0826c',
  BOSS_APPEAR:      'https://firebasestorage.googleapis.com/v0/b/global-bucket-for-devils-projects/o/jetfighter%2Fboss_appeare_reg.mp3?alt=media&token=f6ae1aea-6375-4417-8df1-ec476b87d794',
  BOSS_BLAST:       'https://firebasestorage.googleapis.com/v0/b/global-bucket-for-devils-projects/o/jetfighter%2Fboss_blast.mp3?alt=media&token=aeb5b8ea-8e03-4787-8a68-dd5d85f208e8',
  BOSS_HIT:         'https://firebasestorage.googleapis.com/v0/b/global-bucket-for-devils-projects/o/jetfighter%2Fboss_hit_reg.mp3?alt=media&token=926ff6f8-e731-4e8d-8b9b-90ecceeab7d9',
  VICTORY:          'https://firebasestorage.googleapis.com/v0/b/global-bucket-for-devils-projects/o/jetfighter%2Fvictory.mp3?alt=media&token=e3f80f7c-9dd9-4513-b0bd-674f7237ea55',
  GAME_OVER:        'https://firebasestorage.googleapis.com/v0/b/global-bucket-for-devils-projects/o/jetfighter%2Fgame_over.mp3?alt=media&token=b122d915-433d-4320-b8e0-eb55dd6807c0',
  EXPLOSION:        '/sounds/explosion.mp3',
};

// ─────────────────────────────────────────────────────────────────────────────
// ████  DEVIL PROFILE CONFIG  ────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────

const DEVIL_WARNING_TEXTS: string[] = [
  'अङ्गेन गात्रं ',
  'नयनेन वक्त्रं',
  'न्यायेन राज्यं',
  'लवणेन भोज्यम्',
];

const DEVIL_GAME_SETTINGS: GameSettings = {
  // --- Timing ---
  TRIGGER_BOSS_WARNING: 30,
  TRIGGER_BOSS_ENTRY: 12.5 * 1000,

  // --- Player ---
  PLAYER_SPEED: 35,
  PLAYER_ACCELERATION: 120,
  PLAYER_FRICTION: 8,
  PLAYER_FIRE_RATE_MS: 150,
  PLAYER_X_LIMIT: 12,
  PLAYER_BASE_Y: -8,

  // --- Boss ---
  BOSS_MAX_HEALTH: 1000,
  BOSS_ENTRY_DURATION_SECONDS: 6,
  BOSS_FIRE_RATE_START_MS: 3000,
  BOSS_FIRE_RATE_END_MS: 800,
  BOSS_FIRE_RATE_RAMP_TIME_SECONDS: 30,

  // --- Enemies ---
  ENEMY_BASE_SPAWN_RATE_SECONDS: 2,
  ENEMY_MIN_SPAWN_RATE_SECONDS: 0.5,
  ENEMY_SPAWN_RATE_DECAY: 0.02,

  // --- Power-ups ---
  POWERUP_DROP_CHANCE: 0.1,
  POWERUP_SCORE_VALUE: 150,
  POWERUP_SPEED_DURATION_MS: 7500,
  POWERUP_SPEED_MULTIPLIER: 2,
  POWERUP_IMMORTALITY_DURATION_MS: 5000,
};

const DEVIL_IMAGES = {
  PLAYER_JET: playerJetImg,
  ENEMY_UFO: enemyUfoImg,
  ENEMY_CID: enemyCidImg,
  BOSS_NORMAL: bossNormalImg,
  BOSS_ANGRY: bossAngryImg,
  BAT: batImg,
  BOMB: bombImg,
  FIRE: fireImg,
  POWERUP_SCORE: scoreImg,
  POWERUP_SPEED: speedImg,
  POWERUP_IMMORTALITY: immortalityImg,
};

const DEVIL_SOUND_FILES: Record<string, string> = {
  ENEMY_SPAWN:      'https://firebasestorage.googleapis.com/v0/b/global-bucket-for-devils-projects/o/jetfighter%2Fenemy_spawn.mp3?alt=media&token=fa90762e-13a2-4c40-9945-97ffb9ae40f4',
  THROW_BAT:        'https://firebasestorage.googleapis.com/v0/b/global-bucket-for-devils-projects/o/jetfighter%2Fthrow_bat.mp3?alt=media&token=d39842d1-9a52-4e07-a7bf-aaa9bbb88605',
  THROW_FIRE:       'https://firebasestorage.googleapis.com/v0/b/global-bucket-for-devils-projects/o/jetfighter%2Fthrow_fire.mp3?alt=media&token=1f01edd3-4a0c-44f5-ad07-24cfac7d0444',
  THROW_BOMB:       'https://firebasestorage.googleapis.com/v0/b/global-bucket-for-devils-projects/o/jetfighter%2Fthrow_bomb.mp3?alt=media&token=90a6638c-071b-43ba-920d-974e32ed1fac',
  POWERUP:          '/sounds/powerup.mp3',
  POWERUP_IMMORTALITY: 'https://firebasestorage.googleapis.com/v0/b/global-bucket-for-devils-projects/o/jetfighter%2Fpowerup_immortal.mp3?alt=media&token=3250274d-9087-487c-8243-7f5d24828f7e',
  POWERUP_SPEED:    'https://firebasestorage.googleapis.com/v0/b/global-bucket-for-devils-projects/o/jetfighter%2Fpowerup_speed.mp3?alt=media&token=309bbf63-fe72-49dc-9f1f-58cc35403493',
  POWERUP_SCORE:    '/sounds/powerup_score.mp3',
  LORD_COMMANDER_1: 'https://firebasestorage.googleapis.com/v0/b/global-bucket-for-devils-projects/o/jetfighter%2Flord_commander_sound_1.mp3?alt=media&token=f451b868-7421-4c6c-8ca6-df63cb7b2131',
  LORD_COMMANDER_2: 'https://firebasestorage.googleapis.com/v0/b/global-bucket-for-devils-projects/o/jetfighter%2Flord_commander_sound_2.mp3?alt=media&token=676b34c2-329e-4252-93aa-5369f3a2dbc8',
  LORD_COMMANDER_3: 'https://firebasestorage.googleapis.com/v0/b/global-bucket-for-devils-projects/o/jetfighter%2Flord_commander_sound_3.mp3?alt=media&token=4532f0d7-8d82-4f90-bc32-83d195d4bd34',
  BOSS_ENTRY:       'https://firebasestorage.googleapis.com/v0/b/global-bucket-for-devils-projects/o/jetfighter%2Fboss_entry.mp3?alt=media&token=9279a13b-2cfd-429b-9a54-f05d8bceb347',
  BOSS_APPEAR:      'https://firebasestorage.googleapis.com/v0/b/global-bucket-for-devils-projects/o/jetfighter%2Fboss_appeare.mp3?alt=media&token=cdeb18dc-1290-4cc8-ab7e-4c82991323b1',
  BOSS_BLAST:       'https://firebasestorage.googleapis.com/v0/b/global-bucket-for-devils-projects/o/jetfighter%2Fboss_blast.mp3?alt=media&token=aeb5b8ea-8e03-4787-8a68-dd5d85f208e8',
  BOSS_HIT:         'https://firebasestorage.googleapis.com/v0/b/global-bucket-for-devils-projects/o/jetfighter%2Fboss_hit.mp3?alt=media&token=7ac601a5-9441-41bc-aa42-b3a8dd0d6cd8',
  VICTORY:          'https://firebasestorage.googleapis.com/v0/b/global-bucket-for-devils-projects/o/jetfighter%2Fvictory.mp3?alt=media&token=e3f80f7c-9dd9-4513-b0bd-674f7237ea55',
  GAME_OVER:        'https://firebasestorage.googleapis.com/v0/b/global-bucket-for-devils-projects/o/jetfighter%2Fgame_over.mp3?alt=media&token=b122d915-433d-4320-b8e0-eb55dd6807c0',
  EXPLOSION:        '/sounds/explosion.mp3',
};

// ─────────────────────────────────────────────────────────────────────────────
// PROFILE HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const getGameSettingsByProfile = (profile: AssetProfile): GameSettings =>
  profile === 'DEVIL' ? DEVIL_GAME_SETTINGS : REGULAR_GAME_SETTINGS;

const getImagesByProfile = (profile: AssetProfile) =>
  profile === 'DEVIL' ? DEVIL_IMAGES : REGULAR_IMAGES;

const getSoundFilesByProfile = (profile: AssetProfile): Record<string, string> =>
  profile === 'DEVIL' ? DEVIL_SOUND_FILES : REGULAR_SOUND_FILES;

const getBossWarningTextsByProfile = (profile: AssetProfile): string[] =>
  profile === 'DEVIL' ? DEVIL_WARNING_TEXTS : REGULAR_WARNING_TEXTS;

// ─────────────────────────────────────────────────────────────────────────────
// AUDIO ENGINE  (module-level singletons, unaffected by React re-renders)
// ─────────────────────────────────────────────────────────────────────────────
let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let compressor: DynamicsCompressorNode | null = null;

const activeSounds: Set<{ stop: () => void }> = new Set();
const soundBufferCache = new Map<string, AudioBuffer>();
let preloadPromise: Promise<void> | null = null;
let currentAudioProfile: AssetProfile = 'REGULAR';

const stopAllSoundsEngine = () => {
  activeSounds.forEach(s => { try { s.stop(); } catch (_) {} });
  activeSounds.clear();
};

const setAudioAssetProfile = (profile: AssetProfile) => {
  if (currentAudioProfile === profile) return;
  currentAudioProfile = profile;
  soundBufferCache.clear();
  preloadPromise = null;
};

const getSoundCacheKey = (key: string) => `${currentAudioProfile}:${key}`;

const initAudio = () => {
  if (audioCtx) return;
  try {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return;
    audioCtx = new Ctx();

    compressor = audioCtx.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-24, audioCtx.currentTime);
    compressor.knee.setValueAtTime(30, audioCtx.currentTime);
    compressor.ratio.setValueAtTime(12, audioCtx.currentTime);
    compressor.attack.setValueAtTime(0.003, audioCtx.currentTime);
    compressor.release.setValueAtTime(0.25, audioCtx.currentTime);

    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.5;
    masterGain.connect(compressor);
    compressor.connect(audioCtx.destination);
  } catch (e) {
    console.warn('Audio init failed', e);
  }
};

export const preloadAudioBuffers = (): Promise<void> => {
  initAudio();
  if (!audioCtx) return Promise.resolve();
  if (preloadPromise) return preloadPromise;

  const files = getSoundFilesByProfile(currentAudioProfile);
  preloadPromise = (async () => {
    if (audioCtx!.state === 'suspended') await audioCtx!.resume().catch(() => {});
    await Promise.all(
      Object.entries(files).map(async ([key, url]) => {
        const cacheKey = getSoundCacheKey(key);
        if (soundBufferCache.has(cacheKey)) return;
        try {
          const res = await fetch(url);
          if (!res.ok) return;
          const buf = await res.arrayBuffer();
          soundBufferCache.set(cacheKey, await audioCtx!.decodeAudioData(buf));
        } catch (e) {
          console.warn(`Could not preload sound "${key}":`, e);
        }
      })
    );
  })();
  return preloadPromise;
};

type SoundKey =
  | 'SHOOT' | 'ENEMY_SPAWN' | 'THROW_BAT' | 'THROW_FIRE' | 'THROW_BOMB'
  | 'POWERUP' | 'POWERUP_IMMORTALITY' | 'POWERUP_SPEED' | 'POWERUP_SCORE'
  | 'BOSS_ENTRY' | 'BOSS_APPEAR' | 'BOSS_BLAST' | 'BOSS_HIT' | 'VICTORY'
  | 'GAME_OVER' | 'EXPLOSION'
  | 'LORD_COMMANDER_1' | 'LORD_COMMANDER_2' | 'LORD_COMMANDER_3';

const playSoundEngine = (
  sound: SoundKey,
  assetProfile: AssetProfile,
  options?: { loop?: boolean }
): { stop: () => void } | void => {
  initAudio();
  if (audioCtx?.state === 'suspended') audioCtx.resume().catch(() => {});

  // Use preloaded buffer if ready
  const cacheKey = getSoundCacheKey(sound);
  const cached = soundBufferCache.get(cacheKey);
  if (cached && audioCtx && masterGain && audioCtx.state === 'running') {
    const source = audioCtx.createBufferSource();
    source.buffer = cached;
    if (options?.loop) source.loop = true;
    const gain = audioCtx.createGain();
    gain.gain.value = 0.5;
    source.connect(gain);
    gain.connect(masterGain);
    source.start();
    const obj = { stop: () => { try { source.stop(); } catch (_) {} activeSounds.delete(obj); } };
    activeSounds.add(obj);
    if (!options?.loop) source.addEventListener('ended', () => activeSounds.delete(obj));
    return obj;
  }

  // Synthesised shoot sound
  if (sound === 'SHOOT') {
    try {
      if (!audioCtx || !masterGain) return { stop: () => {} };
      if (audioCtx.state === 'suspended') audioCtx.resume();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain); gain.connect(masterGain);
      const now = audioCtx.currentTime;
      osc.type = 'square';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.1);
      gain.gain.setValueAtTime(0.020, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.start(now); osc.stop(now + 0.1);
      const obj = {
        stop: () => {
          try { gain.gain.exponentialRampToValueAtTime(0.01, audioCtx!.currentTime + 0.1); osc.stop(audioCtx!.currentTime + 0.1); setTimeout(() => osc.disconnect(), 200); } catch (_) {}
          activeSounds.delete(obj);
        }
      };
      activeSounds.add(obj);
      setTimeout(() => activeSounds.delete(obj), 100);
      return obj;
    } catch (_) { return { stop: () => {} }; }
  }

  // Network audio fallback
  const url = getSoundFilesByProfile(assetProfile)[sound];
  if (url) {
    const audio = new Audio(url);
    audio.volume = 0.5;
    if (options?.loop) audio.loop = true;
    const playPromise = audio.play();
    const obj = {
      stop: () => {
        if (playPromise) playPromise.then(() => { audio.pause(); audio.currentTime = 0; }).catch(() => {});
        else { audio.pause(); audio.currentTime = 0; }
        activeSounds.delete(obj);
      }
    };
    activeSounds.add(obj);
    if (!options?.loop) audio.addEventListener('ended', () => activeSounds.delete(obj));
    if (playPromise) playPromise.catch(e => { console.warn('Sound play error:', e); activeSounds.delete(obj); });
    return obj;
  }

  // Synthesised fallback tones
  try {
    if (!audioCtx || !masterGain) return { stop: () => {} };
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain); gain.connect(masterGain);
    const now = audioCtx.currentTime;
    let duration = 0.1;

    const makeSoundObj = () => {
      const obj = { stop: () => { try { osc.stop(); osc.disconnect(); } catch (_) {} activeSounds.delete(obj); } };
      activeSounds.add(obj);
      return obj;
    };

    if (sound.startsWith('THROW_')) {
      osc.type = 'triangle'; osc.frequency.setValueAtTime(300, now);
      if (options?.loop) {
        gain.gain.setValueAtTime(0.1, now); osc.start(now);
        const obj = { stop: () => { try { gain.gain.exponentialRampToValueAtTime(0.01, audioCtx!.currentTime + 0.1); osc.stop(audioCtx!.currentTime + 0.1); setTimeout(() => osc.disconnect(), 200); } catch (_) {} activeSounds.delete(obj); } };
        activeSounds.add(obj); return obj;
      }
      osc.frequency.exponentialRampToValueAtTime(50, now + 0.2);
      gain.gain.setValueAtTime(0.1, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2); duration = 0.2;
    } else if (sound === 'EXPLOSION') {
      osc.type = 'sawtooth'; osc.frequency.setValueAtTime(100, now); osc.frequency.exponentialRampToValueAtTime(10, now + 0.3);
      gain.gain.setValueAtTime(0.2, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3); duration = 0.3;
    } else if (sound.startsWith('POWERUP')) {
      osc.type = 'sine'; osc.frequency.setValueAtTime(440, now);
      if (sound === 'POWERUP_IMMORTALITY') { osc.frequency.setValueAtTime(880, now + 0.1); osc.frequency.setValueAtTime(1760, now + 0.2); }
      else if (sound === 'POWERUP_SPEED') { osc.frequency.setValueAtTime(660, now + 0.05); osc.frequency.setValueAtTime(880, now + 0.1); osc.frequency.setValueAtTime(1100, now + 0.15); }
      else { osc.frequency.setValueAtTime(660, now + 0.1); osc.frequency.setValueAtTime(880, now + 0.2); }
      gain.gain.setValueAtTime(0.1, now); gain.gain.linearRampToValueAtTime(0, now + 0.3); duration = 0.3;
    } else if (sound === 'ENEMY_SPAWN') {
      osc.type = 'sine'; osc.frequency.setValueAtTime(100, now);
      if (options?.loop) {
        gain.gain.setValueAtTime(0.1, now); osc.start(now);
        const obj = { stop: () => { try { gain.gain.exponentialRampToValueAtTime(0.01, audioCtx!.currentTime + 0.1); osc.stop(audioCtx!.currentTime + 0.1); setTimeout(() => osc.disconnect(), 200); } catch (_) {} activeSounds.delete(obj); } };
        activeSounds.add(obj); return obj;
      }
      gain.gain.setValueAtTime(0.1, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5); duration = 0.5;
    } else if (sound.startsWith('LORD_COMMANDER_')) {
      osc.type = 'sawtooth'; osc.frequency.setValueAtTime(150, now);
      if (options?.loop) {
        gain.gain.setValueAtTime(0.2, now); osc.start(now);
        const obj = { stop: () => { try { gain.gain.exponentialRampToValueAtTime(0.01, audioCtx!.currentTime + 0.1); osc.stop(audioCtx!.currentTime + 0.1); setTimeout(() => osc.disconnect(), 200); } catch (_) {} activeSounds.delete(obj); } };
        activeSounds.add(obj); return obj;
      }
      osc.frequency.exponentialRampToValueAtTime(50, now + 0.4); gain.gain.setValueAtTime(0.2, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4); duration = 0.4;
    } else if (sound === 'BOSS_ENTRY') {
      osc.type = 'sawtooth'; osc.frequency.setValueAtTime(50, now); osc.frequency.linearRampToValueAtTime(100, now + 2);
      gain.gain.setValueAtTime(0.3, now); gain.gain.linearRampToValueAtTime(0, now + 2); duration = 2;
    } else if (sound === 'BOSS_HIT') {
      osc.type = 'square'; osc.frequency.setValueAtTime(100, now); osc.frequency.exponentialRampToValueAtTime(50, now + 0.2);
      gain.gain.setValueAtTime(0.3, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2); duration = 0.2;
    } else if (sound === 'BOSS_BLAST') {
      osc.type = 'sawtooth'; osc.frequency.setValueAtTime(100, now); osc.frequency.exponentialRampToValueAtTime(10, now + 2);
      gain.gain.setValueAtTime(0.5, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 2); duration = 2;
    }

    osc.start(now); osc.stop(now + duration);
    const obj = makeSoundObj();
    setTimeout(() => activeSounds.delete(obj), duration * 1000);
    return obj;
  } catch (_) {
    return { stop: () => {} };
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ZUSTAND STORE
// ─────────────────────────────────────────────────────────────────────────────
interface GameStore {
  gameState: GameState;
  assetProfile: AssetProfile;
  playerName: string;
  score: number;
  bossHealth: number;
  bossMaxHealth: number;
  timeUntilBoss: number;
  playerHealth: number;
  playerPosition: [number, number, number];
  isImmortal: boolean;
  weaponSpeedMultiplier: number;
  enemies: Enemy[];
  projectiles: Projectile[];
  powerUps: PowerUp[];
  cameraShake: number;
  mobileInput: { left: boolean; right: boolean; fire: boolean };
  introSequence: number;
  bossHitTime: number;
  bossPosition: [number, number, number];

  setGameState: (s: GameState) => void;
  setTimeUntilBoss: (t: number) => void;
  setPlayerName: (n: string) => void;
  setPlayerPosition: (p: [number, number, number]) => void;
  setMobileInput: (i: Partial<{ left: boolean; right: boolean; fire: boolean }>) => void;
  setBossPosition: (p: [number, number, number]) => void;
  addScore: (pts: number) => void;
  advanceIntroSequence: () => void;

  spawnEnemy: (e: Omit<Enemy, 'id' | 'createdAt'>) => void;
  removeEnemy: (id: string) => void;
  updateEnemies: (enemies: Enemy[]) => void;

  spawnProjectile: (p: Omit<Projectile, 'id'>) => void;
  removeProjectile: (id: string) => void;
  updateProjectiles: (p: Projectile[]) => void;

  spawnPowerUp: (p: Omit<PowerUp, 'id'>) => void;
  removePowerUp: (id: string) => void;
  applyPowerUp: (t: PowerUpType) => void;

  hitPlayer: () => void;
  hitBoss: (dmg: number) => void;

  addCameraShake: (a: number) => void;
  updateCameraShake: () => void;

  playSound: (s: SoundKey, opts?: { loop?: boolean }) => { stop: () => void } | void;
  stopAllSounds: () => void;
  clearEntities: () => void;
  resetGame: () => void;
}

const DEFAULT_SETTINGS = getGameSettingsByProfile('REGULAR');

const useGameStore = create<GameStore>((set, get) => ({
  gameState: 'MENU',
  assetProfile: 'REGULAR',
  playerName: '',
  score: 0,
  bossHealth: DEFAULT_SETTINGS.BOSS_MAX_HEALTH,
  bossMaxHealth: DEFAULT_SETTINGS.BOSS_MAX_HEALTH,
  timeUntilBoss: DEFAULT_SETTINGS.TRIGGER_BOSS_WARNING,
  bossHitTime: 0,
  bossPosition: [0, 15, 0],
  introSequence: 0,
  playerHealth: 1,
  playerPosition: [0, DEFAULT_SETTINGS.PLAYER_BASE_Y, 0],
  isImmortal: false,
  weaponSpeedMultiplier: 1,
  enemies: [],
  projectiles: [],
  powerUps: [],
  cameraShake: 0,
  mobileInput: { left: false, right: false, fire: false },

  setGameState: (s) => set({ gameState: s }),
  setTimeUntilBoss: (t) => set({ timeUntilBoss: t }),
  setPlayerName: (name) => {
    const profile: AssetProfile = name.trim().toLowerCase() === 'devilal' ? 'DEVIL' : 'REGULAR';
    setAudioAssetProfile(profile);
    set({ playerName: name, assetProfile: profile });
  },
  setPlayerPosition: (p) => set({ playerPosition: p }),
  setMobileInput: (i) => set((s) => ({ mobileInput: { ...s.mobileInput, ...i } })),
  setBossPosition: (p) => set({ bossPosition: p }),
  addScore: (pts) => set((s) => ({ score: s.score + pts })),
  advanceIntroSequence: () => set((s) => ({ introSequence: s.introSequence + 1 })),

  spawnEnemy: (e) => set((s) => ({ enemies: [...s.enemies, { ...e, id: uuidv4(), createdAt: Date.now() }] })),
  removeEnemy: (id) => set((s) => ({ enemies: s.enemies.filter(e => e.id !== id) })),
  updateEnemies: (enemies) => set({ enemies }),

  spawnProjectile: (p) => set((s) => ({ projectiles: [...s.projectiles, { ...p, id: uuidv4() }] })),
  removeProjectile: (id) => set((s) => ({ projectiles: s.projectiles.filter(p => p.id !== id) })),
  updateProjectiles: (projectiles) => set({ projectiles }),

  spawnPowerUp: (p) => set((s) => ({ powerUps: [...s.powerUps, { ...p, id: uuidv4() }] })),
  removePowerUp: (id) => set((s) => ({ powerUps: s.powerUps.filter(p => p.id !== id) })),

  applyPowerUp: (type) => {
    const s = getGameSettingsByProfile(get().assetProfile);
    if (type === 'SCORE') {
      get().addScore(s.POWERUP_SCORE_VALUE);
    } else if (type === 'SPEED') {
      set({ weaponSpeedMultiplier: s.POWERUP_SPEED_MULTIPLIER });
      setTimeout(() => set({ weaponSpeedMultiplier: 1 }), s.POWERUP_SPEED_DURATION_MS);
    } else if (type === 'IMMORTALITY') {
      set({ isImmortal: true });
      setTimeout(() => set({ isImmortal: false }), s.POWERUP_IMMORTALITY_DURATION_MS);
    }
  },

  hitPlayer: () => {
    const state = get();
    if (state.isImmortal) return;
    if (state.gameState !== 'PLAYING' && state.gameState !== 'BOSS_FIGHT') return;
    get().stopAllSounds();
    get().clearEntities();
    set({ playerHealth: 0, gameState: 'GAME_OVER' });
    get().playSound('GAME_OVER');
  },

  hitBoss: (dmg) => {
    const state = get();
    if (state.gameState !== 'BOSS_FIGHT') return;
    const hp = Math.max(0, state.bossHealth - dmg);
    if (hp === 0) {
      get().stopAllSounds();
      get().clearEntities();
      set({ bossHealth: 0, gameState: 'VICTORY', bossHitTime: Date.now() });
      setTimeout(() => get().playSound('BOSS_BLAST'), 0);
      setTimeout(() => get().playSound('VICTORY'), 2500);
    } else {
      const now = Date.now();
      if (now - state.bossHitTime > 200) get().playSound('BOSS_HIT');
      set({ bossHealth: hp, bossHitTime: now });
    }
  },

  addCameraShake: (a) => set((s) => ({ cameraShake: Math.min(s.cameraShake + a, 1) })),
  updateCameraShake: () => set((s) => ({ cameraShake: s.cameraShake * 0.9 })),

  playSound: (sound, opts) => playSoundEngine(sound, get().assetProfile, opts),
  stopAllSounds: () => stopAllSoundsEngine(),
  clearEntities: () => set({ enemies: [], projectiles: [], powerUps: [] }),

  resetGame: () => {
    const s = getGameSettingsByProfile(get().assetProfile);
    stopAllSoundsEngine();
    set({
      gameState: 'PLAYING',
      score: 0,
      bossHealth: s.BOSS_MAX_HEALTH,
      bossMaxHealth: s.BOSS_MAX_HEALTH,
      bossHitTime: 0,
      bossPosition: [0, 15, 0],
      timeUntilBoss: s.TRIGGER_BOSS_WARNING,
      playerHealth: 1,
      playerPosition: [0, s.PLAYER_BASE_Y, 0],
      isImmortal: false,
      weaponSpeedMultiplier: 1,
      enemies: [],
      projectiles: [],
      powerUps: [],
      cameraShake: 0,
      introSequence: 0,
    });
  },
}));

// ─────────────────────────────────────────────────────────────────────────────
// 3-D COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

// ── Player ───────────────────────────────────────────────────────────────────
const PlayerMesh: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null);
  const { gameState, assetProfile, weaponSpeedMultiplier, isImmortal, spawnProjectile, addCameraShake, playSound, mobileInput } = useGameStore();
  const settings = getGameSettingsByProfile(assetProfile);
  const texture = useTexture(getImagesByProfile(assetProfile).PLAYER_JET);
  const keys = useRef<Record<string, boolean>>({});
  const lastShot = useRef(0);
  const velocity = useRef(0);

  useEffect(() => {
    const down = (e: KeyboardEvent) => { keys.current[e.code] = true; };
    const up = (e: KeyboardEvent) => { keys.current[e.code] = false; };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []);

  useFrame((_s, delta) => {
    if (gameState !== 'PLAYING' && gameState !== 'BOSS_FIGHT' && gameState !== 'BOSS_WARNING') return;
    if (!groupRef.current) return;

    let input = 0;
    if (keys.current['ArrowLeft'] || keys.current['KeyA'] || mobileInput.left) input -= 1;
    if (keys.current['ArrowRight'] || keys.current['KeyD'] || mobileInput.right) input += 1;

    velocity.current += input * settings.PLAYER_ACCELERATION * delta;
    velocity.current -= velocity.current * settings.PLAYER_FRICTION * delta;
    velocity.current = Math.max(Math.min(velocity.current, settings.PLAYER_SPEED), -settings.PLAYER_SPEED);

    groupRef.current.position.x += velocity.current * delta;
    if (groupRef.current.position.x > settings.PLAYER_X_LIMIT) { groupRef.current.position.x = settings.PLAYER_X_LIMIT; velocity.current = 0; }
    if (groupRef.current.position.x < -settings.PLAYER_X_LIMIT) { groupRef.current.position.x = -settings.PLAYER_X_LIMIT; velocity.current = 0; }

    groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, -velocity.current * 0.05, 0.1);
    groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, -velocity.current * 0.02, 0.1);

    if (keys.current['Space'] || mobileInput.fire) {
      const now = Date.now();
      const fireRate = settings.PLAYER_FIRE_RATE_MS / weaponSpeedMultiplier;
      if (now - lastShot.current > fireRate) {
        lastShot.current = now;
        spawnProjectile({ position: [groupRef.current.position.x, groupRef.current.position.y + 1, 0], velocity: [0, 30, 0], isEnemy: false, type: 'BULLET' });
        groupRef.current.position.y -= 0.1;
        addCameraShake(0.05);
        playSound('SHOOT');
      }
    }

    groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, settings.PLAYER_BASE_Y, 0.1);
    useGameStore.getState().setPlayerPosition([groupRef.current.position.x, groupRef.current.position.y, groupRef.current.position.z]);
  });

  if (gameState === 'MENU' || gameState === 'GAME_OVER' || gameState === 'VICTORY') return null;

  return (
    <group ref={groupRef} position={[0, settings.PLAYER_BASE_Y, 0]}>
      <mesh>
        <planeGeometry args={[3, 3]} />
        <meshStandardMaterial map={texture} color={isImmortal ? '#ffff00' : '#ffffff'} emissive={isImmortal ? '#ffff00' : '#000000'} emissiveIntensity={isImmortal ? 1 : 0.5} transparent />
      </mesh>
      <mesh position={[0, -1, 0]}>
        <sphereGeometry args={[0.4, 8, 8]} />
        <meshStandardMaterial color="#00ffff" transparent opacity={0.8} />
      </mesh>
    </group>
  );
};

// ── Projectile mesh ───────────────────────────────────────────────────────────
const ProjectileMesh: React.FC<{ projectile: Projectile }> = ({ projectile }) => {
  const meshRef = useRef<THREE.Mesh | THREE.Group>(null);
  const assetProfile = useGameStore(s => s.assetProfile);
  const imageSet = getImagesByProfile(assetProfile);
  const batTex = useTexture(imageSet.BAT);
  const fireTex = useTexture(imageSet.FIRE);
  const bombTex = useTexture(imageSet.BOMB);

  useEffect(() => {
    let soundType = '';
    let loop = false;
    if (projectile.soundOverride) { if (projectile.soundOverride === 'NONE') return; soundType = projectile.soundOverride; }
    else if (projectile.isEnemy) {
      if (projectile.type === 'BAT' || projectile.type === 'FIRE' || projectile.type === 'BOMB') { soundType = `THROW_${projectile.type}`; loop = true; }
      else { soundType = 'SHOOT'; }
    } else { soundType = 'SHOOT'; }
    const snd = useGameStore.getState().playSound(soundType as SoundKey, loop ? { loop: true } : undefined);
    return () => { if (snd && snd.stop) snd.stop(); };
  }, [projectile.isEnemy, projectile.type, projectile.soundOverride]);

  useFrame((_s, delta) => {
    if (!meshRef.current) return;
    meshRef.current.position.x += projectile.velocity[0] * delta;
    meshRef.current.position.y += projectile.velocity[1] * delta;
    meshRef.current.position.z += projectile.velocity[2] * delta;
    if (projectile.type === 'BAT') meshRef.current.rotation.z += 10 * delta;
    const cur = useGameStore.getState().projectiles;
    const idx = cur.findIndex(p => p.id === projectile.id);
    if (idx !== -1) cur[idx].position = [meshRef.current.position.x, meshRef.current.position.y, meshRef.current.position.z];
    if (Math.abs(meshRef.current.position.y) > 20 || Math.abs(meshRef.current.position.x) > 20)
      useGameStore.getState().removeProjectile(projectile.id);
  });

  if (projectile.type === 'BAT') return (
    <group ref={meshRef as React.RefObject<THREE.Group>} position={projectile.position}>
      <mesh><planeGeometry args={[2, 2]} /><meshBasicMaterial map={batTex} transparent /></mesh>
    </group>
  );
  if (projectile.type === 'FIRE') return (
    <group ref={meshRef as React.RefObject<THREE.Group>} position={projectile.position}>
      <mesh><planeGeometry args={[2, 3]} /><meshBasicMaterial map={fireTex} transparent /></mesh>
    </group>
  );
  if (projectile.type === 'BOMB') return (
    <mesh ref={meshRef as React.RefObject<THREE.Mesh>} position={projectile.position}>
      <planeGeometry args={[2.5, 2.5]} /><meshBasicMaterial map={bombTex} transparent />
    </mesh>
  );
  return (
    <mesh ref={meshRef as React.RefObject<THREE.Mesh>} position={projectile.position}>
      <capsuleGeometry args={[0.1, 0.5, 4, 8]} />
      <meshBasicMaterial color={projectile.isEnemy ? '#ff0000' : '#00ffff'} />
    </mesh>
  );
};

const ProjectilesScene: React.FC = () => {
  const projectiles = useGameStore(s => s.projectiles);
  return <>{projectiles.map(p => <ProjectileMesh key={p.id} projectile={p} />)}</>;
};

// ── Power-up mesh ─────────────────────────────────────────────────────────────
const PowerUpMesh: React.FC<{ powerUp: PowerUp; scoreTex: THREE.Texture | null; speedTex: THREE.Texture | null; immortalTex: THREE.Texture | null }> = ({ powerUp, scoreTex, speedTex, immortalTex }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((_s, delta) => {
    if (!meshRef.current) return;
    meshRef.current.position.y -= 3 * delta;
    meshRef.current.rotation.y += 2 * delta;
    meshRef.current.rotation.x += 1 * delta;
    const cur = useGameStore.getState().powerUps;
    const idx = cur.findIndex(p => p.id === powerUp.id);
    if (idx !== -1) cur[idx].position = [meshRef.current.position.x, meshRef.current.position.y, meshRef.current.position.z];
    if (meshRef.current.position.y < -15) useGameStore.getState().removePowerUp(powerUp.id);
  });

  const tex = powerUp.type === 'SCORE' ? scoreTex : powerUp.type === 'SPEED' ? speedTex : immortalTex;
  if (tex) return (
    <mesh ref={meshRef} position={powerUp.position}>
      <planeGeometry args={[2, 2]} />
      <meshBasicMaterial map={tex} transparent depthWrite={false} side={THREE.DoubleSide} />
    </mesh>
  );
  const color = powerUp.type === 'SCORE' ? '#ffd700' : powerUp.type === 'SPEED' ? '#00ffff' : '#ff00ff';
  return (
    <mesh ref={meshRef} position={powerUp.position}>
      <octahedronGeometry args={[0.6]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} wireframe />
    </mesh>
  );
};

const PowerUpsScene: React.FC = () => {
  const powerUps = useGameStore(s => s.powerUps);
  const assetProfile = useGameStore(s => s.assetProfile);
  const imageSet = getImagesByProfile(assetProfile);
  const [scoreTex, setScoreTex] = useState<THREE.Texture | null>(null);
  const [speedTex, setSpeedTex] = useState<THREE.Texture | null>(null);
  const [immortalTex, setImmortalTex] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.load(imageSet.POWERUP_SCORE, t => setScoreTex(t), undefined, () => {});
    loader.load(imageSet.POWERUP_SPEED, t => setSpeedTex(t), undefined, () => {});
    loader.load(imageSet.POWERUP_IMMORTALITY, t => setImmortalTex(t), undefined, () => {});
  }, [imageSet]);

  return <>{powerUps.map(p => <PowerUpMesh key={p.id} powerUp={p} scoreTex={scoreTex} speedTex={speedTex} immortalTex={immortalTex} />)}</>;
};

// ── Enemy ship ────────────────────────────────────────────────────────────────
const EnemyShipMesh: React.FC<{ enemy: Enemy }> = ({ enemy }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const { spawnProjectile, score, introSequence, assetProfile } = useGameStore();
  const lastShot = useRef(Date.now() + Math.random() * 2000);
  const texture = useTexture(getImagesByProfile(assetProfile).ENEMY_CID);

  useEffect(() => {
    const snd = useGameStore.getState().playSound('ENEMY_SPAWN');
    return () => { if (snd && snd.stop) snd.stop(); };
  }, []);

  useFrame((_s, delta) => {
    if (!meshRef.current) return;
    const time = (Date.now() - enemy.createdAt) / 1000;
    let dx = 0, dy = -enemy.speed * delta;
    if (enemy.type === 'ZIGZAG') dx = Math.sin(time * 3) * 10 * delta;
    else if (enemy.type === 'CIRCULAR') { dx = Math.cos(time * 2) * 8 * delta; dy = (Math.sin(time * 2) * 5 - enemy.speed) * delta; }
    meshRef.current.position.x += dx;
    meshRef.current.position.y += dy;
    const cur = useGameStore.getState().enemies;
    const idx = cur.findIndex(e => e.id === enemy.id);
    if (idx !== -1) cur[idx].position = [meshRef.current.position.x, meshRef.current.position.y, meshRef.current.position.z];
    if (meshRef.current.position.y < -15) { useGameStore.getState().removeEnemy(enemy.id); return; }

    const diffMult = Math.max(0.25, 1 - (score / 2000));
    const fireRate = introSequence < 4 ? 4000 : 2500 * diffMult;
    if (Date.now() - lastShot.current > fireRate) {
      lastShot.current = Date.now() + Math.random() * fireRate * 0.5;
      if (introSequence < 4) return;
      const types: ('BAT' | 'FIRE' | 'BOMB')[] = ['BAT', 'FIRE', 'BOMB'];
      const type = types[Math.floor(Math.random() * types.length)];
      spawnProjectile({ position: [meshRef.current.position.x, meshRef.current.position.y - 1, 0], velocity: [0, -15, 0], isEnemy: true, type });
      useGameStore.getState().playSound(`THROW_${type}` as SoundKey);
    }
  });

  return (
    <mesh ref={meshRef} position={enemy.position}>
      <planeGeometry args={[3, 3]} />
      <meshBasicMaterial map={texture} transparent />
    </mesh>
  );
};

// ── Boss explosion ────────────────────────────────────────────────────────────
const BossExplosion: React.FC<{ position: [number, number, number] }> = ({ position }) => {
  const groupRef = useRef<THREE.Group>(null);
  const particlesRef = useRef<THREE.InstancedMesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const ringMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const COUNT = 200;
  const dummy = new THREE.Object3D();
  const vels = useRef(new Float32Array(COUNT * 3));

  useEffect(() => {
    if (!particlesRef.current) return;
    for (let i = 0; i < COUNT; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const spd = 10 + Math.random() * 20;
      vels.current[i * 3] = Math.sin(phi) * Math.cos(theta) * spd;
      vels.current[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * spd;
      vels.current[i * 3 + 2] = Math.cos(phi) * spd;
      dummy.position.set(0, 0, 0); dummy.scale.setScalar(Math.random() * 0.5 + 0.5); dummy.updateMatrix();
      particlesRef.current.setMatrixAt(i, dummy.matrix);
      const cols = [new THREE.Color('#ffaa00'), new THREE.Color('#ff3300'), new THREE.Color('#ffffff'), new THREE.Color('#ffff00')];
      particlesRef.current.setColorAt(i, cols[Math.floor(Math.random() * cols.length)]);
    }
    particlesRef.current.instanceMatrix.needsUpdate = true;
    if (particlesRef.current.instanceColor) particlesRef.current.instanceColor.needsUpdate = true;
  }, []);

  useFrame((_s, delta) => {
    if (ringRef.current && ringMatRef.current) { ringRef.current.scale.addScalar(delta * 30); ringMatRef.current.opacity = Math.max(0, ringMatRef.current.opacity - delta * 0.8); }
    if (!particlesRef.current) return;
    for (let i = 0; i < COUNT; i++) {
      particlesRef.current.getMatrixAt(i, dummy.matrix); dummy.position.setFromMatrixPosition(dummy.matrix);
      dummy.position.x += vels.current[i * 3] * delta; dummy.position.y += vels.current[i * 3 + 1] * delta; dummy.position.z += vels.current[i * 3 + 2] * delta;
      vels.current[i * 3 + 1] -= 15 * delta; vels.current[i * 3] *= 0.98; vels.current[i * 3 + 1] *= 0.98; vels.current[i * 3 + 2] *= 0.98;
      dummy.scale.multiplyScalar(0.95); dummy.updateMatrix(); particlesRef.current.setMatrixAt(i, dummy.matrix);
    }
    particlesRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group ref={groupRef} position={position}>
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1, 0.2, 16, 64]} />
        <meshBasicMaterial ref={ringMatRef} color="#ffffff" transparent opacity={1} />
      </mesh>
      <instancedMesh ref={particlesRef} args={[undefined, undefined, COUNT]}>
        <sphereGeometry args={[0.2, 8, 8]} />
        <meshBasicMaterial transparent opacity={0.8} />
      </instancedMesh>
    </group>
  );
};

// ── Big enemy UFO ─────────────────────────────────────────────────────────────
const BigEnemySpaceship: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null);
  const { spawnProjectile, score, introSequence, advanceIntroSequence, assetProfile } = useGameStore();
  const texture = useTexture(getImagesByProfile(assetProfile).ENEMY_UFO);
  const lastShot = useRef(0);

  useFrame((s, _delta) => {
    if (!groupRef.current) return;
    const time = s.clock.getElapsedTime();
    groupRef.current.position.x = Math.sin(time * 0.5) * 10;
    groupRef.current.position.y = 12 + Math.sin(time * 2) * 0.5;

    const diffMult = Math.max(0.25, 1 - (score / 2000));
    const fireRate = introSequence < 4 ? 3000 : 2000 * diffMult;
    if (Date.now() - lastShot.current > fireRate) {
      lastShot.current = Date.now();
      let type: 'BAT' | 'FIRE' | 'BOMB' = 'BAT';
      if (introSequence === 0) { type = 'BAT'; advanceIntroSequence(); }
      else if (introSequence === 1) { type = 'FIRE'; advanceIntroSequence(); }
      else if (introSequence === 2) return;
      else if (introSequence === 3) { type = 'BOMB'; advanceIntroSequence(); }
      else { const t: ('BAT' | 'FIRE' | 'BOMB')[] = ['BAT', 'FIRE', 'BOMB']; type = t[Math.floor(Math.random() * t.length)]; }
      spawnProjectile({ position: [groupRef.current.position.x, groupRef.current.position.y - 2, 0], velocity: [0, -10, 0], isEnemy: true, type });
    }
  });

  return (
    <group ref={groupRef} position={[0, 12, 0]}>
      <mesh><planeGeometry args={[8, 8]} /><meshBasicMaterial map={texture} transparent /></mesh>
    </group>
  );
};

// ── Boss ──────────────────────────────────────────────────────────────────────
const Boss: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null);
  const { bossHealth, spawnProjectile, gameState, setGameState, playSound, score, bossHitTime, setBossPosition, assetProfile } = useGameStore();
  const settings = getGameSettingsByProfile(assetProfile);
  const lastShot = useRef(0);
  const moveTimer = useRef(0);
  const targetX = useRef(0);
  const soundIndex = useRef(1);
  const bossTimer = useRef(0);
  const [normalFace, setNormalFace] = useState<THREE.Texture | null>(null);
  const [hitFace, setHitFace] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    const loader = new THREE.TextureLoader();
    const imageSet = getImagesByProfile(assetProfile);

    const makeFace = (isHit: boolean) => {
      const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 512;
      const ctx2d = canvas.getContext('2d')!; ctx2d.clearRect(0, 0, 512, 512);
      ctx2d.fillStyle = isHit ? '#ffffff' : '#ff0000';
      ctx2d.beginPath(); ctx2d.arc(170, 200, 40, 0, Math.PI * 2); ctx2d.fill();
      ctx2d.beginPath(); ctx2d.arc(342, 200, 40, 0, Math.PI * 2); ctx2d.fill();
      ctx2d.strokeStyle = isHit ? '#ffffff' : '#ff0000'; ctx2d.lineWidth = 20; ctx2d.lineCap = 'round';
      ctx2d.beginPath();
      if (isHit) ctx2d.arc(256, 350, 60, 0, Math.PI * 2);
      else ctx2d.arc(256, 350, 80, 0, Math.PI);
      ctx2d.stroke();
      return new THREE.CanvasTexture(canvas);
    };

    loader.load(imageSet.BOSS_NORMAL, t => setNormalFace(t), undefined, () => setNormalFace(makeFace(false)));
    loader.load(imageSet.BOSS_ANGRY, t => setHitFace(t), undefined, () => setHitFace(makeFace(true)));
  }, [assetProfile]);

  useFrame((s, delta) => {
    if (!groupRef.current) return;
    const time = s.clock.getElapsedTime();
    bossTimer.current += delta;
    const entryDur = settings.BOSS_ENTRY_DURATION_SECONDS;

    if (bossTimer.current < entryDur) {
      const progress = bossTimer.current / entryDur;
      const ease = 1 - Math.pow(1 - progress, 3);
      groupRef.current.position.y = 30 - 22 * ease + Math.sin(time * 2) * 1;
      groupRef.current.position.x = 0;
    } else {
      moveTimer.current -= delta;
      if (moveTimer.current <= 0) { moveTimer.current = 2 + Math.random() * 2; targetX.current = (Math.random() - 0.5) * 20; }
      groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, targetX.current, delta * 2);
      groupRef.current.position.y = 8 + Math.sin(time * 2) * 1;

      const fightTime = bossTimer.current - entryDur;
      const fireRate = Math.max(
        settings.BOSS_FIRE_RATE_END_MS,
        settings.BOSS_FIRE_RATE_START_MS - (fightTime / settings.BOSS_FIRE_RATE_RAMP_TIME_SECONDS) * (settings.BOSS_FIRE_RATE_START_MS - settings.BOSS_FIRE_RATE_END_MS)
      );
      if (Date.now() - lastShot.current > fireRate) {
        lastShot.current = Date.now();
        const types: ('BAT' | 'FIRE' | 'BOMB')[] = ['BAT', 'FIRE', 'BOMB'];
        const type = types[Math.floor(Math.random() * types.length)];
        for (let i = -1; i <= 1; i++) {
          spawnProjectile({ position: [groupRef.current.position.x + i * 2, groupRef.current.position.y - 2, 0], velocity: [i * 3, -12, 0], isEnemy: true, type, soundOverride: i === 0 ? `LORD_COMMANDER_${soundIndex.current}` : 'NONE' });
        }
        soundIndex.current = soundIndex.current === 3 ? 1 : soundIndex.current + 1;
      }
    }

    setBossPosition([groupRef.current.position.x, groupRef.current.position.y, groupRef.current.position.z]);

    // Tentacle FK animation
    groupRef.current.children.forEach((child, i) => {
      if (i > 2) {
        let px = 0, py = 0, pz = 0;
        let angleX = Math.sin(time * 1.5 + i) * 0.2;
        let angleZ = Math.cos(time * 1.2 + i) * 0.2;
        const curl = -0.15 + Math.sin(time * 0.8 + i) * 0.1;
        child.children.forEach((seg, segIdx) => {
          angleX += Math.sin(time * 2.5 + i - segIdx * 0.2) * 0.05 + curl;
          angleZ += Math.cos(time * 2.2 + i - segIdx * 0.2) * 0.05;
          const L = 0.35;
          const dx = Math.sin(angleZ) * L, dy = -Math.cos(angleZ) * Math.cos(angleX) * L, dz = Math.sin(angleX) * L;
          px += dx; py += dy; pz += dz;
          seg.position.set(px, py, pz); seg.rotation.set(angleX, 0, angleZ);
        });
      }
    });
  });

  const isHit = Date.now() - bossHitTime < 1000;
  const face = isHit ? hitFace : normalFace;

  return (
    <group ref={groupRef} position={[0, 15, 0]}>
      <mesh><sphereGeometry args={[2.5, 32, 32]} /><meshStandardMaterial color="#4a0080" roughness={0.2} metalness={0.8} /></mesh>
      {face && <mesh position={[0, 0, 2.6]}><planeGeometry args={[5, 6]} /><meshBasicMaterial map={face} transparent depthWrite={false} /></mesh>}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        return (
          <group key={i} position={[Math.cos(angle) * 2, -1, Math.sin(angle) * 2]} rotation={[0, -angle, 0]}>
            {Array.from({ length: 16 }).map((_, segIdx) => {
              const r = 0.6 - segIdx * 0.03;
              const color = new THREE.Color().lerpColors(new THREE.Color('#ffcc00'), new THREE.Color('#ff6600'), segIdx / 15);
              return (
                <group key={segIdx}>
                  <mesh><sphereGeometry args={[r, 16, 16]} /><meshStandardMaterial color={color} roughness={0.3} metalness={0.5} /></mesh>
                  <mesh position={[0, 0, -r * 0.85]}><sphereGeometry args={[r * 0.4, 8, 8]} /><meshStandardMaterial color="#ffffff" roughness={0.8} /></mesh>
                </group>
              );
            })}
          </group>
        );
      })}
    </group>
  );
};

// ── Enemies scene ─────────────────────────────────────────────────────────────
const EnemiesScene: React.FC = () => {
  const { gameState, enemies, spawnEnemy, setGameState, playSound, stopAllSounds, clearEntities, introSequence, advanceIntroSequence, bossPosition, setTimeUntilBoss, assetProfile } = useGameStore();
  const settings = getGameSettingsByProfile(assetProfile);
  const spawnTimer = useRef(0);
  const gameTimer = useRef(0);
  const lastTimeUpdate = useRef(0);

  useFrame((_s, delta) => {
    if (gameState === 'PLAYING') {
      gameTimer.current += delta;
      spawnTimer.current -= delta;

      const remaining = Math.max(0, settings.TRIGGER_BOSS_WARNING - gameTimer.current);
      if (Math.abs(remaining - lastTimeUpdate.current) > 0.1) { setTimeUntilBoss(remaining); lastTimeUpdate.current = remaining; }

      if (spawnTimer.current <= 0) {
        if (introSequence < 2) return;
        if (introSequence === 2) advanceIntroSequence();
        spawnTimer.current = Math.max(settings.ENEMY_MIN_SPAWN_RATE_SECONDS, settings.ENEMY_BASE_SPAWN_RATE_SECONDS - gameTimer.current * settings.ENEMY_SPAWN_RATE_DECAY);
        const types: ('BASIC' | 'ZIGZAG' | 'CIRCULAR')[] = ['BASIC', 'ZIGZAG', 'CIRCULAR'];
        spawnEnemy({ type: types[Math.floor(Math.random() * types.length)], position: [(Math.random() - 0.5) * 24, 15, 0], health: 100, speed: 5 + Math.random() * 5 });
      }

      if (gameTimer.current > settings.TRIGGER_BOSS_WARNING) {
        stopAllSounds(); clearEntities(); setGameState('BOSS_WARNING'); playSound('BOSS_ENTRY');
        setTimeout(() => { setGameState('BOSS_FIGHT'); playSound('BOSS_APPEAR'); }, settings.TRIGGER_BOSS_ENTRY);
      }
    } else if (gameState === 'MENU' || gameState === 'GAME_OVER' || gameState === 'VICTORY') {
      gameTimer.current = 0;
    }
  });

  return (
    <>
      {gameState === 'PLAYING' && <BigEnemySpaceship />}
      {enemies.map(e => <EnemyShipMesh key={e.id} enemy={e} />)}
      {gameState === 'BOSS_FIGHT' && <Boss />}
      {gameState === 'VICTORY' && <BossExplosion position={bossPosition} />}
    </>
  );
};

// ── Collision system ──────────────────────────────────────────────────────────
const CollisionSystem: React.FC = () => {
  useFrame(() => {
    const state = useGameStore.getState();
    const settings = getGameSettingsByProfile(state.assetProfile);
    if (state.gameState !== 'PLAYING' && state.gameState !== 'BOSS_FIGHT') return;

    const { playerPosition, enemies, projectiles, powerUps, removeEnemy, removeProjectile, removePowerUp, addScore, hitPlayer, hitBoss, spawnPowerUp, applyPowerUp, addCameraShake, isImmortal, gameState, playSound } = state;
    const [px, py] = playerPosition;
    const R = 1;

    projectiles.forEach(p => {
      const [x, y] = p.position;
      if (p.isEnemy) {
        if (Math.hypot(x - px, y - py) < R + 0.5) {
          removeProjectile(p.id);
          if (!isImmortal) { hitPlayer(); addCameraShake(0.5); }
        }
      } else {
        projectiles.forEach(ep => {
          if (ep.isEnemy && ep.id !== p.id && Math.hypot(x - ep.position[0], y - ep.position[1]) < 1.0) {
            removeProjectile(p.id); removeProjectile(ep.id); addScore(10); addCameraShake(0.05);
          }
        });
        enemies.forEach(e => {
          if (Math.hypot(x - e.position[0], y - e.position[1]) < 1.5) {
            removeProjectile(p.id); removeEnemy(e.id); addScore(50); addCameraShake(0.1);
            if (Math.random() < settings.POWERUP_DROP_CHANCE) {
              const types: PowerUpType[] = ['SCORE', 'SPEED', 'IMMORTALITY'];
              spawnPowerUp({ type: types[Math.floor(Math.random() * types.length)], position: [e.position[0], e.position[1], 0] });
            }
          }
        });
        if (gameState === 'BOSS_FIGHT' && y > 6 && y < 12 && x > -4 && x < 4) {
          removeProjectile(p.id); hitBoss(10); addScore(10); addCameraShake(0.05);
        }
      }
    });

    enemies.forEach(e => {
      if (Math.hypot(e.position[0] - px, e.position[1] - py) < R + 1) {
        removeEnemy(e.id);
        if (!isImmortal) { hitPlayer(); addCameraShake(0.5); playSound('EXPLOSION'); }
      }
    });

    powerUps.forEach(p => {
      if (Math.hypot(p.position[0] - px, p.position[1] - py) < R + 1) {
        removePowerUp(p.id); applyPowerUp(p.type);
        playSound(`POWERUP_${p.type}` as SoundKey);
      }
    });
  });
  return null;
};

// ── Visual effects ────────────────────────────────────────────────────────────
const SceneEffects: React.FC = () => {
  const { camera } = useThree();
  const camBase = useRef(new THREE.Vector3(0, -5, 20));

  useFrame(() => {
    const shake = useGameStore.getState().cameraShake;
    if (shake > 0) {
      camera.position.x = camBase.current.x + (Math.random() - 0.5) * shake;
      camera.position.y = camBase.current.y + (Math.random() - 0.5) * shake;
      camera.position.z = camBase.current.z + (Math.random() - 0.5) * shake;
      useGameStore.getState().updateCameraShake();
    } else {
      camera.position.lerp(camBase.current, 0.1);
    }
    camera.lookAt(0, 0, 0);
  });

  return (
    <>
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={2} />
      <EffectComposer>
        <Bloom luminanceThreshold={0.2} luminanceSmoothing={0.9} height={300} opacity={1} />
        <Noise opacity={0.02} />
        <Vignette eskil={false} offset={0.1} darkness={1.1} />
      </EffectComposer>
    </>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// UI COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

const WarningScreen: React.FC = () => {
  const [index, setIndex] = useState(0);
  const [fade, setFade] = useState(true);
  const assetProfile = useGameStore(s => s.assetProfile);
  const texts = getBossWarningTextsByProfile(assetProfile);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => { setIndex(p => (p + 1) % texts.length); setFade(true); }, 500);
    }, 3000);
    return () => clearInterval(interval);
  }, [texts.length]);

  return (
    <motion.div key="boss-warning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="absolute inset-0 flex flex-col items-center justify-center bg-red-900/40 backdrop-blur-sm">
      <h2 className="text-8xl font-black text-red-500 tracking-tighter animate-pulse mb-8">WARNING</h2>
      <h3 className="text-4xl font-bold text-white tracking-widest uppercase mb-2">Lord Commander Coming...</h3>
      <h3 className={`text-4xl font-bold text-white tracking-widest uppercase transition-opacity duration-500 ${fade ? 'opacity-100' : 'opacity-0'}`}>{texts[index]}</h3>
    </motion.div>
  );
};

const HUD: React.FC = () => {
  const { gameState, playerName, score, bossHealth, bossMaxHealth, isImmortal, weaponSpeedMultiplier, timeUntilBoss } = useGameStore();
  return (
    <motion.div key="hud" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 p-6 flex flex-col justify-between">
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-3">
          <div className="bg-black/40 backdrop-blur-md px-6 py-3 rounded-xl border border-white/10">
            <p className="text-gray-400 text-sm font-bold tracking-widest uppercase mb-1">Score</p>
            <p className="text-white text-3xl font-black tabular-nums">{score.toString().padStart(6, '0')}</p>
          </div>
          {gameState === 'PLAYING' && timeUntilBoss > 0 && (
            <div className={`bg-black/40 backdrop-blur-md px-4 py-2 rounded-xl border ${timeUntilBoss <= 10 ? 'border-red-500/50' : 'border-white/10'} flex items-center justify-between gap-4`}>
              <p className="text-gray-400 text-xs font-bold tracking-widest uppercase">Boss in</p>
              <p className={`text-xl font-black tabular-nums ${timeUntilBoss <= 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>{Math.ceil(timeUntilBoss)}s</p>
            </div>
          )}
        </div>
        <div className="bg-black/40 backdrop-blur-md px-6 py-3 rounded-xl border border-white/10 text-right">
          <p className="text-gray-400 text-sm font-bold tracking-widest uppercase mb-1">Pilot</p>
          <p className="text-white text-xl font-bold uppercase">{playerName}</p>
        </div>
      </div>

      <div className="flex gap-4">
        <AnimatePresence>
          {isImmortal && (
            <motion.div key="immortal" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
              className="bg-yellow-500/20 border border-yellow-500/50 text-yellow-400 px-4 py-2 rounded-lg font-bold tracking-wider text-sm uppercase flex items-center gap-2">
              <span className="animate-pulse">●</span> Immortality Active
            </motion.div>
          )}
          {weaponSpeedMultiplier > 1 && (
            <motion.div key="speed" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
              className="bg-blue-500/20 border border-blue-500/50 text-blue-400 px-4 py-2 rounded-lg font-bold tracking-wider text-sm uppercase flex items-center gap-2">
              <span className="animate-pulse">●</span> Rapid Fire
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile controls */}
      <div className="md:hidden absolute bottom-8 left-0 right-0 px-6 flex justify-between items-end pointer-events-auto select-none">
        <div className="flex gap-4">
          {(['left', 'right'] as const).map(dir => (
            <button key={dir}
              onPointerDown={() => useGameStore.getState().setMobileInput({ [dir]: true })}
              onPointerUp={() => useGameStore.getState().setMobileInput({ [dir]: false })}
              onPointerLeave={() => useGameStore.getState().setMobileInput({ [dir]: false })}
              className="w-16 h-16 bg-white/10 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center text-white text-2xl active:bg-white/30 touch-none">
              {dir === 'left' ? '←' : '→'}
            </button>
          ))}
        </div>
        <button
          onPointerDown={() => useGameStore.getState().setMobileInput({ fire: true })}
          onPointerUp={() => useGameStore.getState().setMobileInput({ fire: false })}
          onPointerLeave={() => useGameStore.getState().setMobileInput({ fire: false })}
          className="w-20 h-20 bg-red-500/40 backdrop-blur-md border border-red-500/50 rounded-full flex items-center justify-center text-white text-xl font-bold active:bg-red-500/60 touch-none">
          FIRE
        </button>
      </div>

      {gameState === 'BOSS_FIGHT' && (
        <motion.div key="boss-health" initial={{ x: 100, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
          className="absolute top-1/2 right-6 -translate-y-1/2 w-64">
          <div className="bg-black/60 backdrop-blur-md p-4 rounded-2xl border border-red-500/30 shadow-[0_0_15px_rgba(255,0,0,0.2)]">
            <div className="flex flex-col items-end mb-3">
              <h3 className="text-red-400 font-bold tracking-widest uppercase text-sm">Lord Commander</h3>
              <p className="text-red-500/70 text-xs font-mono">{Math.ceil((bossHealth / bossMaxHealth) * 100)}%</p>
            </div>
            <div className="h-3 bg-gray-900 rounded-full overflow-hidden border border-white/10 relative">
              <motion.div className="absolute top-0 right-0 h-full bg-gradient-to-l from-red-600 to-red-400"
                initial={{ width: '100%' }} animate={{ width: `${(bossHealth / bossMaxHealth) * 100}%` }} transition={{ type: 'spring', bounce: 0 }} />
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

const GameUI: React.FC = () => {
  const { gameState, setGameState, setPlayerName, score, resetGame } = useGameStore();
  const [inputName, setInputName] = useState('');

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputName.trim()) { setPlayerName(inputName.trim()); resetGame(); }
  };

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden font-sans">
      <AnimatePresence>
        {gameState === 'MENU' && (
          <motion.div key="menu" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-auto">
            <div className="text-center mb-12">
              <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600 mb-4 tracking-tighter">
                JET FIGHTER LEVEL I : VJP
              </h1>
              <p className="text-gray-300 text-xl tracking-widest uppercase">Void Jet Punisher</p>
            </div>
            <form onSubmit={handleStart} className="flex flex-col items-center gap-6 w-full max-w-md">
              <input type="text" placeholder="ENTER PILOT NAME" value={inputName} onChange={e => setInputName(e.target.value)}
                className="w-full px-6 py-4 bg-white/10 border-2 border-white/20 rounded-xl text-white text-center text-xl uppercase tracking-widest focus:outline-none focus:border-blue-500 transition-colors"
                maxLength={15} required />
              <button type="submit"
                className="group relative px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xl rounded-xl uppercase tracking-widest transition-all hover:scale-105 active:scale-95 overflow-hidden w-full">
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform" />
                <span className="relative">Launch Jet</span>
              </button>
            </form>
            <div className="mt-8 text-gray-400 text-lg tracking-widest uppercase text-center space-y-2">
              <p className="hidden md:block">Desktop Controls:</p>
              <p className="hidden md:block">Use ⬅️ ➡️ Arrows to move &amp; SPACE to fire</p>
              <p className="md:hidden">Mobile Controls: Use on-screen buttons</p>
            </div>
          </motion.div>
        )}

        {(gameState === 'PLAYING' || gameState === 'BOSS_WARNING' || gameState === 'BOSS_FIGHT') && <HUD />}
        {gameState === 'BOSS_WARNING' && <WarningScreen />}

        {(gameState === 'GAME_OVER' || gameState === 'VICTORY') && (
          <motion.div key="end" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md pointer-events-auto">
            <motion.div initial={{ scale: 0.8, y: 20 }} animate={{ scale: 1, y: 0 }} className="text-center mb-12">
              <h2 className={`text-7xl font-black tracking-tighter mb-4 ${gameState === 'VICTORY' ? 'text-green-400' : 'text-red-500'}`}>
                {gameState === 'VICTORY' ? 'YOU WIN' : 'GAME OVER'}
              </h2>
              <p className="text-gray-300 text-2xl font-bold uppercase tracking-widest">
                Final Score: <span className="text-white">{score}</span>
              </p>
            </motion.div>
            <div className="flex gap-4">
              <button onClick={resetGame}
                className="px-8 py-4 bg-white text-black font-bold text-xl rounded-xl uppercase tracking-widest transition-transform hover:scale-105 active:scale-95">
                Play Again
              </button>
              <button onClick={() => setGameState('MENU')}
                className="px-8 py-4 bg-transparent border-2 border-white/20 text-white font-bold text-xl rounded-xl uppercase tracking-widest hover:bg-white/10">
                Main Menu
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// PRELOADER
// ─────────────────────────────────────────────────────────────────────────────
const Preloader: React.FC<{ onLoaded: () => void }> = ({ onLoaded }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const images = Array.from(new Set([
      ...Object.values(getImagesByProfile('REGULAR')),
      ...Object.values(getImagesByProfile('DEVIL')),
    ]));
    const sounds = Array.from(new Set([
      ...Object.values(getSoundFilesByProfile('REGULAR')),
      ...Object.values(getSoundFilesByProfile('DEVIL')),
    ]));
    const total = images.length + sounds.length;
    let loaded = 0;

    const tick = () => {
      loaded++;
      setProgress(Math.floor((loaded / total) * 100));
      if (loaded >= total) setTimeout(onLoaded, 500);
    };

    images.forEach(src => { const img = new Image(); img.onload = tick; img.onerror = tick; img.src = src; });
    sounds.forEach(src => { const audio = new Audio(); audio.oncanplaythrough = tick; audio.onerror = tick; audio.src = src; audio.load(); });
  }, [onLoaded]);

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black text-white">
      <h1 className="text-4xl font-bold mb-8 text-cyan-400 tracking-widest uppercase">Loading Assets</h1>
      <div className="w-64 h-4 bg-gray-800 rounded-full overflow-hidden border border-cyan-500/30">
        <div className="h-full bg-cyan-500 transition-all duration-200 ease-out" style={{ width: `${progress}%` }} />
      </div>
      <p className="mt-4 text-cyan-500/70 font-mono">{progress}%</p>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// THREE.JS CANVAS SCENE
// ─────────────────────────────────────────────────────────────────────────────
const GameScene: React.FC = () => (
  <div className="absolute inset-0 bg-black">
    <Canvas camera={{ position: [0, -5, 20], fov: 60 }}>
      <color attach="background" args={['#050510']} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 20, 10]} intensity={1.5} />
      <pointLight position={[0, -10, 0]} intensity={2} color="#00ffff" distance={20} />
      <Suspense fallback={null}>
        <PlayerMesh />
        <EnemiesScene />
        <ProjectilesScene />
        <PowerUpsScene />
        <CollisionSystem />
        <SceneEffects />
      </Suspense>
    </Canvas>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// ROOT EXPORT — drop <JetFighterGame /> anywhere to embed the full game
// ─────────────────────────────────────────────────────────────────────────────
export default function JetFighterGame() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const unlock = () => { preloadAudioBuffers(); document.removeEventListener('click', unlock); document.removeEventListener('touchstart', unlock); };
    document.addEventListener('click', unlock);
    document.addEventListener('touchstart', unlock);
    return () => { document.removeEventListener('click', unlock); document.removeEventListener('touchstart', unlock); };
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      {!isLoaded && <Preloader onLoaded={() => setIsLoaded(true)} />}
      {isLoaded && (
        <>
          <GameScene />
          <GameUI />
        </>
      )}
    </div>
  );
}
