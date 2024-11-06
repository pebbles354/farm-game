// src/game/Game.ts

import * as PIXI from 'pixi.js';
import { Player } from './entities/player.tsx';
import { WorldGenerator } from './world/WorldGenerator.js';
import { CropSystem } from './systems/CropSystem.js';
import { characters } from '../../data/characters.ts';
import { Inventory } from './inventory/Inventory.js';
import { InventoryUI } from './inventory/InventoryUI.js';
import { MessageSystem } from './systems/MessageSystem';
import { Store } from './store/Store';
import { PlantingHandler } from './systems/PlantingHandler.ts';
import { NPC } from './entities/NPC.tsx';
import { data as f2Data } from '../../data/spritesheets/f2';
import { data as f3Data } from '../../data/spritesheets/f3';
import { data as f4Data } from '../../data/spritesheets/f4';
import { data as f5Data } from '../../data/spritesheets/f5';
import { data as f6Data } from '../../data/spritesheets/f6';

export class Game {
  private app: PIXI.Application;
  private tileSize: number;
  private worldSize: number;
  private farmSize: number;
  private world: PIXI.Container;
  
  // Systems
  private worldGenerator: WorldGenerator;
  private cropSystem: CropSystem;
  
  // Interaction
  private isDragging: boolean;
  private lastPosition: PIXI.Point | null;
  private keys: { [key: string]: boolean };
  
  // Textures and Player
  private characterTexture?: PIXI.Texture;
  private player?: Player;

  // Inventory System
  private inventory: Inventory;
  private inventoryUI: InventoryUI;

  // Message System
  private messageSystem: MessageSystem;

  // Store System
  private store: Store;

  // Planting Handler
  private plantingHandler: PlantingHandler;

  // UI Container
  private uiContainer: PIXI.Container;
  private messageContainer: PIXI.Container;

  // NPCs
  private npc?: NPC;
  private npcs: NPC[] = [];

