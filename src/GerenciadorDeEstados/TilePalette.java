/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

package GerenciadorDeEstados;

import java.awt.Color;
import java.awt.Font;
import java.awt.Graphics2D;
import java.awt.Rectangle;
import java.awt.image.BufferedImage;
import javax.imageio.ImageIO;

/**
 * Tile palette for level constructor - displays available tiles for selection
 * @author Gabriel
 */
public class TilePalette {
    
    private BufferedImage blocoImagem;
    private BufferedImage[][] tiles;
    private int selectedTile;
    private int tamanhoBloco = 30;
    private int paletteX, paletteY;
    private int tilesPorLinha = 8;
    private int numeroLinhas = 2;
    private Font fonte;
    
    public TilePalette(int x, int y) {
        this.paletteX = x;
        this.paletteY = y;
        this.selectedTile = 0; // Empty tile by default
        this.fonte = new Font("Arial", Font.PLAIN, 10);
        
        try {
            blocoImagem = ImageIO.read(getClass().getResourceAsStream("/Imagens/blocos.gif"));
            loadTiles();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
    
    private void loadTiles() {
        tiles = new BufferedImage[numeroLinhas][tilesPorLinha];
        
        // Load tiles from sprite sheet
        for (int linha = 0; linha < numeroLinhas; linha++) {
            for (int coluna = 0; coluna < tilesPorLinha; coluna++) {
                tiles[linha][coluna] = blocoImagem.getSubimage(
                    coluna * tamanhoBloco, 
                    linha * tamanhoBloco, 
                    tamanhoBloco, 
                    tamanhoBloco
                );
            }
        }
    }
    
    public void desenha(Graphics2D g) {
        // Draw palette background
        g.setColor(new Color(200, 200, 200, 180));
        g.fillRect(paletteX - 5, paletteY - 20, 
                   tilesPorLinha * (tamanhoBloco + 2) + 10, 
                   numeroLinhas * (tamanhoBloco + 2) + 40);
        
        // Draw title
        g.setColor(Color.BLACK);
        g.setFont(fonte);
        g.drawString("Tiles:", paletteX, paletteY - 5);
        
        // Draw tiles
        for (int linha = 0; linha < numeroLinhas; linha++) {
            for (int coluna = 0; coluna < tilesPorLinha; coluna++) {
                int x = paletteX + coluna * (tamanhoBloco + 2);
                int y = paletteY + linha * (tamanhoBloco + 2);
                
                // Draw tile
                if (tiles[linha][coluna] != null) {
                    g.drawImage(tiles[linha][coluna], x, y, null);
                }
                
                // Draw selection border
                int tileId = linha * tilesPorLinha + coluna;
                if (selectedTile == tileId) {
                    g.setColor(Color.RED);
                    g.drawRect(x - 1, y - 1, tamanhoBloco + 2, tamanhoBloco + 2);
                }
                
                // Draw tile ID
                g.setColor(Color.BLACK);
                g.drawString(String.valueOf(tileId), x + 2, y + 12);
            }
        }
        
        // Draw empty tile option (ID 0)
        int emptyX = paletteX + tilesPorLinha * (tamanhoBloco + 2) + 10;
        int emptyY = paletteY;
        
        g.setColor(Color.WHITE);
        g.fillRect(emptyX, emptyY, tamanhoBloco, tamanhoBloco);
        g.setColor(Color.BLACK);
        g.drawRect(emptyX, emptyY, tamanhoBloco, tamanhoBloco);
        g.drawString("0", emptyX + 2, emptyY + 12);
        g.drawString("Empty", emptyX - 5, emptyY - 5);
        
        if (selectedTile == 0) {
            g.setColor(Color.RED);
            g.drawRect(emptyX - 1, emptyY - 1, tamanhoBloco + 2, tamanhoBloco + 2);
        }
    }
    
    public boolean checkClick(int mouseX, int mouseY) {
        // Check tiles in palette
        for (int linha = 0; linha < numeroLinhas; linha++) {
            for (int coluna = 0; coluna < tilesPorLinha; coluna++) {
                int x = paletteX + coluna * (tamanhoBloco + 2);
                int y = paletteY + linha * (tamanhoBloco + 2);
                
                Rectangle tileRect = new Rectangle(x, y, tamanhoBloco, tamanhoBloco);
                if (tileRect.contains(mouseX, mouseY)) {
                    selectedTile = linha * tilesPorLinha + coluna;
                    return true;
                }
            }
        }
        
        // Check empty tile
        int emptyX = paletteX + tilesPorLinha * (tamanhoBloco + 2) + 10;
        int emptyY = paletteY;
        Rectangle emptyRect = new Rectangle(emptyX, emptyY, tamanhoBloco, tamanhoBloco);
        if (emptyRect.contains(mouseX, mouseY)) {
            selectedTile = 0;
            return true;
        }
        
        return false;
    }
    
    public int getSelectedTile() {
        return selectedTile;
    }
    
    public void setSelectedTile(int tileId) {
        this.selectedTile = tileId;
    }
}