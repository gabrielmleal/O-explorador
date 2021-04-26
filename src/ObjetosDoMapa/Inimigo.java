/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

package ObjetosDoMapa;

import ElementosGraficos.MapaDeBlocos;
import java.awt.image.BufferedImage;

/**
 *
 * @author Gabriel
 */
public class Inimigo extends ObjetoMapa {

    
    protected int vida, maxVida;
    protected int dano;
    protected boolean morto;
    
    protected boolean atingido;
    protected long tempoAtingido;
    protected int duracaoAtingido=400;
    
    protected BufferedImage[] spriteMorre;
    
    public Inimigo(MapaDeBlocos mb) {
        super(mb);
    }
    
    public boolean estaMorto() {
        return morto;
    }
    
    public boolean olhandoDireita(){return olhandoDireita;}
    
    
    public int Dano(){return dano;}
    
    public void hitFlecha(){
        vida-=2;
        if(vida<0) vida = 0;
        atingido = true;
        tempoAtingido = System.nanoTime();
    }
    
    public void hitEspada(boolean b){
        if(atingido) return;
        vida -=3;
        if(vida<=0) vida = 0;
        dy = -1.5;
        atingido = true;
        tempoAtingido = System.nanoTime();
    }
    
    public void atualiza() {}
    
}
