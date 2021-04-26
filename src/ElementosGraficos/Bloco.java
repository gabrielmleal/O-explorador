/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

package ElementosGraficos;

import java.awt.image.BufferedImage;

/**
 *
 * @author Gabriel
 */
public class Bloco {//Classe para fazer o mapa de blocos
    
    //Normal é quando o personagem/monstro/objeto pode prosseguir no mapa
    public static final int NORMAL=0;
    //Bloqueado é o contrário
    public static final int BLOQUEADO=1;
    
    //Imagem individual de cada bloco
    private BufferedImage bloco;
    //tipo do bloco, que pode ser normal ou bloqueado
    private int tipo;
    
    //Construtor padrão do bloco
    public Bloco(BufferedImage bloco, int tipo){
        this.bloco=bloco;
        this.tipo=tipo;
    }
    
    //pega o tipo do bloco
    public int Tipo(){return tipo;}
    //pega a imagem do bloco
    public BufferedImage Imagem(){return bloco;}
}
