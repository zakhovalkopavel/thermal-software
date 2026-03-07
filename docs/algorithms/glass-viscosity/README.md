# Glass Viscosity Specification

This is the authoritative specification for the glass and slag viscosity calculation system.

## Scope

- Silicate oxide glasses (Hetherington 1964, Lakatos 1976, Fluegel 2007) — **implemented**
- Industrial molten slags (Iida model, Nakamoto 2007) — **specified, pending implementation**
- Liquidus estimation (Mills/NPL regression) — **specified, pending implementation**

## What replaced v1

The v1 implementation had wrong parameters, wrong model architecture, and no literature provenance. It was removed on 2026-03-06. See [Chapter 1](./chapter-01-design-goals.md) for the full story.

The old `docs/algorithms/glass-viscosity/` directory has been removed. All current documentation lives here.

## Chapter Index

See [INDEX.md](./INDEX.md) for the full chapter list.

## Current Implementation State

See [Chapter 14 — Implementation State](./chapter-14-implementation-state.md) for a complete map of what is implemented, what is pending, and known issues.

