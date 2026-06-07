# 🐍 Killer Ultimate Snake Game

🚀 **Live Deployment URL:** [https://killer-ultimate-snake-game.vercel.app/](https://killer-ultimate-snake-game.vercel.app/)

[![Live Deployment](https://img.shields.io/badge/vercel-live--demo-success.svg?logo=vercel)](https://killer-ultimate-snake-game.vercel.app/)
[![React Version](https://img.shields.io/badge/react-v19.0-blue.svg)](https://react.dev/)
[![Vite Version](https://img.shields.io/badge/vite-v6.2-purple.svg)](https://vite.dev/)
[![Tailwind CSS](https://img.shields.io/badge/tailwind--css-v4.0-38bdf8.svg)](https://tailwindcss.com/)


An arcade-inspired, feature-rich, high-performance modern web recreation of the classic **Snake** game built with **React**, **Vite**, **TypeScript**, and **Tailwind CSS**. Packed with multiple game modes, visual skins, board themes, custom achievements, live statistics, dynamic particle effects, sound options, a voice assistant, and an AI Gameplay Coach!

---

## 🎮 Game Modes

Explore **7 unique gameplay modes** tailored for different styles and skill levels:

1. **Classic**: The pure, standard experience—grow your snake and avoid walls and self-collision.
2. **Endless**: Play indefinitely with wrapping walls; no boundary collisions.
3. **Timed**: Race against the clock! Eat food to extend your time limit.
4. **Survival**: Dynamic hazards (brick obstacles) generate randomly over time to block your path.
5. **Maze**: Face solid custom-designed chambers and walls that challenge your maneuvering skills.
6. **Speedrun**: Race to reach a target snake length of 25 nodes as fast as possible.
7. **Boss Battle**: Fight against a smart, computer-controlled AI Snake competitor and avoid hostile pursuit drones!

---

## ✨ Features & Mechanics

### 🔮 Power-Ups & Special Foods
- 🍏 **Standard Food**: The baseline nutrient to grow and score points.
- 🌟 **Golden Apple**: Grants 3x length growth and +50 points!
- ⚡ **Speed Boost & Slow Down**: Eat special items to accelerate or slow down the game's pace.
- 🛡️ **Shield (Immunity)**: Grants 12 seconds of invulnerability from crashes.
- ✖️ **Score Multiplier**: Temporarily doubles all points earned.
- ✂️ **Shrink Potion**: Trims your tail length by 3 segments to escape tight situations.

### 🎨 Visual & Theme Customizations
- **9 Unique Skins**: Classic, Neon, Gradient, Rainbow, Outline, Fire, Ice, Robot, and Dragon.
- **11 Board Themes**: Cyberpunk, Space, Jungle, Ocean, Desert, Dark, Retro, High-Contrast, Pastel, Grid, and Default.

### 🤖 Smart AI Competitors & Gameplay Coach
- **AI Competitor**: Cooperative or competitive computer snake utilizing greedy Manhattan distance heuristics to navigate.
- **AI Gameplay Coach**: Analyzes your path efficiency, reaction speed, and risk level to provide live vocal and visual feedback.

### 🔊 Interactive Audio & Settings
- Fully integrated sound effects (eating, power-ups, crashes) and background music tracks.
- Web Speech API integration for live voice cues and audio coaching reports.
- Advanced sliders to customize starting length, food spawn rates, hazard density, wall wrapping, and accessibility features (e.g., colorblind modes, reduced animation settings, UI sizing).

### 🏆 Stats, Achievements, & Replay
- **Cumulative Stats**: Tracks total play time, total food consumed, high scores, average scores, and score histories.
- **Achievements**: Unlock custom badges like *Beginner Slither*, *Fruit Devourer*, *Survival Expert*, and *Grandmaster Elite*.
- **Replay System**: Review an interactive replay of your snake's path immediately after a game-over screen!

---

## 🛠️ Tech Stack

- **Framework**: React 19 (TypeScript)
- **Bundler & Dev Server**: Vite 6
- **Styling**: Tailwind CSS 4
- **Animation**: Motion (Framer Motion)
- **Icons**: Lucide React
- **Audio & Vocal Synthesis**: Web Audio API & Web Speech Synthesis API
- **Rendering**: HTML5 Canvas (Particle System & Grid)

---

## 🚀 Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed.

### Installation & Run
1. Clone this repository:
   ```bash
   git clone https://github.com/Muhammad-Waleed-ur-Rehman/Ultimate-Killer-Snake-Game.git
   cd Ultimate-Killer-Snake-Game
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the local development server:
   ```bash
   npm run dev
   ```
   Open your browser to `http://localhost:3000` to start playing!

4. Build for production:
   ```bash
   npm run build
   ```

5. Preview the production build:
   ```bash
   npm run preview
   ```

---

## 🌐 Deployment to Vercel

Deploy your application instantly to Vercel with zero configuration:

```bash
# Deploy to Vercel
npx vercel --prod --yes
```

---

*Enjoy the Killer Snake experience and aim for the high score!* 🐍👑