  constructor(app: PIXI.Application) {
    this.app = app;
    this.tileSize = 32;
    this.worldSize = 100;
    this.farmSize = 10;
    this.world = new PIXI.Container();
    
    // Initialize Systems
    this.worldGenerator = new WorldGenerator(this.tileSize, this.worldSize);
    this.cropSystem = new CropSystem(this.tileSize);
    
    // Add the world container to the stage
    this.app.stage.addChild(this.world);
    
    // Initialize UI Container
    this.uiContainer = new PIXI.Container();
    this.app.stage.addChild(this.uiContainer);
    
    // Initialize Message Container
    this.messageContainer = new PIXI.Container();
    this.app.stage.addChild(this.messageContainer);
    
    // Initialize Inventory
    this.inventory = new Inventory();
    
    // Initialize Inventory UI
    this.inventoryUI = new InventoryUI(this.app, this.inventory);
    
    // Initialize MessageSystem after world and inventoryUI are created
    this.messageSystem = new MessageSystem(this.app, this.world, this.inventoryUI.container, this.messageContainer);
    
    // Enable dragging
    this.isDragging = false;
    this.lastPosition = null;

    // Enable interactive events
    this.app.stage.interactive = true;
    this.world.interactive = true;
    
    // Initialize keyboard state for space key and transactions
    this.keys = {};
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      this.keys[e.key] = true;
      if (e.key === ' ') {
        const playerPos = this.player?.getPosition();
        if (playerPos && this.store.isPlayerInRange(playerPos.x, playerPos.y)) {
          this.store.toggleMenu(this.app);
        } else {
          this.plantingHandler.handlePlanting(playerPos);
        }
      }

    });
    window.addEventListener('keyup', (e: KeyboardEvent) => {
      this.keys[e.key] = false;
    });

    // Load the texture and initialize the game
    this.loadTextures();

    // Initialize Planting Handler
    this.plantingHandler = new PlantingHandler(
      this.tileSize,
      this.world,
      this.inventory,
      this.inventoryUI,
      this.messageSystem,
      this.cropSystem,
      this.worldGenerator
    );

    // Initialize NPCs
    this.initializeNPCs();
 
  }

  loadTextures() {
    const f1Character = characters.find(char => char.name === 'f1');
    if (f1Character) {
      PIXI.Assets.load(f1Character.textureUrl).then(() => {
        this.characterTexture = PIXI.Texture.from(f1Character.textureUrl);
        this.init();
      });
    } else {
      console.error("Character 'f1' not found");
    }
  }

  init() {
    // Generate world using WorldGenerator
    this.worldGenerator.generate(this.world);
    // Store reference to worldGenerator
    (this.world as any).worldGenerator = this.worldGenerator;
    
    this.setupInteraction();
    
    // Create player at the center of the farmland
    const centerX = (this.worldSize * this.tileSize) / 2;
    const centerY = (this.worldSize * this.tileSize) / 2;
    this.player = new Player(centerX, centerY, this.tileSize, this.worldSize, this.world);
    this.world.addChild(this.player.getSprite());


    // Create npc at the center of the farmland
    // const center2X = (this.worldSize * this.tileSize) / 2;
    // const center2Y = (this.worldSize * this.tileSize) / 3;
    // this.npc = new NPC(center2X, center2Y);
    // this.world.addChild(this.npc.getSprite());

    // Run initializeNPC2
    this.initializeNPCs();
    
    // Initialize store
    const storePosX = Math.floor(this.worldSize / 2) - 1;
    const storePosY = 0;
    this.store = new Store(
      storePosX * this.tileSize + this.tileSize, 
      storePosY * this.tileSize + this.tileSize,
      this.inventory,
      this.messageSystem,
      this.inventoryUI,
      this.uiContainer
    );
    // Center the view on the player
    this.centerViewOnPlayer();

    // Start the animation loop
    this.app.ticker.add(() => this.update());
  }

  update() {
    if (!this.isDragging && this.player) {
      this.player.update();
      this.centerViewOnPlayer();

      const playerPos = this.player.getPosition();
      if (this.store.isMenuOpen && !this.store.isPlayerInRange(playerPos.x, playerPos.y)) {
        this.store.closeMenu();
      }
    }

    // NPCs don't need updating yet
  }

  centerViewOnPlayer() {
    if (this.player) {
      const playerPos = this.player.getPosition();
      this.world.position.x = this.app.screen.width / 2 - playerPos.x;
      this.world.position.y = this.app.screen.height / 2 - playerPos.y;
    }
  }


  setupInteraction() {
    this.world.on('pointerdown', (event) => {
      this.isDragging = true;
      this.lastPosition = event.global.clone();
    });

    this.world.on('pointermove', (event) => {
      if (this.isDragging && this.lastPosition) {
        const newPosition = event.global;
        const dx = newPosition.x - this.lastPosition.x;
        const dy = newPosition.y - this.lastPosition.y;
        
        this.world.position.x += dx;
        this.world.position.y += dy;
        
        this.lastPosition = newPosition.clone();
      }
    });

    this.world.on('pointerup', () => {
      this.isDragging = false;
    });

    this.world.on('pointerupoutside', () => {
      this.isDragging = false;
    });
  }

  private initializeNPCs() {
    // Array of available spritesheet data for NPCs
    const spritesheetDataArray = [f2Data, f3Data, f4Data, f5Data, f6Data];
    let spritesheetIndex = 0;

    // Iterate over all farms and create NPCs at the center of each non-player farm
    this.worldGenerator.farmlandBounds.forEach((farm: any) => {
      if (!farm.isPlayerFarm) {
        const centerX = (farm.startX + farm.endX) * this.tileSize / 2;
        const centerY = (farm.startY + farm.endY) * this.tileSize / 2;

        // Select spritesheet data for this NPC
        const spritesheetData = spritesheetDataArray[spritesheetIndex % spritesheetDataArray.length];
        spritesheetIndex++;

        console.log('NPC Position (farm):', { x: centerX, y: centerY });

        const npc = new NPC(centerX, centerY, spritesheetData);

        this.npcs.push(npc);
        this.world.addChild(npc.getSprite());
      }
    });
  }
}
