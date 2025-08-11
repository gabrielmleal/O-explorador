/*
 * Generic level state for dynamically created levels
 * Can load and run any level-N.mapa file
 */

package GerenciadorDeEstados;

import ElementosGraficos.ImagemDeFundo;
import ElementosGraficos.MapaDeBlocos;
import ObjetosDoMapa.Explosao;
import ObjetosDoMapa.Inimigo;
import ObjetosDoMapa.Jogador;
import ObjetosDoMapa.LoboCinza;
import ObjetosDoMapa.LoboVermelho;
import ObjetosDoMapa.Portal;
import Principal.JogoPanel;
import java.awt.Graphics2D;
import java.awt.event.KeyEvent;
import java.util.ArrayList;

/**
 * Generic level state that can load and run any level
 * Used for dynamically created levels from the level constructor
 * @author Gabriel
 */
public class EstadoLevelGenerico extends Estado {
    
    private MapaDeBlocos mb;
    private ImagemDeFundo ceu, terra;
    private Jogador jogador;
    private ArrayList<Inimigo> inimigos;
    private ArrayList<Explosao> explosoes;
    private Portal portal;
    
    private int levelNumber;
    private String levelFile;
    private int nextLevelNumber;
    
    /**
     * Constructor for generic level state
     * @param ge State manager
     * @param levelNumber The level number to load (2, 3, 4, etc.)
     */
    public EstadoLevelGenerico(GerenciadorEstado ge, int levelNumber) {
        this.ge = ge;
        this.levelNumber = levelNumber;
        this.levelFile = "/Mapas/level" + levelNumber + "-1.mapa";
        this.nextLevelNumber = levelNumber + 1;
        inicializa();
    }
    
    public void inicializa() {
        // Create map with 30x30 pixel blocks
        mb = new MapaDeBlocos(30);
        // Load block images
        mb.carregarBlocos("/Imagens/blocos.gif");
        // Load the specific level map
        mb.carregarMapa(levelFile);
        // Set screen movement speed
        mb.mudarVelocidadeDeTela(0.05);
        
        // Set background images
        ceu = new ImagemDeFundo("/Imagens/Ceu.gif", 0);
        ceu.mudarMovimentoAutomatico(-0.2, 0);
        terra = new ImagemDeFundo("/Imagens/Terra.gif", 0.1);
        
        // Create player
        jogador = new Jogador(mb);
        // Set initial player position
        jogador.mudarPosicaoPara(100, 160);
        
        // Initialize monsters (simplified - no hardcoded positions)
        inicializaMonstros();
        
        // Initialize explosions list
        explosoes = new ArrayList<>();
        
        // Create portal at the end of the level
        portal = new Portal(mb);
        // Position portal at the rightmost part of the map
        int portalX = (mb.qualLarguraDoMapa() - 150); // Near the end of the map
        portal.mudarPosicaoPara(portalX, 165);
    }
    
    /**
     * Initialize monsters for the generic level
     * For now, this is simplified - in the future this could read monster data from a file
     */
    public void inicializaMonstros() {
        inimigos = new ArrayList<>();
        
        // For generic levels, we'll add some basic monsters spread throughout the level
        int mapWidth = mb.qualLarguraDoMapa();
        int numMonsters = Math.min(10, mapWidth / 400); // Roughly 1 monster per 400 pixels
        
        for (int i = 0; i < numMonsters; i++) {
            int x = 300 + (i * (mapWidth - 600) / Math.max(1, numMonsters - 1));
            int y = 140 + (i % 3) * 30; // Vary Y position slightly
            
            Inimigo monster;
            if (i % 3 == 0) {
                monster = new LoboVermelho(mb);
            } else {
                monster = new LoboCinza(mb);
            }
            
            monster.mudarPosicaoPara(x, y);
            inimigos.add(monster);
        }
    }
    
