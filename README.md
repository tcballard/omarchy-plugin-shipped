<h1 align="center">Shipped</h1>

<p align="center">
  <a href="https://github.com/tcballard/omarchy-badges"><img src="https://raw.githubusercontent.com/tcballard/omarchy-badges/75975e5b5bf75e7ede3764bcd2950046f7abfe2c/badges/v1/omarchy-plugin.svg" alt="Built for Omarchy: Plugin" height="24"></a>
</p>

**See what you shipped today.**

Shipped brings your day or week across local Git repositories into the Omarchy bar. See your commits, their subjects and line changes, with optional GitHub counts for merged pull requests and review requests.

## Everyday use

Click the bar widget, choose a repository and switch between today and this week. Commits are matched to your configured email addresses. GitHub counts are opt-in and use your existing GitHub CLI login. [Setup and controls →](GUIDE.md#use)

## Install

Omarchy Quattro, Node 22+, jq, Git and Bash. Optional GitHub counts require authenticated gh. [Dependencies →](GUIDE.md)

```bash
omarchy plugin add https://github.com/tcballard/omarchy-plugin-shipped.git --enable
```

## Update and remove

Update:

```bash
omarchy plugin update io.github.tcballard.shipped
```

Remove:

```bash
omarchy plugin remove io.github.tcballard.shipped
```

## A few useful details

**0.1.0-preview.1 development preview.** Live Omarchy acceptance remains outstanding. [Verification](VERIFICATION.md) · [Current scope](docs/STATUS.md)

Commit and PR totals are separate measures. Local collection needs no network; optional GitHub queries do. Configuration and state survive removal. [Counting rules →](GUIDE.md#behavior-and-limits)

[Usage and development guide](GUIDE.md) · [Report a bug](https://github.com/tcballard/omarchy-plugin-shipped/issues)

[Apache-2.0 licensed](LICENSE).

<!-- Preserve links to sections now in the guide. -->
<a id="behavior-and-limits"></a>
<a id="compatibility"></a>
<a id="remove"></a>
<a id="use"></a>
<a id="verify"></a>

[Looking for the previous detailed sections? Open the full guide →](GUIDE.md)
