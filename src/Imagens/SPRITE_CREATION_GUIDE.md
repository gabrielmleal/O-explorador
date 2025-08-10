# Sprite Creation Guide for Bear Enemy

This document provides specifications for creating the bear enemy sprite asset.

## Sprite Requirements

### File Specifications
- **Filename**: `Urso.gif`
- **Format**: Animated GIF
- **Total Dimensions**: 120x60 pixels
- **Frame Size**: 30x30 pixels each

### Animation Layout
```
Frame Layout (120x60 pixels total):
┌─────┬─────┬─────┬─────┐
│Idle │     │     │     │ ← Row 1 (y=0): Idle frame
├─────┼─────┼─────┼─────┤
│Walk1│Walk2│Walk3│Walk4│ ← Row 2 (y=30): Walking frames  
└─────┴─────┴─────┴─────┘
  0    30    60    90   ← x coordinates
```

### Frame Details
1. **Idle Frame**: Position (0, 0) - 30x30 pixels
2. **Walking Frames**: 4 frames at positions:
   - Frame 1: (0, 30) - 30x30 pixels
   - Frame 2: (30, 30) - 30x30 pixels  
   - Frame 3: (60, 30) - 30x30 pixels
   - Frame 4: (90, 30) - 30x30 pixels

### Visual Style Guidelines
- Match the pixel art style of existing wolf sprites
- Use earth tones suitable for a bear (browns, dark browns)
- Include simple walking animation showing leg movement
- Keep design simple and recognizable at 30x30 pixel size
- Ensure good contrast for visibility against game backgrounds

### Integration Notes
The sprite will be loaded in the Bear class using:
```java
BufferedImage sprite = ImageIO.read(getClass().getResourceAsStream("/Imagens/Urso.gif"));
```

### Temporary Implementation
During development, the Bear class will temporarily use `LoboCinza.gif` as specified in the project constraints, until the proper bear sprite is available.

## Reference Sprites
Study these existing sprites for consistency:
- `LoboCinza.gif`: Grey wolf with similar animation pattern
- `LoboVermelho.gif`: Red wolf with similar animation pattern

Both follow the same frame layout and animation structure that the bear sprite should follow.