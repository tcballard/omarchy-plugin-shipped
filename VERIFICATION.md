# Verification — 17 September 2026

Prepared with Build Omarchy Plugins v0.4.0, commit a12e90568b7e8f28ca7ca92400009758da7eb43b (latest published release checked on this date).

- `./tests/run`: passed model, vendored helper and isolated backend integration tests; both portable validators passed.
- `./demo/run`: passed actual QML loading and open/reopen/close/Escape using PySide6 6.11.2 and explicit host stubs. Process stubs do not execute commands.
- Full toolkit advisory scan: manifest valid. The copied validator flags its own example string as an unpinned Cargo installation. This is detector source, not a runtime install command; retained unmodified for provenance. README package-manager matches describe explicit dependency installation. QML process and hook-setup capabilities require review, not blanket approval.
- Release preflight is not green: the same detector self-match remains, and a public remote is pending. The scan is not a security audit.

Not run: official Omarchy validator, real Quickshell/Hyprland lifecycle and IPC, monitor/orientation behavior, terminal command staging, real deployment/SSH or GitHub integration, fresh remote install/update/remove, hosted CI. These remain release gates. See docs/STATUS.md for inherited feature limits.

Source manifest records exact file hashes. This is an independent development preview, not a published release or marketplace approval.
