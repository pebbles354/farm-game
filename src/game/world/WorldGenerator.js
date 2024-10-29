import * as PIXI from 'pixi.js';
import { createNoise2D } from 'simplex-noise';

export class WorldGenerator {

  constructor(tileSize, worldSize) {
    this.tileSize = tileSize;
    this.worldSize = worldSize;
    this.farmSize = 10;
    this.noise2D = createNoise2D();
    this.farmlandBounds = this.calculateFarmlandBounds();
    this.additionalFarmlandBounds = this.calculateAdditionalFarmlandBounds();
    this.grassTexture = PIXI.Texture.from('/assets/magecity.png');
    this.dirtTexture = PIXI.Texture.from('/assets/gentle-obj.png');
    this.pathTexture = PIXI.Texture.from('/assets/magecity.png');
    this.storeTexture = PIXI.Texture.from('/assets/gentle-obj.png');
    this.shopkeeperTexture = PIXI.Texture.from('/assets/32x32folk.png');
    this.fenceTexture = PIXI.Texture.from('/assets/rpg-tileset.png');
    this.waterTexture = PIXI.Texture.from('/assets/rpg-tileset.png');
    this.invalidTiles = new Set();
    this.pathConnections = new Set(); // Store connecting path coordinates
    this.fences = new Map(); // Store fence sprites by farm coordinates
    console.log('Grass Texture:', this.grassTexture);
  }

  calculateFarmlandBounds() {
    const farmlands = [];
    const centerX = Math.floor(this.worldSize / 2);
    const centerY = Math.floor(this.worldSize / 2);
    
    // Player's farm in center
    farmlands.push({
      startX: centerX - Math.floor(this.farmSize / 2),
      startY: centerY - Math.floor(this.farmSize / 2),
      endX: centerX + Math.ceil(this.farmSize / 2),
      endY: centerY + Math.ceil(this.farmSize / 2),
      isPlayerFarm: true
    });

    // NPC farms in corners and sides with more spacing, avoiding main paths
    const positions = [
      {x: this.worldSize/6, y: this.worldSize/6},     // Top left
      {x: this.worldSize*5/6, y: this.worldSize/6},   // Top right
      {x: this.worldSize/6, y: this.worldSize*5/6},   // Bottom left
      {x: this.worldSize*5/6, y: this.worldSize*5/6}, // Bottom right
      {x: this.worldSize/6, y: centerY + this.farmSize},    // Below middle left
      {x: this.worldSize*5/6, y: centerY - this.farmSize}   // Above middle right
    ];

    positions.forEach(pos => {
      const startX = Math.floor(pos.x - this.farmSize/2);
      const startY = Math.floor(pos.y - this.farmSize/2);
      
      // Check if farm would overlap with main paths
      const endX = startX + this.farmSize;
      const endY = startY + this.farmSize;
      const wouldOverlapMainPaths = (
        (startX <= centerX + 2 && endX >= centerX - 2) || 
        (startY <= centerY + 2 && endY >= centerY - 2)
      );

      if (!wouldOverlapMainPaths) {
        farmlands.push({
          startX,
          startY,
          endX,
          endY,
          isPlayerFarm: false,
          connectPoint: {x: startX + Math.floor(this.farmSize/2), y: startY + Math.floor(this.farmSize/2)}
        });
      }
    });

    return farmlands;
  }

  calculateAdditionalFarmlandBounds() {
    return [];
  }

  isFarmland(x, y) {
    return this.farmlandBounds.some(bounds => 
      (x >= bounds.startX && x < bounds.endX && y >= bounds.startY && y < bounds.endY)
    );
  }

