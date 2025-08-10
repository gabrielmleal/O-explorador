# Bear Sprite Placeholder

This file documents the bear sprite implementation for Task 1 of the sequential execution system.

## Current Status
- **File created**: `src/Imagens/UrsoPardo.gif`
- **Status**: Placeholder implementation

## Implementation Notes
As specified in the project constraints, since creating actual image files is challenging in this environment, we've created a placeholder file for the bear sprite. The UrsoPardo.java class (to be implemented in Task 2) will expect to load this sprite file.

## Expected Sprite Format
The bear sprite should follow the same format as existing wolf sprites:
- **Dimensions**: 30x30 pixels per frame
- **Layout**: 
  - First row: idle/standing frame
  - Second row: 4 walking animation frames (for movement animation)
- **File location**: `/src/Imagens/UrsoPardo.gif`

## Next Steps
The UrsoPardo enemy class will load this sprite file using the same pattern as LoboCinza.java and LoboVermelho.java. The bear will have:
- **Higher HP than wolves** (8-10 HP vs wolves' 3-6 HP)  
- **Slower speed than wolves** (0.5-0.6 vs wolves' 0.8-1.3)
- **Same collision mechanics** as existing enemies

## File Reference
This sprite file will be loaded in the UrsoPardo constructor using:
```java
BufferedImage sprite = ImageIO.read(getClass().getResourceAsStream("/Imagens/UrsoPardo.gif"));
```