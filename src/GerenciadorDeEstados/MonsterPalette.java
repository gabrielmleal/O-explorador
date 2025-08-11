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
 * Monster palette for level constructor - displays available monsters for selection
 * @author Gabriel
 */
public class MonsterPalette {
    
    public static final int MONSTER_NONE = 0;
    public static final int MONSTER_LOBO_CINZA = 1;
    public static final int MONSTER_LOBO_VERMELHO = 2;
    
    private BufferedImage[] monsterImages;
    private String[] monsterNames = {"None", "Lobo Cinza", "Lobo Vermelho"};
    private int selectedMonster;
    private int paletteX, paletteY;
    private int tamanhoMonstro = 30;
    private Font fonte;
    
    public MonsterPalette(int x, int y) {
        this.paletteX = x;
        this.paletteY = y;
        this.selectedMonster = MONSTER_NONE;
        this.fonte = new Font("Arial", Font.PLAIN, 10);
        
        loadMonsterImages();
    }
    
    private void loadMonsterImages() {
        monsterImages = new BufferedImage[3];
        
        try {
            // Load Lobo Cinza sprite
            BufferedImage loboCinzaSprite = ImageIO.read(getClass().getResourceAsStream("/Imagens/LoboCinza.gif"));
            monsterImages[MONSTER_LOBO_CINZA] = loboCinzaSprite.getSubimage(0, 0, tamanhoMonstro, tamanhoMonstro);
            
            // Load Lobo Vermelho sprite
            BufferedImage loboVermelhoSprite = ImageIO.read(getClass().getResourceAsStream("/Imagens/LoboVermelho.gif"));
            monsterImages[MONSTER_LOBO_VERMELHO] = loboVermelhoSprite.getSubimage(0, 0, tamanhoMonstro, tamanhoMonstro);
            
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
    
    public void desenha(Graphics2D g) {
        // Draw palette background
        g.setColor(new Color(180, 200, 180, 180));
        g.fillRect(paletteX - 5, paletteY - 20, 
                   3 * (tamanhoMonstro + 5) + 10, 
                   tamanhoMonstro + 40);
        
        // Draw title
        g.setColor(Color.BLACK);
        g.setFont(fonte);
        g.drawString("Monsters:", paletteX, paletteY - 5);
        
        // Draw monster options
        for (int i = 0; i < monsterNames.length; i++) {
            int x = paletteX + i * (tamanhoMonstro + 5);
            int y = paletteY;
            
            // Draw background for selection
            if (selectedMonster == i) {
                g.setColor(Color.YELLOW);
                g.fillRect(x - 2, y - 2, tamanhoMonstro + 4, tamanhoMonstro + 4);
            }
            
            // Draw monster image or placeholder
            if (i == MONSTER_NONE) {
                g.setColor(Color.WHITE);
                g.fillRect(x, y, tamanhoMonstro, tamanhoMonstro);
                g.setColor(Color.BLACK);
                g.drawRect(x, y, tamanhoMonstro, tamanhoMonstro);
                g.drawString("X", x + 12, y + 18);
            } else if (monsterImages[i] != null) {
                g.drawImage(monsterImages[i], x, y, null);
            }
            
            // Draw selection border
            if (selectedMonster == i) {
                g.setColor(Color.RED);
                g.drawRect(x - 1, y - 1, tamanhoMonstro + 2, tamanhoMonstro + 2);
            }
            
            // Draw monster name below
            g.setColor(Color.BLACK);
            g.drawString(monsterNames[i], x - 5, y + tamanhoMonstro + 15);
        }
    }
    
    public boolean checkClick(int mouseX, int mouseY) {
        for (int i = 0; i < monsterNames.length; i++) {
            int x = paletteX + i * (tamanhoMonstro + 5);
            int y = paletteY;
            
            Rectangle monsterRect = new Rectangle(x, y, tamanhoMonstro, tamanhoMonstro);
            if (monsterRect.contains(mouseX, mouseY)) {
                selectedMonster = i;
                return true;
            }
        }
        return false;
    }
    
    public int getSelectedMonster() {
        return selectedMonster;
    }
    
    public void setSelectedMonster(int monsterId) {
        this.selectedMonster = monsterId;
    }
    
    public String getSelectedMonsterName() {
        return monsterNames[selectedMonster];
    }
}