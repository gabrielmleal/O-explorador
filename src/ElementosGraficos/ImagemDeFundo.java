/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

package ElementosGraficos;

import Principal.JogoPanel;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import javax.imageio.ImageIO;

/**
 *
 * @author Gabriel
 */
public class ImagemDeFundo {
/*Classe para padronizar as imagens de fundo, por exemplo, o fundo de uma fase, ou a imagem de fundo do
    menu*/
    
    //a imagem do fundo
    private BufferedImage imagem;
    
    //as posições em que serão desenhadas a imagem, e sua movimentação, caso tenha
    private double x, y, dx, dy;
    //velocidade do movimento da imagem em relação a algum objeto
    private double velocidadeMovimento;
    
    private int largura, altura;
    
    //Construtor que lê a imagem, e determina a velocidade de movimento
    public ImagemDeFundo(String s, double vm){
        try{
            imagem = ImageIO.read(getClass().getResourceAsStream(s));
        }
        catch(Exception e){
            e.printStackTrace();
        }
        
        largura = imagem.getWidth();
        altura = imagem.getHeight();
        
        this.velocidadeMovimento=vm;
    }
    
    //Muda a posição inicial da imagem de fundo
    public void mudarPosicaoPara(double x, double y){
        this.x = (x*velocidadeMovimento) % JogoPanel.LARGURA;
        this.y = (y*0);
    }
    
    //muda o movimento automático
    public void mudarMovimentoAutomatico(double dx, double dy){
        this.dx=dx;
        this.dy=dy;
    }
    
    /*a imagem sempre irá incrementar o dx e dy, que serão os valores que indicarão a velocidade de movimento
    da imagem*/
    public void atualiza(){
        x += dx;
		while(x <= -largura) x += largura;
		while(x >= largura) x -= largura;
		y += dy;
		while(y <= -altura) y += altura;
		while(y >= altura) y -= altura;
    }
    
    
    //desenha a imagem
    public void desenha(Graphics2D g){
        //desenha ela normalmente em suas posições
        g.drawImage(imagem, (int)x, (int)y, null);
        
        //caso ela saia pela esquerda, então redesenhará ela à direita do fim da imagem
        if(x<0){
            g.drawImage(imagem, (int)x+JogoPanel.LARGURA, (int)y, null);
        }
        //mesmo caso para a direita
        if(x>0){
            g.drawImage(imagem, (int)x-JogoPanel.LARGURA, (int)y, null);
        }
    }
}
