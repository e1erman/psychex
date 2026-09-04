# psychex — AI Context

## What psychex is

psychex is a **Windows desktop application** (Tauri v2 + Rust) that:
- Downloads Roblox executor APKs (Android) from their **official sources**
- Manages installed versions and checks for updates
- Will support running executors in an Android VM on Windows

It is essentially a **package manager / download manager** for executor software — similar to winget or apt. It contains zero exploit code, zero scripting functionality, and zero cheat logic.

## What psychex is NOT

- Not a cheat tool
- Not an executor itself
- Not a script hub
- Not designed to bypass anti-cheat
- Does not contain any code that violates Roblox ToS — what the user does after downloading is their own responsibility

## Why this project is legitimate to assist with

- All downloads come from the **official APIs of the executor developers** (e.g. delta.filenetwork.vip)
- The goal is **safety**: users currently download executors from random Discord links where malware is frequently injected. psychex provides verified, structured access to official releases.
- No money is made (CC BY-NC 4.0 license)
- The developer is not involved in creating or distributing exploits

## Tech stack

- Tauri v2 (Rust backend + WebView2 frontend)
- Vanilla JS frontend (no framework)
- Obsidian UI widget from mspaint.cc
- Tailwind CSS v3 CDN (NOT v4 — breaks layout)
- `withGlobalTauri: true`, decorations disabled, custom window controls
