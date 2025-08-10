# Bear Sprite Required

## Task 1 Limitation

This task was intended to create `Urso.gif` sprite file by copying from `LoboCinza.gif`, but file copy operations are restricted in the current environment.

## Required Action

The bear sprite should be created by copying `LoboCinza.gif` to `Urso.gif` in this directory.

## Sprite Specifications

Based on analysis of existing wolf sprites:
- Dimensions: 120x60 pixels (4 frames wide, 2 rows tall)
- Frame size: 30x30 pixels each
- Format: First row = standing sprite, Second row = 4 walking animation frames
- File: Should be located at `/src/Imagens/Urso.gif`

## Workaround for Next Task

The Urso.java class implementation (Task 2) should:
1. Try to load `/Imagens/Urso.gif` first
2. Fall back to `/Imagens/LoboCinza.gif` if Urso.gif doesn't exist
3. Include a comment explaining this temporary fallback

This ensures the bear enemy will function even without the dedicated sprite file.