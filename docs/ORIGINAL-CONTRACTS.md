> Historical source-bundle record. Shared-copy and monorepo commands below describe the original archive; this repository is now independent.

# Contract decisions — 15 September 2026

Build baseline: Build Omarchy Plugins **v0.4.0**, Git tree
`a12e90568b7e8f28ca7ca92400009758da7eb43b`. The generator and portable validator
were retrieved from that tag. Native UI uses the hosted BarWidget, WidgetButton,
KeyboardPanel and singleton-service contract. No second Quickshell is launched.

References inspected:

- https://github.com/tcballard/build-omarchy-plugins/tree/v0.4.0
- https://github.com/omacom/omarchy/blob/quattro/docs/omarchy-shell.md
- https://kamal-deploy.org/docs/hooks/overview/
- https://kamal-deploy.org/docs/hooks/post-deploy/
- https://kamal-deploy.org/docs/commands/app/
- https://wiki.hypr.land/IPC/
- https://code.claude.com/docs/en/hooks

## Corrections to draft assumptions

1. Kamal has `app version`; its output is human text. `post-deploy` supplies
   `KAMAL_RUNTIME`. There is no documented failure hook. Missing completion is
   an **incomplete run**, not failure. The optional foreground wrapper records
   a real failed exit. Hooks can be skipped or overridden; the plugin does not
   pretend it sees deployments performed elsewhere.
2. Hyprland focus events do not identify every user dispatcher or provide
   global keystroke timestamps. Reading the event socket cannot prove theft.
   Focus Theft reports **suspected** changes and never blocks automatically.
   It does not read privileged input devices. Rule installation is staged and version-gated (0.53/0.54 conf; 0.55/0.56 Lua).
   Border flashing remains unimplemented because safe property restoration has not been verified.
3. A PTY file position is not a reliable stdout activity counter. Idle agents
   are labelled **idle; may need you**. Claude hooks supply confirmed states;
   `PermissionRequest` is used for permission waits, not every `PreToolUse`.
4. Stop means the agent finished a response; it does not necessarily mean its
   process exited. Hook records bind to PID plus process start identity.
5. A sampled `ss` connection has unknown initiation direction. Inspector says
   **established socket**, not “outbound request”. Path and ancestry attribution
   remains inferred even when the PID/socket itself was observed.
6. No observed violation is **not disproven**, never a green safety certificate.
   File writes cannot be attributed by unprivileged recursive inotify alone.
   Inspector deliberately reports static-only file evidence.
7. “No network” cannot honestly describe opt-in Kamal SSH, Shipped's GitHub API
   queries, or actions opening a browser. READMEs distinguish default collection,
   optional collection and explicit actions. No telemetry or new accounts.
8. The shared helper implementation uses Node 22+ and built-in modules, with
   Bash entry points; there are no npm packages. Node is an explicit dependency.
   Native shell UI and pure Model.js tests remain the specified QML/JavaScript.

## Shared ownership and limits

Each plugin has its own service, own config directory and own state directory.
All seven vendor identical `lib/` contents; `make sync` updates them and CI checks
byte equality. Helpers use argument arrays, bounded subprocess output, deadlines,
owned-process checks and atomic writes. Staged commands reject control characters.
Commands that change files, deployments, plugins or processes require Enter in a
terminal. This also resolves the draft's conflicting direct-stop exception in
favour of its shared terminal-review convention.

Services run only while enabled. Collectors run at 5s (agents), 10s (Rails)
or 60s (Kamal discovery/other snapshots); focus events use one socket reader and Kamal journal changes trigger immediate refresh. Panel close releases
its surface; ambient collection continues. Disabled services destroy their helper
processes. Live disable/reload behavior remains an Omarchy acceptance test.

## Drift milestone zero: actual baseline

Inspected `bin/omarchy-refresh-config`: it maps a relative name from
`$OMARCHY_PATH/config/` to `~/.config/`, backs up an existing file, then copies
the shipped file. `$OMARCHY_PATH/default/` also contains sourced fragments and
templates; those are not generally copies of user files.

Therefore Drift compares existing regular files in known config families only
against the corresponding local `config/` file. Symlinks, theme/current trees
and generated theme/color files are excluded. It never executes a config or
evaluates a source/include statement. Unique `.conf` assignments get scoped
key diffs; other formats get file-level drift and raw diff. Repeated bindings
are ambiguous and cannot be reset as one key. Arbitrary effective configuration
evaluation, Lua evaluation and custom include graphs are not implemented.

The first sample establishes a baseline. A later baseline change can identify
a stale override; no historical baseline is invented. Hashes prevent a staged
reset from overwriting a file changed since review. Backups precede replacements.
Pins bind to content and become visible again if user or baseline content changes.

Cases tested: scoped keys, repeated bindings, prior-default changes, clean values,
changed-after-review rejection, backup content, successful single-key reset.

## Build acceptance boundary

This is a development preview, not a marketplace release. See STATUS.md for
implemented and outstanding behavior. Neither fixture screenshots nor Qt stubs
prove Wayland focus behavior, CLI availability or live Quattro integration.