  isPathway(x, y) {
    const centerX = Math.floor(this.worldSize / 2);
    const centerY = Math.floor(this.worldSize / 2);

    // Check main cross paths (2 tiles wide)
    const isMainPath = (
      (x === centerX || x === centerX - 1) || // Vertical path
      (y === centerY || y === centerY - 1)    // Horizontal path
    );

    // Check farm border paths
    const isFarmBorderPath = this.farmlandBounds.some(bounds => {
      // For player farm, add border paths right next to farm
      if (bounds.isPlayerFarm) {
        return (
          // Left path
          (x === bounds.startX - 1 && y >= bounds.startY - 1 && y <= bounds.endY) ||
          // Right path
          (x === bounds.endX && y >= bounds.startY - 1 && y <= bounds.endY) ||
          // Top path
          (y === bounds.startY - 1 && x >= bounds.startX - 1 && x <= bounds.endX) ||
          // Bottom path
          (y === bounds.endY && x >= bounds.startX - 1 && x <= bounds.endX)
        );
      }

      // For NPC farms with fences, add border paths
      return (
        // Left path
        (x === bounds.startX - 2 && y >= bounds.startY - 2 && y <= bounds.endY + 1) ||
        // Right path 
        (x === bounds.endX + 1 && y >= bounds.startY - 2 && y <= bounds.endY + 1) ||
        // Top path
        (y === bounds.startY - 2 && x >= bounds.startX - 2 && x <= bounds.endX + 1) ||
        // Bottom path
        (y === bounds.endY + 1 && x >= bounds.startX - 2 && x <= bounds.endX + 1)
      );
    });

    // Check connecting paths
    const isConnectingPath = this.pathConnections.has(`${x},${y}`);

    return isMainPath || isFarmBorderPath || isConnectingPath;
  }

  addFenceToFarm(farm, worldContainer) {
    if (farm.isPlayerFarm) return; // Skip player's farm

    const fenceSprites = [];
    
    // Add horizontal fences (top and bottom)
    for (let x = farm.startX - 1; x <= farm.endX; x++) {
      // Top fence
      const topFence = new PIXI.Sprite(new PIXI.Texture(this.fenceTexture, new PIXI.Rectangle(592, 432, 32, 32)));
      topFence.width = this.tileSize;
      topFence.height = this.tileSize;
      topFence.position.set(x * this.tileSize, (farm.startY - 1) * this.tileSize);
      worldContainer.addChild(topFence);
      fenceSprites.push(topFence);
      // Mark top fence as invalid
      this.invalidTiles.add(`${x},${farm.startY - 1}`);

      // Bottom fence
      const bottomFence = new PIXI.Sprite(new PIXI.Texture(this.fenceTexture, new PIXI.Rectangle(592, 432, 32, 32)));
      bottomFence.width = this.tileSize;
      bottomFence.height = this.tileSize;
      bottomFence.position.set(x * this.tileSize, farm.endY * this.tileSize);
      worldContainer.addChild(bottomFence);
      fenceSprites.push(bottomFence);
      // Mark bottom fence as invalid
      this.invalidTiles.add(`${x},${farm.endY}`);
    }

    // Add vertical fences (left and right)
    for (let y = farm.startY - 1; y <= farm.endY; y++) {
      // Left fence
      const leftFence = new PIXI.Sprite(new PIXI.Texture(this.fenceTexture, new PIXI.Rectangle(592, 432, 32, 32)));
      leftFence.width = this.tileSize;
      leftFence.height = this.tileSize;
      leftFence.position.set((farm.startX - 1) * this.tileSize, y * this.tileSize);
      worldContainer.addChild(leftFence);
      fenceSprites.push(leftFence);
      // Mark left fence as invalid
      this.invalidTiles.add(`${farm.startX - 1},${y}`);

      // Right fence
      const rightFence = new PIXI.Sprite(new PIXI.Texture(this.fenceTexture, new PIXI.Rectangle(592, 432, 32, 32)));
      rightFence.width = this.tileSize;
      rightFence.height = this.tileSize;
      rightFence.position.set(farm.endX * this.tileSize, y * this.tileSize);
      worldContainer.addChild(rightFence);
      fenceSprites.push(rightFence);
      // Mark right fence as invalid
      this.invalidTiles.add(`${farm.endX},${y}`);
    }

    // Store fence sprites for this farm
    this.fences.set(`${farm.startX},${farm.startY}`, fenceSprites);
  }

  removeFenceFromFarm(farm) {
    const key = `${farm.startX},${farm.startY}`;
    const fenceSprites = this.fences.get(key);
    if (fenceSprites) {
      fenceSprites.forEach(sprite => {
        sprite.parent.removeChild(sprite);
      });
      this.fences.delete(key);
    }
  }

