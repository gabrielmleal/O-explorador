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
public class Explosao extends ObjetoMapa {

    
    private BufferedImage[] sprites;
    private boolean remove;
    
   
    public Explosao(MapaDeBlocos mb, int x, int y) {
        super(mb);
        largura = altura = 30;
        this.x = x;
        this.y = y;
        try{
            BufferedImage sprite = ImageIO.read(getClass().getResourceAsStream("/Imagens/Explosao.gif"));
            
            sprites = new BufferedImage[3];
            for(int i=0;i<sprites.length;i++){
                sprites[i] = sprite.getSubimage(largura*i, 0, largura, altura);
            }
        }
        catch(Exception e){
            e.printStackTrace();
        }
            animacao = new Animacao();
            animacao.mudarFramesPara(sprites);
            animacao.mudarIntervaloPara(100);
            
    }
    
    public boolean deveRemover(){return remove;}
    
    public void atualiza(){
        animacao.atualiza();
        if(animacao.checaFoiExecutado()){
            remove = true;
        }
    }
    
    public void desenha(Graphics2D g){
        atualizarPosicaoMapa();
        g.drawImage(animacao.imagemAtual(), (int)(x + xmapa - largura/2), (int)(y + ymapa - altura/2), null);
    }
    
}