    public void atualiza() {
        portal.atualiza();
        
        // Check if player reached portal
        if (jogador.terminou() && portal.executou()) {
            // Try to go to next level, or back to menu if no next level
            if (LevelSaver.levelExists(nextLevelNumber)) {
                // Load next level
                EstadoLevelGenerico nextLevel = new EstadoLevelGenerico(ge, nextLevelNumber);
                ge.adicionarEstado(nextLevel);
                ge.mudarEstado(ge.getEstados().size() - 1);
            } else {
                // No next level, go back to menu
                ge.mudarEstado(GerenciadorEstado.ESTADO_MENU);
            }
        }
        
        // Check portal collision
        if (portal.checaColisao(jogador)) {
            portal.trocaAnimacao();
            jogador.termina();
        }
        
        // Check if player died
        if (jogador.estaMorto()) {
            ge.mudarEstado(GerenciadorEstado.ESTADO_MENU);
        }
        
        // Update background
        ceu.atualiza();
        
        // Update player
        jogador.atualiza();
        
        // Handle explosions from player teleport
        explosoes.addAll(jogador.getExplosoesParaCriar());
        jogador.limparExplosoesParaCriar();
        
        // Check collisions with enemies
        jogador.checaColisoes(inimigos);
        
        // Update background position based on map position
        terra.mudarPosicaoPara(mb.posX(), mb.posY());
        
        // Update map position based on player position
        mb.mudarPosicaoPara(JogoPanel.LARGURA/2 - jogador.posX(), JogoPanel.ALTURA/2 - jogador.posY());
        
        // Update monsters
        for (int i = 0; i < inimigos.size(); i++) {
            Inimigo monster = inimigos.get(i);
            monster.atualiza();
            if (monster.estaMorto()) {
                inimigos.remove(i);
                i--;
                explosoes.add(new Explosao(mb, monster.posX(), monster.posY()));
            }
        }
        
        // Update explosions
        for (int i = 0; i < explosoes.size(); i++) {
            explosoes.get(i).atualiza();
            if (explosoes.get(i).deveRemover()) {
                explosoes.remove(i);
                i--;
            }
        }
    }
    
    public void desenha(Graphics2D g) {
        ceu.desenha(g);
        terra.desenha(g);
        portal.desenha(g);
        mb.desenha(g);
        jogador.desenha(g);
        
        for (Inimigo monster : inimigos) {
            monster.desenha(g);
        }
        
        for (Explosao explosao : explosoes) {
            explosao.desenha(g);
        }
    }
    
    public void keyPressed(int k) {
        if (jogador.terminou()) return;
        
        if (k == KeyEvent.VK_RIGHT) jogador.Direita(true);
        if (k == KeyEvent.VK_LEFT) jogador.Esquerda(true);
        if (k == KeyEvent.VK_UP) {
            jogador.Pulando(true);
            jogador.tentarPuloDuplo();
        }
        if (k == KeyEvent.VK_DOWN) jogador.Baixo(true);
        if (k == KeyEvent.VK_Z) jogador.ataca();
        if (k == KeyEvent.VK_X) jogador.atira();
        if (k == KeyEvent.VK_C) jogador.corre(true);
        if (k == KeyEvent.VK_V) jogador.teleporta();
        if (k == KeyEvent.VK_B) {
            // Debug key - teleport near end of level
            int endX = mb.qualLarguraDoMapa() - 200;
            jogador.mudarPosicaoPara(endX, 50);
        }
    }
    
    public void keyReleased(int k) {
        if (k == KeyEvent.VK_RIGHT) jogador.Direita(false);
        if (k == KeyEvent.VK_LEFT) jogador.Esquerda(false);
        if (k == KeyEvent.VK_UP) jogador.Pulando(false);
        if (k == KeyEvent.VK_DOWN) jogador.Baixo(false);
        if (k == KeyEvent.VK_C) jogador.corre(false);
    }
    
    public int getLevelNumber() {
        return levelNumber;
    }
}