  calculateConnectingPaths() {
    this.pathConnections.clear();
    const centerX = Math.floor(this.worldSize / 2);
    const centerY = Math.floor(this.worldSize / 2);

    // For each non-player farm, create paths to both main paths
    this.farmlandBounds.forEach(farm => {
      if (!farm.isPlayerFarm && farm.connectPoint) {
        const {x: farmX, y: farmY} = farm.connectPoint;
        
        // Connect to vertical path
        const startX = Math.min(farmX, centerX);
        const endX = Math.max(farmX, centerX);
        for (let x = startX; x <= endX; x++) {
          this.pathConnections.add(`${x},${farmY}`);
          this.pathConnections.add(`${x},${farmY - 1}`); // Add second tile width
        }

        // Connect to horizontal path
        const startY = Math.min(farmY, centerY);
        const endY = Math.max(farmY, centerY);
        for (let y = startY; y <= endY; y++) {
          this.pathConnections.add(`${farmX},${y}`);
          this.pathConnections.add(`${farmX - 1},${y}`); // Add second tile width
        }
      }
    });
  }

  createStore(x, y, worldContainer) {
    // Add store tiles to invalid set (2x2 area)
    for (let i = 0; i < 2; i++) {
      for (let j = 0; j < 2; j++) {
        this.invalidTiles.add(`${x + i},${y + j}`);
      }
    }
    
    // Add grass under store (2x2 grid to match store size)
    for (let i = 0; i < 2; i++) {
        for (let j = 0; j < 2; j++) {
            const grass = new PIXI.Sprite(new PIXI.Texture(this.grassTexture, new PIXI.Rectangle(0, 0, 32, 32)));
            grass.width = this.tileSize;
            grass.height = this.tileSize;
            grass.position.set(
                (x + i) * this.tileSize,
                (y + j) * this.tileSize
            );
            worldContainer.addChild(grass);
        }
    }

    // Create store building from gentle-obj.png (assuming it's a 32x32 building sprite)
    const store = new PIXI.Sprite(new PIXI.Texture(this.storeTexture, new PIXI.Rectangle(990, 510, 100, 100)));
    store.width = this.tileSize * 2;
    store.height = this.tileSize * 2;
    store.position.set(x * this.tileSize, y * this.tileSize);
    store.name = 'store';
    
    // Add shopkeeper sprite
    const shopkeeper = new PIXI.Sprite(new PIXI.Texture(this.shopkeeperTexture, new PIXI.Rectangle(224, 130, 32, 32)));
    shopkeeper.width = this.tileSize;
    shopkeeper.height = this.tileSize;
    shopkeeper.position.set(
      (x * this.tileSize) + this.tileSize/2, 
      (y * this.tileSize) + this.tileSize * 1.5
    );
    shopkeeper.name = 'shopkeeper';
    // Add shopkeeper position to invalid tiles
    const shopkeeperX = Math.floor((x * this.tileSize + this.tileSize/2) / this.tileSize);
    const shopkeeperY = Math.floor((y * this.tileSize + this.tileSize * 1.5) / this.tileSize);
    this.invalidTiles.add(`${shopkeeperX},${shopkeeperY}`);

    // Add table
    const table = new PIXI.Sprite(new PIXI.Texture(this.storeTexture, new PIXI.Rectangle(1310, 579, 32, 32)));
    table.width = this.tileSize;
    table.height = this.tileSize;
    table.position.set(
      (x * this.tileSize) + this.tileSize/2,
      (y * this.tileSize) + this.tileSize * 2
    ); 
    table.name = 'table';
    // Add table position and the tile to its left to invalid tiles
    const tableX = Math.floor((x * this.tileSize + this.tileSize/2) / this.tileSize);
    const tableY = Math.floor((y * this.tileSize + this.tileSize * 2) / this.tileSize);
    this.invalidTiles.add(`${tableX},${tableY}`);
    this.invalidTiles.add(`${tableX+1},${tableY}`); // Add the tile to the left of the table

    // Add strawberry box
    const strawberryBox = new PIXI.Sprite(new PIXI.Texture(this.storeTexture, new PIXI.Rectangle(830, 643, 32, 32)));
    strawberryBox.width = this.tileSize;
    strawberryBox.height = this.tileSize;
    strawberryBox.position.set(
      (x * this.tileSize) + this.tileSize * 2,
      (y * this.tileSize) + this.tileSize
    );
    strawberryBox.name = 'strawberryBox';
    // Add strawberry box position to invalid tiles
    const strawberryBoxX = Math.floor((x * this.tileSize + this.tileSize * 2) / this.tileSize);
    const strawberryBoxY = Math.floor((y * this.tileSize + this.tileSize) / this.tileSize);
    this.invalidTiles.add(`${strawberryBoxX},${strawberryBoxY}`);

    // Add all sprites to the container
    worldContainer.addChild(store);
    worldContainer.addChild(shopkeeper);
    worldContainer.addChild(table);
    worldContainer.addChild(strawberryBox);
  }

