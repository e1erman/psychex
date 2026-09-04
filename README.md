# Psychex

**Psychex** is a desktop application for Windows that lets you download, manage and run Roblox executors (EXC) — both for Windows and for Android (via VM).

Built with [Tauri v2](https://tauri.app/) and the [Obsidian](https://mspaint.cc) UI library.

---

## Supported Executors

### Windows & Android

| Executor | Platform | Status |
|---|---|---|
| **Delta** | Android | ✅ Supported |
| **Potassium** | Android | 🔜 Planned |
| **Synapse Z** | Windows | 🔜 Planned |
| **Ronix** | Windows & Android | 🔜 Planned |
| **Pearl** | Windows & Android | 🔜 Planned |
| **Volt** | Windows | 🔜 Planned |
| **Wave** | Windows | 🔜 Planned |
| **Velocity** | Windows | 🔜 Planned |
| **Madium** | Windows | 🔜 Planned |

### macOS

| Executor | Platform | Status |
|---|---|---|
| **Macsploit** | macOS | 🍎 Maybe Some Day |
| **Ronix macOS** | macOS | 🍎 Maybe Some Day |
| **Hydrogen** | macOS | 🍎 Maybe Some Day |

---

## Installation

Download the latest installer from the [Releases](../../releases) page and run it.

> **Requirements:** Windows 10/11 with [WebView2](https://developer.microsoft.com/en-us/microsoft-edge/webview2/) (pre-installed on Windows 11)

---

## Building from Source

**Requirements:** [Rust](https://rustup.rs/), [Node.js](https://nodejs.org/)

```bash
npm install
npx tauri build
```
