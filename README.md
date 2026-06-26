# 💸 Smart Spend — Personal Expense Tracker

<div align="center">

![Smart Spend Banner](assets/div.png)

**A clean, responsive personal finance web app for tracking expenses, managing budgets, and visualizing spending habits.**

[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Chart.js](https://img.shields.io/badge/Chart.js-FF6384?style=for-the-badge&logo=chartdotjs&logoColor=white)](https://www.chartjs.org/)

</div>

---

## 📋 Table of Contents

- [About the Project](#-about-the-project)
- [Features](#-features)
- [Pages Overview](#-pages-overview)
- [Project Structure](#-project-structure)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Screenshots](#-screenshots)
- [Color Palette](#-color-palette)
- [Contributing](#-contributing)

---

## 🧾 About the Project

**Smart Spend** is a front-end web application designed to help users track their personal expenses, monitor their monthly budget, and analyze their spending patterns through interactive charts and reports.

The project is built with **pure HTML, CSS, and Vanilla JavaScript** — no frameworks, no build tools required. It is fully responsive and works seamlessly on desktop, tablet, and mobile devices.

> ⚠️ **Note:** This is a front-end only project. All data is stored in-memory (JavaScript arrays) and resets on page refresh. No backend or database is connected.

---

## ✨ Features

### 🏠 Dashboard
- 📊 **Monthly Spending Card** — displays total spending with a quick-add button
- 💰 **Budget Progress Bar** — visual indicator that changes color based on usage (green → orange → red)
- ⚠️ **Budget Alert** — warning banner when 100% of the budget is reached
- 📈 **Spending Trend Chart** — line chart showing spending over 9 months
- 🍩 **Category Breakdown Chart** — doughnut chart with 7 expense categories
- 🧾 **Recent Transactions Table** — with edit and delete functionality
- ➕ **Add Expense Modal** — add new expenses with amount, category, and date

### 📊 Reports
- Summary cards: Biggest Spending, Total Savings, Daily Average
- Shared spending trend and category breakdown charts
- Smart Financial Tip banner with spending advice

### 📋 Expense List
- Full paginated expense table (9 items per page)
- 🔍 **Live Search** — filter by category or amount
- 🔃 **Sort** — by date or amount
- ✏️ **Edit Amount** via modal
- 🗑️ **Delete Expense** with confirmation modal
- Payment method display (Visa / Mastercard SVG logos)

### 👤 Account
- User profile card with verified badge
- Personal details form (name, email, password)
- **Category Management** — color-coded category pills
- **Monthly Budget Editor** — live progress bar updates as you type
- Save budget with success feedback animation

### 🔐 Auth Pages
- Login page with email + password fields
- Register page with full name, email, and confirm password
- "Continue with Google" button
- Responsive two-column layout (illustration + form)

---

## 📄 Pages Overview

| Page | File | Description |
|---|---|---|
| Login | `login.html` | User sign-in form |
| Register | `register.html` | New account creation form |
| Dashboard | `dashboard.html` | Main overview with charts & transactions |
| Reports | `reports.html` | Financial summary & spending analysis |
| Expense List | `expense-list.html` | Full paginated expense management table |
| Account | `account.html` | Profile settings & budget configuration |

---

## 📁 Project Structure

```
smart-spend/
│
├── 📄 login.html               ← Login page
├── 📄 register.html            ← Registration page
├── 📄 dashboard.html           ← Main dashboard
├── 📄 reports.html             ← Reports & analytics
├── 📄 expense-list.html        ← Full expense list
├── 📄 account.html             ← Account settings
│
├── 📂 css/
│   ├── base.css                ← CSS variables, reset, typography
│   ├── navbar.css              ← Navigation bar + mobile hamburger menu
│   ├── auth.css                ← Login & Register page styles
│   ├── components.css          ← Shared: Card, Chart, Modal, Budget Alert
│   ├── dashboard.css           ← Dashboard-specific styles
│   ├── reports.css             ← Reports-specific styles
│   ├── expense-list.css        ← Expense list table & pagination
│   └── account.css             ← Account profile & budget editor
│
├── 📂 js/
│   ├── navbar.js               ← Mobile hamburger menu toggle (shared)
│   ├── charts.js               ← Line chart & doughnut chart (shared)
│   ├── dashboard.js            ← Dashboard interactive logic
│   ├── expense-list.js         ← Expense list: search, sort, pagination, CRUD
│   └── account.js              ← Account: budget tracker & save feedback
│
└── 📂 assets/
    ├── Group.png               ← App logo
    ├── image 2 (1).png         ← Auth page illustration
    ├── div.png                 ← Dashboard hero illustration
    └── 1764004502255.JPG       ← User avatar
```

### CSS Architecture

Each CSS file has a single, clear responsibility:

| File | Responsibility | Used On |
|---|---|---|
| `base.css` | CSS custom properties, reset, body font | All pages |
| `navbar.css` | Navbar layout, links, buttons, mobile menu | App pages |
| `auth.css` | Two-column auth layout, form controls, buttons | Login, Register |
| `components.css` | Cards, charts, modals, budget progress, alerts | App pages |
| `dashboard.css` | Transactions table, badges, illustration card | Dashboard |
| `reports.css` | Reports header, summary cards, tip banner | Reports |
| `expense-list.css` | Expense table, search, sort, pagination | Expense List |
| `account.css` | Profile card, form grid, category pills, budget input | Account |

### JavaScript Architecture

| File | Responsibility | Pattern |
|---|---|---|
| `navbar.js` | Mobile hamburger menu toggle | Shared, event-driven |
| `charts.js` | `initSpendingTrendChart()` & `initCategoryBreakdownChart()` | Factory functions |
| `dashboard.js` | Budget tracking, add/edit/delete transactions | State + DOM manipulation |
| `expense-list.js` | Full CRUD, search, sort, pagination | State management |
| `account.js` | Budget editor with live progress bar | Event-driven |

---

## 🛠️ Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| HTML5 | — | Page structure & semantics |
| CSS3 | — | Styling, animations, responsive layout |
| Vanilla JavaScript | ES6+ | All interactivity and logic |
| [Chart.js](https://www.chartjs.org/) | Latest CDN | Line & Doughnut charts |
| [Lucide Icons](https://lucide.dev/) | Latest CDN | SVG icon library |
| [Google Fonts — Inter](https://fonts.google.com/specimen/Inter) | — | Typography |

---

## 🚀 Getting Started

No installation or build step required. This is a pure static website.

### Option 1: Open Directly
Simply open any HTML file in your browser:
```
login.html
```

### Option 2: Live Server (Recommended)
If you use **VS Code**, install the [Live Server extension](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) and click **"Go Live"** on any HTML file.

### Option 3: Any Static File Server
```bash
# Python
python -m http.server 5500

# Node.js (npx)
npx serve .
```
# Firebase CLI
npx -y firebase-tools@latest emulators:start

Then navigate to `http://localhost:5500/dashboard.html`

---

## 🎨 Color Palette

| Role | Color | Hex |
|---|---|---|
| Primary Green | ![#125e3a](https://placehold.co/16x16/125e3a/125e3a.png) | `#125e3a` |
| Primary Light | ![#dcfce7](https://placehold.co/16x16/dcfce7/dcfce7.png) | `#dcfce7` |
| Warning Amber | ![#f59e0b](https://placehold.co/16x16/f59e0b/f59e0b.png) | `#f59e0b` |
| Danger Red | ![#ef4444](https://placehold.co/16x16/ef4444/ef4444.png) | `#ef4444` |
| Text Main | ![#111827](https://placehold.co/16x16/111827/111827.png) | `#111827` |
| Text Secondary | ![#6b7280](https://placehold.co/16x16/6b7280/6b7280.png) | `#6b7280` |
| Page Background | ![#f4f7f6](https://placehold.co/16x16/f4f7f6/f4f7f6.png) | `#f4f7f6` |

---

## 📱 Responsive Breakpoints

| Breakpoint | Target | Changes |
|---|---|---|
| `> 1024px` | Desktop | Full multi-column grid layout |
| `≤ 1024px` | Tablet | Bottom row collapses to single column |
| `≤ 768px` | Mobile | Hamburger menu, stacked cards, hidden table columns |

---

## 📦 Dependencies (CDN)

All dependencies are loaded via CDN — no `npm install` needed.

```html
<!-- Icons -->
<script src="https://unpkg.com/lucide@latest"></script>

<!-- Charts (Dashboard & Reports only) -->
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

<!-- Typography (loaded in base.css) -->
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
```

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m 'Add: your feature description'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a Pull Request

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

<div align="center">
  <p>Built with ❤️ — Smart Spend &copy; 2026</p>
</div>
#   g r a d u a t i o n 
 
 