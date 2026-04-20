# 🍕 Pizzeria Simulator

A browser-based, interactive simulation of a pizzeria's daily operations. Step into the shoes of a pizzeria manager: watch customers arrive, orders flow in, inventory deplete, and revenue accumulate — one 15-minute round at a time.

Built as a single self-contained HTML file (no dependencies, no build step), this project demonstrates how a simple **discrete-time state-machine simulation** can model a realistic business process with emergent behavior like stock-outs, bottlenecks, and demand-driven revenue curves.

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)

---

## 🎮 Live Demo

Simply open the HTML file in any modern browser — no server required:

- **Simple version:** [`simple/index.html`](simple/index.html)
- **With demand curve:** [`with-demand-curve/index.html`](with-demand-curve/index.html)

---

## 📦 Versions

### 🟢 Simple (`/simple`)

The baseline simulation with a flat (uniform) arrival rate.

- Random customer arrivals per round: configurable `[min, max]` range
- Random but valid orders: pizza ∈ available pizzas, drink ∈ available drinks
- Inventory tracking with color-coded progress bars
- Revenue accumulation and average order value
- Menu items automatically become unavailable on stock-out
- Configurable settings (customer range, drink probability, all inventory levels)

### 🔵 With Demand Curve (`/with-demand-curve`)

Everything in the simple version, plus a realistic time-of-day demand model.

- **12-hour business day** (11:00–23:00, 48 rounds)
- **Demand multiplier curve** with distinct phases:

  | Phase | Time | Multiplier |
  |---|---|---|
  | 🌅 Opening | 11:00–11:45 | ×0.3–0.7 |
  | 🔥 Lunch Rush | 11:45–13:45 | ×1.0–1.8 |
  | 😴 Afternoon Lull | 14:00–17:00 | ×0.2–0.4 |
  | 🔥🔥 Dinner Rush | 17:30–20:30 | ×1.2–2.0 |
  | 🌙 Evening / Last Call | 20:30–23:00 | ×0.3–0.7 |

- **Visual demand timeline** — past rounds (green), current (gold), future (dark), stock-out (red)
- **Next round forecast** showing upcoming phase, multiplier, and expected customer range
- **End-of-day summary** with total revenue, customers served/lost, and a star rating
- **Clock display** with real time-of-day labels

---

## 🏗️ How It Works

The simulation follows a straightforward **state-update loop**:

