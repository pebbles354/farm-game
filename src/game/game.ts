// src/game/Game.ts

import * as PIXI from 'pixi.js';
import { Player } from './entities/player.tsx';
import { WorldGenerator } from './world/WorldGenerator.js';
import { CropSystem } from './systems/CropSystem.js';
import { characters } from '../../data/characters.ts';
import { Inventory } from './inventory/Inventory.js';
import { InventoryUI } from './inventory/InventoryUI.js';

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
    
    // Initialize Inventory
    this.inventory = new Inventory();
    
    // Initialize Inventory UI
    this.inventoryUI = new InventoryUI(this.app, this.inventory);
    
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
        this.handlePlanting();
      }
      // Handle buying and selling via keyboard
      if (e.key === 'b') { // 'b' to buy seeds
        this.handleBuySeeds();
      }
      if (e.key === 'v') { // 'v' to sell lettuce
        this.handleSellLettuce();
      }
    });
    window.addEventListener('keyup', (e: KeyboardEvent) => {
      this.keys[e.key] = false;
    });

    // Load the texture and initialize the game
    this.loadTextures();
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
    this.setupInteraction();
    
    // Create player at the center of the farmland
    const centerX = (this.worldSize * this.tileSize) / 2;
    const centerY = (this.worldSize * this.tileSize) / 2;
    this.player = new Player(centerX, centerY, this.tileSize, this.inventory);
    this.world.addChild(this.player.sprite);
    
    // Center the view on the player
    this.centerViewOnPlayer();

    // Start the animation loop
    this.app.ticker.add(() => this.update());
  }

  update() {
    if (!this.isDragging && this.player) {
      this.player.update();
      this.centerViewOnPlayer();
    }
  }

  centerViewOnPlayer() {
    if (this.player) {
      const playerPos = this.player.getPosition();
      this.world.position.x = this.app.screen.width / 2 - playerPos.x;
      this.world.position.y = this.app.screen.height / 2 - playerPos.y;
    }
  }

  handlePlanting() {
    if (this.isDragging || !this.player) return;

    const playerPos = this.player.getPosition();
    const worldX = Math.floor(playerPos.x / this.tileSize);
    const worldY = Math.floor(playerPos.y / this.tileSize);
    
    // Check if player is in farmland area
    if (this.worldGenerator.isFarmland(worldX, worldY)) {
      // Check if player has seeds
      if (this.inventory.getItemQuantity('seeds') > 0) {
        const plot = {
          position: new PIXI.Point(worldX * this.tileSize, worldY * this.tileSize)
        };
        this.cropSystem.plantCrop(plot, this.world);
        // Remove a seed from inventory
        this.inventory.removeItem('seeds', 1);
        this.inventoryUI.update();
      } else {
        // Remove any existing message containers
        const existingMessages = this.app.stage.children.filter(child => 
          child instanceof PIXI.Container && child !== this.world && child !== this.inventoryUI.container
        );
        existingMessages.forEach(message => this.app.stage.removeChild(message));

        const messageContainer = new PIXI.Container();
        const messageBackground = new PIXI.Graphics();
        messageBackground.beginFill(0x000000, 0.5); // Semi-transparent black
        messageBackground.drawRect(0, 0, 300, 50);
        messageBackground.endFill();
        messageContainer.addChild(messageBackground);

        const message = new PIXI.Text('No seeds available to plant.', {
          fill: "#FFFFFF",
          fontSize: 14,
          fontWeight: "bold"
        });
        message.position.set(10, 15);
        messageContainer.addChild(message);

        messageContainer.position.set(
          (this.app.screen.width - messageContainer.width) / 2,
          this.app.screen.height - messageContainer.height - 20
        );
        this.app.stage.addChild(messageContainer);

        // Remove message after 10 seconds
        setTimeout(() => {
          this.app.stage.removeChild(messageContainer);
        }, 10000);
      }
    }
  }

  handleBuySeeds() {
    // Define seed price
    const seedPrice = 5;
    // Define how many seeds to buy per transaction
    const seedsToBuy = 1;

    if (this.inventory.getItemQuantity('money') >= seedPrice * seedsToBuy) {
      this.inventory.buySeeds(seedsToBuy, seedPrice);
      this.inventoryUI.update();
      console.log(`Bought ${seedsToBuy} seed(s) for $${seedPrice * seedsToBuy}.`);
    } else {
      console.warn('Not enough money to buy seeds.');
      // Optionally, display a message to the player
    }
  }

  handleSellLettuce() {
    // Define lettuce price
    const lettucePrice = 10;
    // Define how many lettuce to sell per transaction
    const lettuceToSell = 1;

    if (this.inventory.getItemQuantity('lettuce') >= lettuceToSell) {
      this.inventory.sellLettuce(lettuceToSell, lettucePrice);
      this.inventoryUI.update();
      console.log(`Sold ${lettuceToSell} lettuce(s) for $${lettucePrice * lettuceToSell}.`);
    } else {
      console.warn('Not enough lettuce to sell.');
      // Optionally, display a message to the player
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
}
