# Bent Metal Derby

**Browser demolition derby and racing game — ram, wreck, drift, repeat.**

Five vehicle classes. Three arena types. A persistent career with upgrades. Everything runs in a single HTML file with no server required.

MIT License — fork it, mod it, ship your own version.

---

## How to Play

Open `bent-metal-derby.html` in any modern browser. No install, no build step.

### Controls

| Action | Key |
|---|---|
| Accelerate | W / ↑ |
| Brake / Reverse | S / ↓ |
| Steer | A / D or ← → |
| Handbrake | Space |
| Nitro | Shift |
| Camera reverse | Hold S / ↓ while reversing |
| Pause | Escape |

On mobile, on-screen touch buttons appear automatically.

---

## Arenas

Each round drops you into a randomly chosen arena:

**Derby** — A circular dirt pit surrounded by bleachers. Be the last car running. No laps, no finish line — pure carnage. Wrecking every rival banks the full point haul.

**Oval Race** — A banked oval with jump ramps and scattered barrels. Three laps, and rivals will absolutely ram you on the straights. Your combat score is multiplied by your finish position: 1st keeps 100%, 2nd keeps 50%, 3rd keeps 25%, 4th or lower keeps nothing.

**City Circuit** — A tight 90° street course with solid buildings, sidewalks you can cut across, and no margin for error in the corners. Three laps, same placement multiplier as the oval.

All arenas can be day or night, and the track surface switches between grass and dirt at random.

---

## Scoring

| Event | Points |
|---|---|
| Hit landed | 150 |
| Car wrecked | 1,200 |
| Fatality (wrecked by your direct hit) | bonus |
| Last car running / race win | 3,000 |
| Drift chain (banked on break) | varies |

**Drift scoring** — slide the car sideways at speed to build a drift meter. The multiplier climbs (up to ×5) the longer you sustain it. Banking the chain scores the total; spinning out or stopping resets it to zero.

**Race placement** multiplies your combat earnings for that round: finish 4th or worse and you bank nothing from hits or wrecks, so racing clean and fighting dirty at the same time is the real skill.

---

## Career System

Progress carries over between sessions via `localStorage`.

**Lives** — you start each career run with 3 lives. Losing a round costs one. Running out of lives ends the run (you can spend a life to continue if you have one left).

**Cash** — earned each round from your combat score, with a placement bonus on races. Cash persists between rounds and is spent in the Garage.

**Upgrades** — each vehicle has its own independent upgrade track with four stats, each upgradeable up to five levels. Upgrades apply only when that vehicle is selected.

| Upgrade | Effect |
|---|---|
| Engine | Top speed and acceleration |
| Armor | More health, tougher shell |
| Ram | Your hits deal more damage |
| Grip | Cornering and traction |

Upgrade cost rises per level: `$200 + (level × $250)`. A fully maxed stat costs `$200 + $250 + $500 + $750 + $1,000 = $2,700` across five levels.

**Switching vehicles** — you can change your ride between rounds from the win/loss screen or by opening the Garage. Each vehicle keeps its own separate upgrade progress.

---

## Vehicles

| Class | Role | Notes |
|---|---|---|
| **Car** | Balanced all-rounder | Solid everywhere, master of nothing |
| **Truck** | Tough hauler | Hits hard and takes hits, steady pace |
| **Van** | Armoured battering ram | Toughest and hardest-hitting, but slow and wide |
| **Buggy** | Featherweight rocket | Blistering acceleration and cornering, made of glass |
| **Muscle** | Speed demon | Highest top end, light on armour and grip, loose in the bends |

Damage is physics-based and asymmetric — the faster car in a collision takes more of the impact. Rear hits do the most damage (×1.6), fronts the least (×0.65), sides in the middle (×1.25). Head-ons hurt both cars.

Cars accumulate visible damage: panel deformation deepens as health drops below 75%, and a wrecked car crumples completely, stays on the field, and can still be rammed and rolled.

---

## Power-ups

Glowing pickups spawn around the arena during a round. Drive over them to collect.

| Power-up | Effect |
|---|---|
| **Repair** | Restores 45 health |
| **Nitro** | Boosts engine power to 1.7× for several seconds |
| **Shield** | Absorbs all incoming damage for 6 seconds |
| **2× DMG** | Doubles the damage your hits deal for a short time |

---

## Difficulty

Choose before the first round. Affects AI aggression and how hard enemies hit you.

| Level | AI aggro | Damage to player | Extra rival |
|---|---|---|---|
| Easy | 78% | 65% | — |
| Normal | 100% | 100% | — |
| Hard | 120% | 135% | +1 |

Harder difficulties also field more opponents as rounds progress.

---

## Modding

The entire game is one self-contained HTML file (~3,000 lines). No bundler, no dependencies beyond Three.js r128 loaded from CDN. Everything — physics constants, vehicle stats, arena generation, audio, UI — is in one place and clearly commented.

Key constants near the top of the file:

```js
const HIT_PTS = 150;        // points per hit landed
const WRECK_PTS = 1200;     // points per car wrecked
const WIN_BONUS = 3000;     // bonus for winning the round
const HIT_THRESHOLD = 7.0;  // m/s closing speed to count as a hit vs. grind
const GRIND_DPS = 5.0;      // damage per second during a sustained grind
```

Vehicle stats are in the `VEHICLES` object. Each class has multipliers for `engine`, `drag`, `brake`, `grip`, `turn`, `health`, `ram`, and `massMul`. The upgrade system scales `engine`, `armor`, `ram`, and `grip` by 7–10% per level.

---

## License

MIT License — Copyright (c) 2026 Fedge No

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
