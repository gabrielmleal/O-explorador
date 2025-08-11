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

/**
 * Level settings panel for auto-generation parameters
 * @author Gabriel
 */
public class LevelSettings {
    
    private int panelX, panelY;
    private int larguraMapa = 100; // Default map width
    private int numLobosCinza = 3;   // Default gray wolves
    private int numLobosVermelhos = 2; // Default red wolves
    
    private Font fonte, fonteValor;
    private Rectangle[] botoesMenos, botoesMais;
    private String[] labels = {"Width:", "Gray Wolves:", "Red Wolves:"};
    private int[] valores = {larguraMapa, numLobosCinza, numLobosVermelhos};
    private int[] minValues = {50, 0, 0}; // Minimum values
    private int[] maxValues = {200, 10, 10}; // Maximum values
    
    public LevelSettings(int x, int y) {
        this.panelX = x;
        this.panelY = y;
        this.fonte = new Font("Arial", Font.PLAIN, 10);
        this.fonteValor = new Font("Arial", Font.BOLD, 12);
        
        // Initialize button rectangles
        botoesMenos = new Rectangle[3];
        botoesMais = new Rectangle[3];
        
        for (int i = 0; i < 3; i++) {
            int buttonY = panelY + 20 + i * 25;
            botoesMenos[i] = new Rectangle(panelX + 80, buttonY, 15, 15);
            botoesMais[i] = new Rectangle(panelX + 120, buttonY, 15, 15);
        }
    }
    
    public void desenha(Graphics2D g) {
        // Draw panel background
        g.setColor(new Color(200, 200, 250, 180));
        g.fillRect(panelX - 5, panelY - 5, 150, 100);
        
        // Draw title
        g.setColor(Color.BLACK);
        g.setFont(fonte);
        g.drawString("Auto-Gen Settings:", panelX, panelY + 10);
        
        // Draw settings with +/- buttons
        for (int i = 0; i < 3; i++) {
            int yPos = panelY + 30 + i * 25;
            
            // Draw label
            g.setFont(fonte);
            g.drawString(labels[i], panelX, yPos);
            
            // Draw minus button
            g.setColor(Color.LIGHT_GRAY);
            g.fillRect(botoesMenos[i].x, botoesMenos[i].y, botoesMenos[i].width, botoesMenos[i].height);
            g.setColor(Color.BLACK);
            g.drawRect(botoesMenos[i].x, botoesMenos[i].y, botoesMenos[i].width, botoesMenos[i].height);
            g.drawString("-", botoesMenos[i].x + 5, botoesMenos[i].y + 12);
            
            // Draw value
            g.setFont(fonteValor);
            String valor = String.valueOf(valores[i]);
            g.drawString(valor, panelX + 100, yPos);
            
            // Draw plus button
            g.setColor(Color.LIGHT_GRAY);
            g.fillRect(botoesMais[i].x, botoesMais[i].y, botoesMais[i].width, botoesMais[i].height);
            g.setColor(Color.BLACK);
            g.drawRect(botoesMais[i].x, botoesMais[i].y, botoesMais[i].width, botoesMais[i].height);
            g.drawString("+", botoesMais[i].x + 5, botoesMais[i].y + 12);
        }
    }
    
    public boolean checkClick(int mouseX, int mouseY) {
        for (int i = 0; i < 3; i++) {
            // Check minus button
            if (botoesMenos[i].contains(mouseX, mouseY)) {
                if (valores[i] > minValues[i]) {
                    valores[i]--;
                    updateValues();
                }
                return true;
            }
            
            // Check plus button
            if (botoesMais[i].contains(mouseX, mouseY)) {
                if (valores[i] < maxValues[i]) {
                    valores[i]++;
                    updateValues();
                }
                return true;
            }
        }
        return false;
    }
    
    private void updateValues() {
        larguraMapa = valores[0];
        numLobosCinza = valores[1];
        numLobosVermelhos = valores[2];
    }
    
    // Getters
    public int getLarguraMapa() {
        return larguraMapa;
    }
    
    public int getNumLobosCinza() {
        return numLobosCinza;
    }
    
    public int getNumLobosVermelhos() {
        return numLobosVermelhos;
    }
    
    // Setters
    public void setLarguraMapa(int largura) {
        this.larguraMapa = Math.max(minValues[0], Math.min(maxValues[0], largura));
        this.valores[0] = this.larguraMapa;
    }
    
    public void setNumLobosCinza(int num) {
        this.numLobosCinza = Math.max(minValues[1], Math.min(maxValues[1], num));
        this.valores[1] = this.numLobosCinza;
    }
    
    public void setNumLobosVermelhos(int num) {
        this.numLobosVermelhos = Math.max(minValues[2], Math.min(maxValues[2], num));
        this.valores[2] = this.numLobosVermelhos;
    }
}