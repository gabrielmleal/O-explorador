/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

package GerenciadorDeEstados;

import ElementosGraficos.ImagemDeFundo;
import java.awt.Color;
import java.awt.Font;
import java.awt.Graphics2D;
import java.awt.Rectangle;
import java.awt.event.KeyEvent;
import java.awt.event.MouseEvent;
import java.awt.image.BufferedImage;
import javax.imageio.ImageIO;

/**
 * Manual level editor for creating levels tile by tile
 * @author Gabriel
 */
public class LevelEditor {
    
    private static final int TILE_SIZE = 30;
    private static final int GRID_WIDTH = 50;  // Default grid width
    private static final int GRID_HEIGHT = 20; // Default grid height
    private static final int GRID_X = 20;
    private static final int GRID_Y = 50;
    
    private int[][] levelGrid;
    private int gridWidth, gridHeight;
    private int cameraX, cameraY;
    private int selectedTile, selectedMonster;
    private boolean isPlacingMonster;
    
    // Visual elements
    private BufferedImage blocoImagem;
    private BufferedImage[][] tiles;
    private Font fonte;
    private Color gridColor, backgroundColor;
    
    // Tool states
    private boolean eraseMode;
    private boolean showGrid = true;
    
    public LevelEditor() {
        this.gridWidth = GRID_WIDTH;
        this.gridHeight = GRID_HEIGHT;
        this.levelGrid = new int[gridHeight][gridWidth];
        this.cameraX = 0;
        this.cameraY = 0;
        this.selectedTile = 0;
        this.selectedMonster = 0;
        this.isPlacingMonster = false;
        this.eraseMode = false;
        
        // Initialize visual elements
        this.fonte = new Font("Arial", Font.PLAIN, 10);
        this.gridColor = new Color(100, 100, 100, 128);
        this.backgroundColor = new Color(135, 206, 250); // Sky blue background
        
        try {
            blocoImagem = ImageIO.read(getClass().getResourceAsStream("/Imagens/blocos.gif"));
            loadTiles();
        } catch (Exception e) {
            e.printStackTrace();
        }
        
        // Initialize empty level
        clearLevel();
    }
    
    private void loadTiles() {
        int quantBlocos = blocoImagem.getWidth() / TILE_SIZE;
        tiles = new BufferedImage[2][quantBlocos];
        
        // Load tiles from sprite sheet (same as MapaDeBlocos)
        for (int linha = 0; linha < 2; linha++) {
            for (int coluna = 0; coluna < quantBlocos; coluna++) {
                tiles[linha][coluna] = blocoImagem.getSubimage(
                    coluna * TILE_SIZE, 
                    linha * TILE_SIZE, 
                    TILE_SIZE, 
                    TILE_SIZE
                );
            }
        }
    }
    
    public void desenha(Graphics2D g) {
        // Fill background
        g.setColor(backgroundColor);
        g.fillRect(0, 0, 320, 240);
        
        // Calculate visible grid bounds
        int startCol = Math.max(0, cameraX / TILE_SIZE);
        int endCol = Math.min(gridWidth, (cameraX + 320) / TILE_SIZE + 1);
        int startRow = Math.max(0, cameraY / TILE_SIZE);
        int endRow = Math.min(gridHeight, (cameraY + 240) / TILE_SIZE + 1);
        
        // Draw tiles
        for (int row = startRow; row < endRow; row++) {
            for (int col = startCol; col < endCol; col++) {
                int x = GRID_X + col * TILE_SIZE - cameraX;
                int y = GRID_Y + row * TILE_SIZE - cameraY;
                
                int tileId = levelGrid[row][col];
                if (tileId > 0 && tileId < 16) { // Valid tile range
                    int linha = tileId / 8;
                    int coluna = tileId % 8;
                    if (linha < 2 && coluna < 8 && tiles[linha][coluna] != null) {
                        g.drawImage(tiles[linha][coluna], x, y, null);
                    }
                }
            }
        }
        
        // Draw grid lines if enabled
        if (showGrid) {
            g.setColor(gridColor);
            
            // Vertical lines
            for (int col = startCol; col <= endCol; col++) {
                int x = GRID_X + col * TILE_SIZE - cameraX;
                if (x >= 0 && x <= 320) {
                    g.drawLine(x, GRID_Y - cameraY, x, GRID_Y + gridHeight * TILE_SIZE - cameraY);
                }
            }
            
            // Horizontal lines
            for (int row = startRow; row <= endRow; row++) {
                int y = GRID_Y + row * TILE_SIZE - cameraY;
                if (y >= 0 && y <= 240) {
                    g.drawLine(GRID_X - cameraX, y, GRID_X + gridWidth * TILE_SIZE - cameraX, y);
                }
            }
        }
        
        // Draw UI overlay
        drawUI(g);
    }
    
