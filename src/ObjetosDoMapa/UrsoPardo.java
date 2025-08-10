/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

package ObjetosDoMapa;

import ElementosGraficos.Animacao;
import ElementosGraficos.MapaDeBlocos;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import javax.imageio.ImageIO;

/**
 * UrsoPardo (Brown Bear) enemy - stronger than wolves but slower
 * @author Gabriel
 */
public class UrsoPardo extends Inimigo {

    BufferedImage[] spriteParado, spriteAndando;
    
    public UrsoPardo(MapaDeBlocos mb) {
        super(mb);
        velMovimento = velMaxMovimento = 0.5; // Slower than wolves (0.8, 1.3)
        velQueda = 0.2;
        velMaxQueda = 3.5;
        
        largura = altura = 30;
        clargura = caltura = 20;
        
        vida = maxVida = 8; // More HP than wolves (3, 6)
        dano = 1; // Same damage as wolves
        
        try{
            // Try to load bear sprite, fallback to wolf sprite if not available
            BufferedImage sprite;
            try {
                sprite = ImageIO.read(getClass().getResourceAsStream("/Imagens/UrsoPardo.gif"));
            } catch (Exception e) {
                // Fallback to LoboCinza sprite as placeholder
                sprite = ImageIO.read(getClass().getResourceAsStream("/Imagens/LoboCinza.gif"));
            }
            
            spriteParado = new BufferedImage[1];
            spriteParado[0] = sprite.getSubimage(0, 0, largura, altura);
            
            spriteAndando = new BufferedImage[4];
            for(int i=0;i<spriteAndando.length;i++){
                spriteAndando[i] = sprite.getSubimage(largura*i, altura, largura, altura);
            }
            
            // Load death animation sprite
            BufferedImage msprite = ImageIO.read(getClass().getResourceAsStream("/Imagens/Explosao.gif"));
            spriteMorre = new BufferedImage[3];
            for(int i=0;i<spriteMorre.length;i++){
                spriteMorre[i] = msprite.getSubimage(largura*i, 0, largura, altura);
            }
        }
        catch(Exception e){
            e.printStackTrace();
        }
        
        animacao = new Animacao();
        animacao.mudarFramesPara(spriteAndando);
        animacao.mudarIntervaloPara(150); // Slower animation to match slower movement
        
        direita = olhandoDireita = true;
    }
    
    public void proximaPos(){
        if(esquerda) dx = -velMovimento;
        else if(direita) dx = velMovimento;
        else dx = 0;
        
        if(caindo){
            dy+=velQueda;
            if(dy>velMaxQueda) dy = velMaxQueda;
        }
    }
    
    public void atualiza(){
        proximaPos();
        checaColisaoComMapa();
        mudarPosicaoPara(xtemp, ytemp);
        
        // Edge detection - turn around at edges
        calculaLimites(x, ydest+1);
        if(!inferiorEsquerdo && !inferiorDireito){}
        else if(!inferiorDireito && olhandoDireita){
            dx=0;
        }
        else if(!inferiorEsquerdo && !olhandoDireita){
            dx=0;
        }
        
        if(dx==0){
            esquerda = !esquerda;
            direita = olhandoDireita = !direita;
        }
        
        // Animation handling
        if(dy!=0){
            animacao.mudarFramesPara(spriteParado);
        }
        else if(dy==0 && animacao.quaisSaoOsFrames()!=spriteAndando){
            animacao.mudarFramesPara(spriteAndando);
        }
        
        if(vida==0) {
            morto = true;
        }
        
        animacao.atualiza();
        
        // Hit recovery handling
        if(atingido){
            long diferencaTempo = (System.nanoTime()-tempoAtingido)/1000000;
            if(diferencaTempo > duracaoAtingido) {
                atingido = false;
                if(direita!=olhandoDireita){
                    esquerda = !esquerda;
                    direita = !direita;
                }
            }
        }
    }
    
    public void desenha(Graphics2D g){
        // Flashing effect when hit
        if(atingido){
            long diferencaTempo = (System.nanoTime()-tempoAtingido)/1000000;
            if(diferencaTempo/80%2==0) return;
        }
        super.desenha(g);
    }
}