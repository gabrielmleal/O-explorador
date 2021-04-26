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
 *
 * @author Gabriel
 */
public class LoboVermelho extends Inimigo {

    
    BufferedImage[] spriteParado, spriteAndando;
    public LoboVermelho(MapaDeBlocos mb) {
        super(mb);
        velMovimento = velMaxMovimento = 1.3;
        velQueda = 0.2;
        velMaxQueda = 3.5;
        
        largura = altura = 30;
        clargura = caltura = 20;
        
        vida = maxVida = 6;
        dano = 1;
        
        try{
            BufferedImage sprite = ImageIO.read(getClass().getResourceAsStream("/Imagens/LoboVermelho.gif"));
            
            spriteParado = new BufferedImage[1];
            spriteParado[0] = sprite.getSubimage(0, 0, largura, altura);
            
            spriteAndando = new BufferedImage[4];
            for(int i=0;i<spriteAndando.length;i++){
                spriteAndando[i] = sprite.getSubimage(largura*i, altura, largura, altura);
            }
        }
        catch(Exception e){
            e.printStackTrace();
        }
        
        animacao = new Animacao();
        animacao.mudarFramesPara(spriteAndando);
        animacao.mudarIntervaloPara(70);
        
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
        
        if(vida==0) morto = true;
        if(dy!=0){
            animacao.mudarFramesPara(spriteParado);
        }
        else if(dy==0 && animacao.quaisSaoOsFrames()!=spriteAndando){
            animacao.mudarFramesPara(spriteAndando);
        }
        
        animacao.atualiza();
        
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
        if(atingido){
            long diferencaTempo = (System.nanoTime()-tempoAtingido)/1000000;
            if(diferencaTempo/80%2==0) return;
        }
        super.desenha(g);
    }
    
}
