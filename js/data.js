/* Grok Pickleball - constants, courts, opponents, shop */
(function () {
  'use strict';
  const PB = window.PB;
  const D = PB.D = {};
  // real court in metres: 20 ft x 44 ft, kitchen 7 ft, net 36 in at the posts / 34 in in the middle
  D.HW = 3.048; D.HL = 6.705; D.K = 2.134; D.NET_SIDE = 0.914; D.NET_MID = 0.864; D.POST = 3.35; D.BR = 0.037;
  D.netH = (x) => { const t = Math.min(1, Math.abs(x) / D.HW); return D.NET_MID + (D.NET_SIDE - D.NET_MID) * t * t; };

  D.DIFF = {
    easy:   { n: 'Easy',   react: 0.36, speed: 0.76, aim: 0.74, err: 0.09, clear: 0.4, power: 0.72, smart: 0.3, kitchenSlip: 0.03, reach: 0.96, pace: 0.86 },
    medium: { n: 'Medium', react: 0.28, speed: 0.85, aim: 0.58, err: 0.065, clear: 0.32, power: 0.85, smart: 0.5, kitchenSlip: 0.015, reach: 1.0, pace: 0.92 },
    hard:   { n: 'Hard',   react: 0.23, speed: 0.91, aim: 0.47, err: 0.05, clear: 0.27, power: 0.92, smart: 0.66, kitchenSlip: 0.008, reach: 1.03, pace: 0.97 },
    pro:    { n: 'Pro',    react: 0.18, speed: 0.97, aim: 0.38, err: 0.04, clear: 0.22, power: 1.0, smart: 0.8, kitchenSlip: 0.003, reach: 1.06, pace: 1.02 }
  };
  D.DIFF_ORDER = ['easy', 'medium', 'hard', 'pro'];

  D.COURTS = [
    { id: 'park', n: 'Sunny Park', icon: '🌳', desc: 'Blue courts, big trees and a fountain.', court: '#2f7fd6', out: '#3fae5a', line: '#ffffff', kitchen: '#2a6fc0', sky: ['#5fb8ff', '#d9f1ff'], night: false, price: 0 },
    { id: 'gym', n: 'Grok Gym', icon: '🏀', desc: 'Shiny wood floor, bleachers and banners.', court: '#e98a2d', out: '#c98b4e', line: '#ffffff', kitchen: '#d8761d', sky: ['#3a2a55', '#5a4580'], night: false, indoor: true, price: 0 },
    { id: 'beach', n: 'Pickle Beach', icon: '🏖️', desc: 'Sand, waves, palm trees and sunshine.', court: '#18a6a8', out: '#f0d79a', line: '#ffffff', kitchen: '#139093', sky: ['#41b6ff', '#ffe9b8'], night: false, price: 150 },
    { id: 'roof', n: 'Rooftop Nights', icon: '🌃', desc: 'City lights, string lights and stars.', court: '#5b3fc4', out: '#3a3f4f', line: '#ffffff', kitchen: '#4c33a8', sky: ['#0b1030', '#2b2a6b'], night: true, price: 250 },
    { id: 'vegas', n: 'Neon Vegas', icon: '🎰', desc: 'Neon signs, spotlights and a big crowd.', court: '#16162a', out: '#241a3a', line: '#ff4fd8', kitchen: '#1f1d44', sky: ['#120022', '#3d0b55'], night: true, neon: true, price: 400 }
  ];
  D.court = (id) => D.COURTS.find((c) => c.id === id) || D.COURTS[0];

  // career ladder: opponents with personalities (style weights: dink, drive, lob, smash pref)
  D.LADDER = [
    { id: 'dana', n: 'Dinkin\u2019 Dana', diff: 'easy', court: 'park', style: { dink: 1.6, drive: 0.6, lob: 0.6 }, look: { shirt: '#f472b6', hair: '#f6c344', hat: 'visor', skin: 0 }, intro: 'Soft and steady wins the race! Let\u2019s dink!', win: 'Dink-tastic!', lose: 'Aww, nice hands!', reward: 80 },
    { id: 'larry', n: 'Lobster Larry', diff: 'easy', court: 'beach', style: { dink: 0.6, drive: 0.8, lob: 2.2 }, look: { shirt: '#ef4444', hair: '#7c2d12', hat: 'bucket', skin: 1 }, intro: 'Look up! Everything I hit goes to the moon!', win: 'Lobbed ya!', lose: 'Pinched again\u2026', reward: 100 },
    { id: 'bruno', n: 'Bam-Bam Bruno', diff: 'medium', court: 'gym', style: { dink: 0.4, drive: 2.2, lob: 0.4, smash: 1.6 }, look: { shirt: '#f97316', hair: '#1f2937', hat: 'headband', skin: 3 }, intro: 'I only have one speed: FAST!', win: 'BAM!', lose: 'Too much power\u2026 not enough control.', reward: 130 },
    { id: 'gert', n: 'Granny Gert', diff: 'medium', court: 'park', style: { dink: 1.8, drive: 0.7, lob: 1.2 }, look: { shirt: '#a78bfa', hair: '#e5e7eb', hat: 'none', skin: 0, glasses: 1 }, intro: 'I\u2019ve been playing since before you were born, sweetie.', win: 'Respect your elders!', lose: 'Well played, young one.', reward: 160 },
    { id: 'nico', n: 'Neon Nico', diff: 'hard', court: 'roof', style: { dink: 1.0, drive: 1.4, lob: 0.7, smash: 1.3 }, look: { shirt: '#22d3ee', hair: '#ff4fd8', hat: 'none', skin: 2, glasses: 1 }, intro: 'The city never sleeps, and neither does my backhand.', win: 'Lights out!', lose: 'You glow, friend.', reward: 200 },
    { id: 'sasha', n: 'Smash Sasha', diff: 'hard', court: 'gym', style: { dink: 0.8, drive: 1.3, lob: 0.5, smash: 2.4 }, look: { shirt: '#facc15', hair: '#111827', hat: 'cap', skin: 4 }, intro: 'Pop it up and it\u2019s GONE.', win: 'Smashed it!', lose: 'You kept it low. Smart.', reward: 240 },
    { id: 'kai', n: 'Coach Kai', diff: 'pro', court: 'beach', style: { dink: 1.3, drive: 1.1, lob: 0.8, smash: 1.2 }, look: { shirt: '#10b981', hair: '#3f2a1d', hat: 'cap', skin: 2 }, intro: 'Patience. Third shot drop. Win the kitchen.', win: 'Good lesson today!', lose: 'The student beats the teacher!', reward: 300 },
    { id: 'king', n: 'The Pickle King', diff: 'pro', court: 'vegas', style: { dink: 1.2, drive: 1.3, lob: 0.9, smash: 1.6 }, look: { shirt: '#65a30d', hair: '#fbbf24', hat: 'crown', skin: 1 }, intro: 'Kneel before the King of the Kitchen!', win: 'Long live the King!', lose: 'A new champion is crowned! \u{1F451}', reward: 500, boss: true }
  ];
  D.AI_NAMES = ['Pickle Pete', 'Rally Rita', 'Dinky Dee', 'Volley Val', 'Spin Sam', 'Lob Lou', 'Ace Ava', 'Net Ned'];
  D.SKINS = ['#ffd7b5', '#f1c095', '#d9a066', '#a8704a', '#7a4b2e'];

  // shop (cosmetic only, so matches stay fair)
  D.PADDLES = [
    { id: 'classic', n: 'Classic Green', a: '#22c55e', b: '#14532d', price: 0 },
    { id: 'sunset', n: 'Sunset Swirl', a: '#fb923c', b: '#db2777', price: 120 },
    { id: 'ocean', n: 'Ocean Wave', a: '#38bdf8', b: '#1e3a8a', price: 120 },
    { id: 'pickle', n: 'The Pickle', a: '#84cc16', b: '#3f6212', price: 200, pickle: true },
    { id: 'lava', n: 'Lava Core', a: '#ef4444', b: '#111827', price: 260, glow: '#ff7a1a' },
    { id: 'galaxy', n: 'Galaxy', a: '#7c3aed', b: '#0f172a', price: 320, glow: '#a78bfa' },
    { id: 'gold', n: 'Golden Grok', a: '#fcd34d', b: '#b45309', price: 600, gloss: true },
    { id: 'neon', n: 'Neon Nights', a: '#ff4fd8', b: '#22d3ee', price: 450, glow: '#ff4fd8' }
  ];
  D.OUTFITS = [
    { id: 'starter', n: 'Starter Tee', shirt: null, shorts: '#1f2937', hat: 'cap', price: 0 },
    { id: 'pro', n: 'Pro Polo', shirt: '#ffffff', shorts: '#1e40af', hat: 'visor', price: 100 },
    { id: 'beach', n: 'Beach Bum', shirt: '#fde047', shorts: '#f97316', hat: 'bucket', price: 140 },
    { id: 'sweat', n: 'Sweatband Hero', shirt: '#ef4444', shorts: '#ffffff', hat: 'headband', price: 160 },
    { id: 'pickle', n: 'Pickle Suit', shirt: '#65a30d', shorts: '#365314', hat: 'pickle', price: 300 },
    { id: 'royal', n: 'Royal Robes', shirt: '#7c3aed', shorts: '#fbbf24', hat: 'crown', price: 500 }
  ];
  D.CELEBS = [
    { id: 'fist', n: 'Fist Pump', icon: '✊', price: 0 },
    { id: 'jump', n: 'Victory Jump', icon: '🙌', price: 0 },
    { id: 'spin', n: 'Paddle Spin', icon: '🌀', price: 90 },
    { id: 'dance', n: 'Pickle Dance', icon: '💃', price: 150 },
    { id: 'flip', n: 'Backflip', icon: '🤸', price: 250 },
    { id: 'bow', n: 'Royal Bow', icon: '🙇', price: 120 }
  ];
  D.TAUNTS = [
    { id: 'wave', t: '👋 Hiii!', price: 0 }, { id: 'cool', t: '😎 Too easy', price: 0 }, { id: 'pickle', t: '🥒 Get pickled!', price: 60 },
    { id: 'kitchen', t: '🍳 Welcome to my kitchen', price: 80 }, { id: 'gg', t: '🤝 Good game!', price: 0 }, { id: 'oops', t: '😅 Oops!', price: 0 }
  ];
  D.SHIRTS = ['#3b82f6', '#ff4fd8', '#22c55e', '#f97316', '#a855f7', '#ef4444', '#14b8a6', '#facc15'];
})();
