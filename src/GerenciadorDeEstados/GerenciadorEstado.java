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
    public static final int ESTADO_LEVEL_CONSTRUCTOR=2;
    public static final int ESTADO_AJUDA=3;
    
    private ArrayList<Estado> estados;
    private int estadoAtual;
    
    
    public GerenciadorEstado(){
        estadoAtual=ESTADO_MENU;
        
        estados = new ArrayList<>();
        
        estados.add(new EstadoMenu(this));
        estados.add(new Estado_Level1(this));
        estados.add(new EstadoLevelConstructor(this));
        estados.add(new EstadoAjuda(this));
    }
    
    public void mudarEstado(int estado){
        estadoAtual = estado;
        estados.get(estadoAtual).inicializa();
    }
    
    /**
     * Add a new state dynamically (used for created levels)
     * @param estado The state to add
     */
    public void adicionarEstado(Estado estado) {
        estados.add(estado);
    }
    
    /**
     * Get the list of states (used for accessing dynamically added states)
     * @return The list of states
     */
    public ArrayList<Estado> getEstados() {
        return estados;
    }
    
    /**
     * Load and switch to a specific level by number
     * Creates a generic level state if the level exists
     * @param levelNumber The level number to load (2, 3, 4, etc.)
     * @return true if level was loaded successfully, false otherwise
     */
    public boolean carregarLevel(int levelNumber) {
        if (LevelSaver.levelExists(levelNumber)) {
            // Create new generic level state
            EstadoLevelGenerico levelState = new EstadoLevelGenerico(this, levelNumber);
            adicionarEstado(levelState);
            mudarEstado(estados.size() - 1); // Switch to the newly added state
            return true;
        }
        return false;
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
