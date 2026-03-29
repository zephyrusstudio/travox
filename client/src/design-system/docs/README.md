# Travox Design System

This folder contains the revamp-ready UI foundation for Travox.

## Structure
- `tokens/`: visual and interaction tokens
- `primitives/`: base reusable UI components
- `patterns/`: composed behavior contracts for data-heavy screens
- `shell/`: app-shell level navigation and command surfaces

## Rules
- Keep business logic out of design-system files.
- Preserve backend contract semantics; adapt only presentation and interaction.
- Use tokenized colors (primary anchored at `#3730A3`).
- Ensure keyboard access and visible focus states.
