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
public class Portal extends ObjetoMapa{

    
    private BufferedImage[] portalSprite, finalSprite;
    private boolean para;
    public Portal(MapaDeBlocos mb) {
        super(mb);
        largura = 30;
        altura = 30;
        clargura = 10;
        caltura = 5;
        
        para = false;
        olhandoDireita = true;
        try{
            BufferedImage sprite = ImageIO.read(getClass().getResourceAsStream("/Imagens/portal.gif"));
            
            portalSprite = new BufferedImage[1];
            portalSprite[0] = sprite.getSubimage(0, 0, largura, altura);
            
            finalSprite = new BufferedImage[5];
            for(int i=0;i<finalSprite.length;i++){
                finalSprite[i] = sprite.getSubimage(largura*i, altura, largura, altura);
            }
        }
        catch(Exception e){
            e.printStackTrace();
        }
        animacao = new Animacao();
        animacao.mudarFramesPara(portalSprite);
        animacao.mudarIntervaloPara(-1);
    }
    
    public void atualiza(){
        if(!para)
        animacao.atualiza();
    }
    
    public void desenha(Graphics2D g){
        super.desenha(g);
    }
    
    public void trocaAnimacao(){
        animacao.mudarFramesPara(finalSprite);
        animacao.mudarIntervaloPara(140);
    }
    
    public boolean executou(){
        return animacao.checaFoiExecutado();
        
    }
}
