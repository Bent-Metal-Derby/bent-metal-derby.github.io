# Bent Metal Derby

**Browser demolition derby and racing game — ram, wreck, drift, repeat.**

Five vehicle classes. Four arena types. A persistent career with upgrades. Everything runs in a single HTML file with no server required.

MIT License — fork it, mod it, ship your own version.

---

## How to Play

Open `index.html` in any modern browser or visit https://bent-metal-derby.github.io/ . No install, no build step.

### Controls

| Action | Key |
|---|---|
| Accelerate | W / ↑ |
| Brake / Reverse | S / ↓ |
| Steer | A / D or ← → |
| Handbrake | Space |
| Nitro | Activates automatically when collected |
| Camera reverse | Hold S / ↓ while reversing |
| Pause | P / Escape (controller Start) |
| Recover car | Hold R, hold the Recover button, or hold controller Y / Triangle |

On mobile, touch controls appear automatically: forward and brake/reverse on the left, steering and handbrake on the right. Multiple buttons can be held together. The pause button is at the top.

**Recovery** — slow to a stop and hold Recover for 1.5 seconds. The car returns to a clear spot behind its current race progress, keeps its damage, and waits through a 2-second restart penalty. Recovery has a 10-second cooldown and cannot revive a wreck. Pausing cancels an unfinished hold.

The desktop controls legend has an opaque dark background for contrast. Mobile race announcements, fatalities, and drift text use smaller type to keep the road visible.

---

## Arenas

Choose an arena on the start screen, or select **Mixed tour** for a random arena each round. Your arena and race-format choices are saved between visits.

**Derby** — A circular dirt pit surrounded by bleachers. Be the last car running. No laps, no finish line — pure carnage. Wrecking every rival banks the full point haul.

**Oval Race** — A banked oval with jump ramps and scattered barrels. Three laps, and rivals will absolutely ram you on the straights. Your combat score is multiplied by your finish position: 1st keeps 100%, 2nd keeps 50%, 3rd keeps 25%, 4th or lower keeps nothing.

**City Circuit** — A tight 90° street course with solid buildings, sidewalks you can cut across, and no margin for error in the corners. Three laps, same placement multiplier as the oval.

**Figure Eight** — An open circuit with a central crossing, grass or dirt runoff, and three laps. Watch for cars crossing your path.

Open road edges are drivable. Continuous walls on the paved race circuit and derby pit contain cars; tire stacks, buildings, trees, and poles block movement where they stand. Dirt races use a rally loop with gaps between the tire stacks.

All arenas can be day or night. Race and figure-eight rounds can use asphalt or dirt.

**Elimination races** — select Elimination as the race format. When the leader completes lap 1 and lap 2, the last-place car is eliminated. Survive those cuts, then race to the finish on lap 3. The position badge warns **AT RISK** when you are last. Derby rounds always use the usual last-car-running rules.

**Lap timing** — the race clock starts at GO and stops when you finish; pausing stops the clock. Each completed lap shows its time and difference from your previous best. Results include your race time and best lap. Best laps are tracked within the current race because each newly generated course has a different layout.

**Time trials and ghosts** — choose Time trial as the race format and select a paved circuit, dirt rally, city circuit, or either figure-eight surface. Each arena has a fixed course with daytime, dry weather, no rivals, and no power-ups. Finish three laps to save a translucent ghost of your fastest attempt in this browser. Ghosts cannot collide with anything, and records are separate for each arena, vehicle, and upgrade setup. Race Again repeats the course; Home returns to setup. Time trials do not spend lives or earn career cash, score, or championship points. Ghost recordings support attempts up to 30 minutes and require available browser storage.

**Opponent driving** — racers choose stable passing lanes, anticipate moving traffic and wrecks, and brake before tight corners and blocked lanes. They still make controlled contact alongside rivals on straights.

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

Cash grows more slowly than score: each hit contributes $1, wreck $20, and
fatality $10, with the existing finish-position multiplier. The finish bonus
contributes 2.5% of its score value, plus $100 for winning. Drift contributes
`floor(5 × log2(1 + round drift points / 1000))`: 1,000 drift points earn $5,
10,000 earn $17, and a million earn $49. Using the round total means splitting
one drift into many chains does not earn extra cash. Contributions add together
without a total payout cap. Fourth place or worse still earns nothing.

**Upgrades** — each vehicle has its own independent upgrade track with four stats, each upgradeable up to five levels. Upgrades apply only when that vehicle is selected.

| Upgrade | Effect |
|---|---|
| Engine | Top speed and acceleration |
| Armor | More health, tougher shell |
| Ram | Your hits deal more damage |
| Grip | Cornering and traction |

Upgrade cost rises per level: `$200 + (level × $250)`. A fully maxed stat costs `$200 + $450 + $700 + $950 + $1,200 = $3,500` across five levels.

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

Damage depends on incoming speed, ram strength, and where each car is hit. Rear hits do the most damage (×1.6), fronts the least (×0.65), sides in the middle (×1.25). Head-ons hurt both cars.

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

Hosts can load a separate script after the game and override
`Economy.transact(action, done)`. The default implementation starts races for
free and handles cash, upgrades, and won lives locally. A host can wait for a
server transaction before calling `done()` to continue, or call `done(false)`
to decline. Pending requests block duplicate actions; callbacks are one-shot.
The game owns reward calculations and the actions that follow approval.
`Economy.format()` and `Economy.livesText()` control currency/life presentation.
Standalone cash remains unchanged in meaning; Glommer maps $1 to one shared
chip and a life to 500 chips, including the life awarded for a win.

Run the regression checks with `node --test tests/game.test.cjs` (Node.js 22 or newer; no npm install needed). They cover race results, lap timing, elimination rules, ghost recordings, recovery, opponent traffic decisions, collisions, controls, terrain, retries, settings, and generated courses. Rendering and audio use stubs in these tests.

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
