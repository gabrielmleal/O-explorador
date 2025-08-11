/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

package GerenciadorDeEstados;

import java.awt.Graphics2D;
import java.util.ArrayList;

/**
 *
 * @author Gabriel
 */
public class GerenciadorEstado {
    
    
    public static final int ESTADO_MENU=0;
    public static final int ESTADO_LEVEL_1=1;
    public static final int ESTADO_AJUDA=2;
    public static final int ESTADO_LEVEL_CONSTRUCTOR=3;
    
    private ArrayList<Estado> estados;
    private int estadoAtual;
    
    
    public GerenciadorEstado(){
        estadoAtual=ESTADO_MENU;
        
        estados = new ArrayList<>();
        
        estados.add(new EstadoMenu(this));
        estados.add(new Estado_Level1(this));
        estados.add(new EstadoAjuda(this));
        estados.add(new EstadoLevelConstructor(this));
    }
    
    public void mudarEstado(int estado){
        estadoAtual = estado;
        estados.get(estadoAtual).inicializa();
    }
    public void atualiza(){
        estados.get(estadoAtual).atualiza();
    }
    public void desenha(Graphics2D g){
        estados.get(estadoAtual).desenha(g);
    }
    public void keyPressed(int k){
        estados.get(estadoAtual).keyPressed(k);
    }
    public void keyReleased(int k){
        estados.get(estadoAtual).keyReleased(k);
    }
}
