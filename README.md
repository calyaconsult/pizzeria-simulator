# 🍕 Pizzeria Simulator

A browser-based, interactive simulation of a pizzeria's daily operations. Step into the shoes of a pizzeria manager: watch customers arrive, orders flow in, inventory deplete, and revenue accumulate — one 15-minute round at a time.

Built as a single self-contained HTML file (no dependencies, no build step), this project demonstrates how a simple **discrete-time state-machine simulation** can model a realistic business process with emergent behavior like stock-outs, bottlenecks, and demand-driven revenue curves.

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)

---

## 🎮 Live Demo

Simply open the HTML file in any modern browser — no server required:

- **Simple version:** [`simple-standalone.html`](simple-standalone.html)
- **With demand curve:** [`with-demand-curve-standalone.html`](with-demand-curve-standalone.html)

## 🛠️ HTML / CSS / Javascript in separare files

This structure follows the general conventions of web development

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

┌─────────────────────────────────────────────────┐
│                  SYSTEM STATE                    │
│   💰 Revenue    📦 Inventory    👥 Customers     │
└────────────────────┬────────────────────────────┘
│
┌─────────▼──────────┐
│   ROUND (15 min)   │ ← triggered by button
└─────────┬──────────┘
│
┌───────────────▼───────────────────┐
│  1. Determine customer count      │
│     × demand multiplier (curve)   │
│  2. For each customer:            │
│     • Pick random available pizza │
│     • Maybe pick a random drink   │
│  3. Deduct ingredients from stock │
│  4. Add prices to revenue         │
│  5. Check for stock-outs          │
│  6. Update dashboard              │
└──────────────────────────────────┘

### Key Design Principles

- **State is fully defined** at each tick → easy to inspect, log, or extend
- **Constraints are declarative** → `pizza ∈ available_pizzas`, `drink ∈ available_drinks`
- **Emergent behavior** arises naturally → stock-outs, revenue peaks, bottleneck identification
- **Zero dependencies** → pure HTML + CSS + JS in a single file

---

## 🍕 Menu & Recipes

### Pizzas

| Pizza | Price (CHF) | Flour | Sauce | Cheese | Special Ingredient |
|---|---|---|---|---|---|
| Margherita | 14.50 | 250g | 80g | 125g | — |
| Diavola | 18.00 | 250g | 80g | 125g | Salami 50g |
| Prosciutto | 17.50 | 250g | 80g | 125g | Ham 60g |
| Quattro Formaggi | 19.00 | 250g | 60g | 200g | — |
| Vegetariana | 16.00 | 250g | 80g | 100g | Vegetables 120g |
| Tonno | 17.00 | 250g | 80g | 100g | Tuna 70g |

### Drinks

| Drink | Price (CHF) |
|---|---|
| Cola | 4.50 |
| Fanta | 4.50 |
| Water | 3.00 |
| Beer | 6.00 |
| House Wine | 8.00 |

> 70% of customers order a drink (configurable).

---

## 📐 The Math Behind the Defaults

The default inventory is calibrated for a full 8–12 hour day:

- **Flour**: 30,000g ÷ 250g/pizza = **120 pizzas max**
- **Avg customers/round** (with demand curve): ~3.5
- **120 ÷ 3.5 ≈ 34 rounds** → comfortably covers a typical day, with flour running out toward the end — just like in a real pizzeria

Flour and cheese are the **universal bottleneck** (every pizza needs them), while niche ingredients like tuna and salami last much longer. This asymmetry is one of the key insights the simulation reveals.

---

## ⚙️ Configuration

Both versions include a **Settings panel** (⚙️ button) where you can adjust:

| Parameter | Default | Description |
|---|---|---|
| Min customers/round | 1 | Lower bound (before demand multiplier) |
| Max customers/round | 6 | Upper bound (before demand multiplier) |
| Drink probability | 0.7 | Chance a customer also orders a drink |
| All inventory items | (see defaults) | Starting stock for every ingredient and drink |

Changes take effect on reset.

---

## 🚀 Getting Started

```bash
# Clone the repo
git clone https://github.com//pizzeria-simulator.git

# Open either version in your browser
open simple/index.html
open with-demand-curve/index.html

No npm install. No webpack. No build step. Just open and play. 🎮

💡 Possible Extensions

💰 Cost & Profit Tracking — Add ingredient costs to compute gross margin per round
📦 Restock Mechanic — Mid-day restocking with delivery delay and cost
📈 Charts — Revenue curve and inventory depletion over time (e.g., with Chart.js)
🏆 Scoring System — End-of-day performance score based on customers served, profit, and uptime
👨‍🍳 Oven Capacity — Max pizzas per round as a throughput constraint
📊 Monte Carlo Mode — Auto-run 1,000 days and show statistical distributions of outcomes
🎯 Weighted Menu Preferences — Margherita ordered 3× more often than Tonno

🧰 Tech Stack

**Markup & Layout:** HTML5

**Styling:** CSS3 (Grid, Flexbox, transitions)

**Logic & Simulation:** Vanilla JavaScript (ES6+)

**Dependencies:** None

📄 License
This project is licensed under the MIT License.

🙏 Acknowledgments
Built with the help of Swisscom myAI as an exercise in interactive business process simulation.

---

## 📁 Suggested Structure

pizzeria-simulator/
├── README.md
├── LICENSE
├── simple/
│   └── index.html
│   └── css
│   │   └── style.css
│   └── js
│       └── script.js
└── with-demand-curve/
    └── index.html
    └── css
    │   └── style.css
    └── js
        └── script.js
