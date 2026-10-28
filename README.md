# PRISM

PRISM is a dark, minimalist browser project focused on a clean starting point for games and other web features. It uses a black-and-white visual style, subtle animated lighting, floating crystal shapes, and a simple search interface.

> **Project status:** PRISM is a work in progress. Some navigation sections are placeholders while the site is being built.

## Features

- **Animated landing page** — a dark backdrop with drifting light, stars, and crystal-inspired shapes.
- **Game search** — search for supported games from the home screen.
- **Trap the Cat** — the currently wired game shortcut, available through the search bar.
- **Section navigation** — Games, Apps, Chat, Settings, Account, and AI each open their own placeholder page.
- **Keyboard shortcuts** — press `/` to focus the search field, or `Esc` to clear it and leave the field.
- **Responsive layout** — the interface adjusts for smaller screens and supports reduced-motion preferences.

## Getting started

PRISM is a static website at the moment, so you can run it without installing dependencies.

1. Clone or download this repository.
2. Open `index.html` in a browser.

For the best results when testing game links, keep the repository's folder structure intact so relative paths continue to work.

## Project structure

```text
PRISM_MAIN/
├── index.html
├── README.md
└── games/
    └── trap-the-cat.html
```

The main interface and its styling are currently contained in `index.html`. Game pages live in the `games/` directory.

## Current limitations

- The search bar only recognizes the game shortcuts that have been added to it; it is not a general web search.
- Most navigation sections are visual placeholders and do not yet contain their full features.
- No build step or package installation is required for the current static version.

## Contributing

PRISM is still evolving. If you're making changes, try to keep the existing visual style consistent, test the home screen and navigation after edits, and verify that links still point to the right files.

## License

No license information has been added yet. Please check with the repository owner before reusing or redistributing the project.