    private void drawUI(Graphics2D g) {
        // Semi-transparent background for UI
        g.setColor(new Color(0, 0, 0, 128));
        g.fillRect(0, 0, 320, 30);
        g.fillRect(0, 210, 320, 30);
        
        // Top bar info
        g.setColor(Color.WHITE);
        g.setFont(fonte);
        String mode = eraseMode ? "ERASE" : (isPlacingMonster ? "MONSTER" : "TILE");
        String currentTool = eraseMode ? "Eraser" : (isPlacingMonster ? "Monster " + selectedMonster : "Tile " + selectedTile);
        g.drawString("Mode: " + mode + " | Tool: " + currentTool, 5, 15);
        g.drawString("Camera: " + cameraX + "," + cameraY + " | Grid: " + showGrid, 5, 25);
        
        // Bottom bar controls
        g.drawString("WASD: Move Camera | Click: Place/Erase | E: Toggle Erase | G: Toggle Grid", 5, 225);
        g.drawString("T: Tile Mode | M: Monster Mode | C: Clear | ESC: Exit | SPACE: Save", 5, 235);
    }
    
    public boolean handleMouseClick(int mouseX, int mouseY) {
        // Convert screen coordinates to grid coordinates
        int gridX = (mouseX - GRID_X + cameraX) / TILE_SIZE;
        int gridY = (mouseY - GRID_Y + cameraY) / TILE_SIZE;
        
        // Check if click is within grid bounds
        if (gridX >= 0 && gridX < gridWidth && gridY >= 0 && gridY < gridHeight) {
            if (eraseMode) {
                levelGrid[gridY][gridX] = 0; // Clear tile
            } else {
                if (isPlacingMonster) {
                    // Monster placement would be handled differently
                    // For now, just place a special tile ID for monsters
                    if (selectedMonster > 0) {
                        levelGrid[gridY][gridX] = 16 + selectedMonster; // Use IDs 17+ for monsters
                    }
                } else {
                    levelGrid[gridY][gridX] = selectedTile;
                }
            }
            return true;
        }
        return false;
    }
    
    public void handleKeyPressed(int keyCode) {
        int cameraSpeed = TILE_SIZE;
        
        switch (keyCode) {
            case KeyEvent.VK_W:
                cameraY = Math.max(0, cameraY - cameraSpeed);
                break;
            case KeyEvent.VK_S:
                cameraY = Math.min((gridHeight - 8) * TILE_SIZE, cameraY + cameraSpeed);
                break;
            case KeyEvent.VK_A:
                cameraX = Math.max(0, cameraX - cameraSpeed);
                break;
            case KeyEvent.VK_D:
                cameraX = Math.min((gridWidth - 10) * TILE_SIZE, cameraX + cameraSpeed);
                break;
            case KeyEvent.VK_E:
                eraseMode = !eraseMode;
                break;
            case KeyEvent.VK_G:
                showGrid = !showGrid;
                break;
            case KeyEvent.VK_T:
                isPlacingMonster = false;
                break;
            case KeyEvent.VK_M:
                isPlacingMonster = true;
                break;
            case KeyEvent.VK_C:
                clearLevel();
                break;
        }
    }
    
    public void clearLevel() {
        for (int row = 0; row < gridHeight; row++) {
            for (int col = 0; col < gridWidth; col++) {
                levelGrid[row][col] = 0;
            }
        }
        // Reset camera to top-left
        cameraX = 0;
        cameraY = 0;
    }
    
    public void setSelectedTile(int tileId) {
        this.selectedTile = tileId;
        this.isPlacingMonster = false;
    }
    
    public void setSelectedMonster(int monsterId) {
        this.selectedMonster = monsterId;
        this.isPlacingMonster = true;
    }
    
    public int[][] getLevelGrid() {
        return levelGrid;
    }
    
    public int getGridWidth() {
        return gridWidth;
    }
    
    public int getGridHeight() {
        return gridHeight;
    }
    
    public void setGridSize(int width, int height) {
        // Save current level data
        int[][] oldGrid = this.levelGrid;
        int oldWidth = this.gridWidth;
        int oldHeight = this.gridHeight;
        
        // Create new grid
        this.gridWidth = Math.max(10, Math.min(200, width));  // Clamp between 10-200
        this.gridHeight = Math.max(8, Math.min(50, height));   // Clamp between 8-50
        this.levelGrid = new int[this.gridHeight][this.gridWidth];
        
        // Copy over existing data (if it fits)
        for (int row = 0; row < Math.min(oldHeight, this.gridHeight); row++) {
            for (int col = 0; col < Math.min(oldWidth, this.gridWidth); col++) {
                this.levelGrid[row][col] = oldGrid[row][col];
            }
        }
        
        // Reset camera
        cameraX = 0;
        cameraY = 0;
    }
    
    public boolean isEraseMode() {
        return eraseMode;
    }
    
    public void setEraseMode(boolean eraseMode) {
        this.eraseMode = eraseMode;
    }
    
    public boolean isPlacingMonster() {
        return isPlacingMonster;
    }
    
    public void setPlacingMonster(boolean placingMonster) {
        this.isPlacingMonster = placingMonster;
    }
}