  generate(world) {
    const worldContainer = new PIXI.Container();
    
    // Calculate connecting paths before generating terrain
    this.calculateConnectingPaths();
    
    // First create a blue background that extends beyond the world
    const waterBackground = new PIXI.Graphics();
    waterBackground.beginFill(0x0066CC); // Ocean blue color
    // Make it larger than the world to ensure coverage
    const padding = this.tileSize * 40; // Extra padding around the world
    waterBackground.drawRect(
        -padding, 
        -padding, 
        (this.worldSize * this.tileSize) + (padding * 2), 
        (this.worldSize * this.tileSize) + (padding * 2)
    );
    waterBackground.endFill();
    worldContainer.addChild(waterBackground);
    
    // Calculate store position (top center)
    const storePosX = Math.floor(this.worldSize / 2) - 1;
    const storePosY = 0;
    
    for (let x = 0; x < this.worldSize; x++) {
      for (let y = 0; y < this.worldSize; y++) {
        // Skip tile generation where store will be
        if (x >= storePosX && x <= storePosX + 1 && 
            y >= storePosY && y <= storePosY + 1) {
          continue;
        }

        const noiseValue = this.noise2D(x * 0.1, y * 0.1);
        let tile;
        
        // Check if any farm is nearby (within 2 tiles)
        const nearFarm = this.farmlandBounds.some(farm => {
          return x >= farm.startX - 2 && x <= farm.endX + 2 &&
                 y >= farm.startY - 2 && y <= farm.endY + 2;
        });

        if (this.isFarmland(x, y)) {
          tile = new PIXI.Sprite(new PIXI.Texture(this.dirtTexture, new PIXI.Rectangle(0, 0, 120, 120)));
        } else if (this.isPathway(x, y)) {
          tile = new PIXI.Sprite(new PIXI.Texture(this.pathTexture, new PIXI.Rectangle(32, 0, 32, 32)));
        } else if (noiseValue < -0.6 && !nearFarm) {
          // Create water background
          tile = new PIXI.Graphics();
          tile.beginFill(0x0000FF);
          tile.drawRect(0, 0, this.tileSize, this.tileSize);
          tile.endFill();
          
          // Add water tile overlay
          const waterOverlay = new PIXI.Sprite(new PIXI.Texture(this.waterTexture, new PIXI.Rectangle(178, 14, 60, 60)));
          waterOverlay.width = this.tileSize;
          waterOverlay.height = this.tileSize;
          tile.addChild(waterOverlay);
          
          tile.isWater = true;
          this.invalidTiles.add(`${x},${y}`);
        } else {
          tile = new PIXI.Sprite(new PIXI.Texture(this.grassTexture, new PIXI.Rectangle(0, 0, 32, 32)));
        }
        
        tile.width = this.tileSize;
        tile.height = this.tileSize;
        tile.position.set(x * this.tileSize, y * this.tileSize);
        worldContainer.addChild(tile);
      }
    }

    // Add store after generating terrain
    this.createStore(storePosX, storePosY, worldContainer);

    // Add fences around non-player farms
    this.farmlandBounds.forEach(farm => {
      this.addFenceToFarm(farm, worldContainer);
    });
    
    world.addChild(worldContainer);
  }

  isInvalid(x, y) {
    return this.invalidTiles.has(`${x},${y}`);
  }
}