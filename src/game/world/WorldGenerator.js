import * as PIXI from 'pixi.js';
import { createNoise2D } from 'simplex-noise';

export class WorldGenerator {

  constructor(tileSize, worldSize) {
    this.tileSize = tileSize;
    this.worldSize = worldSize;
    this.farmSize = 10;
    this.noise2D = createNoise2D();
    this.farmlandBounds = this.calculateFarmlandBounds();
    this.grassTexture = PIXI.Texture.from('/assets/magecity.png');
    this.dirtTexture = PIXI.Texture.from('/assets/gentle-obj.png');
    this.pathTexture = PIXI.Texture.from('/assets/magecity.png');
    this.storeTexture = PIXI.Texture.from('/assets/gentle-obj.png');
    this.shopkeeperTexture = PIXI.Texture.from('/assets/32x32folk.png');
    this.invalidTiles = new Set();
    console.log('Grass Texture:', this.grassTexture);
  }

  calculateFarmlandBounds() {
    const startX = Math.floor((this.worldSize - this.farmSize) / 2);
    const startY = Math.floor((this.worldSize - this.farmSize) / 2);
    return {
      startX,
      startY,
      endX: startX + this.farmSize,
      endY: startY + this.farmSize
    };
  }

  isFarmland(x, y) {
    return x >= this.farmlandBounds.startX && 
          x < this.farmlandBounds.endX && 
          y >= this.farmlandBounds.startY && 
          y < this.farmlandBounds.endY;
  }

  isPathway(x, y) {
    const centerX = Math.floor(this.worldSize / 2);
    const centerY = Math.floor(this.worldSize / 2);

    // Square around farmland
    const isSquarePath = (
      // Left path
      (x === this.farmlandBounds.startX - 1 && 
       y >= this.farmlandBounds.startY - 1 && 
       y <= this.farmlandBounds.endY) ||
      // Right path 
      (x === this.farmlandBounds.endX && 
       y >= this.farmlandBounds.startY - 1 && 
       y <= this.farmlandBounds.endY) ||
      // Top path
      (y === this.farmlandBounds.startY - 1 && 
       x >= this.farmlandBounds.startX - 1 && 
       x <= this.farmlandBounds.endX) ||
      // Bottom path
      (y === this.farmlandBounds.endY && 
       x >= this.farmlandBounds.startX - 1 && 
       x <= this.farmlandBounds.endX)
    );

    // Vertical and horizontal paths extending to world edges
    const isExtendedPath = (
      // Vertical path through center
      (x === centerX && y < this.farmlandBounds.startY - 1) || // Upper vertical
      (x === centerX && y > this.farmlandBounds.endY) || // Lower vertical
      // Horizontal path through center
      (y === centerY && x < this.farmlandBounds.startX - 1) || // Left horizontal
      (y === centerY && x > this.farmlandBounds.endX) // Right horizontal
    );

    return isSquarePath || isExtendedPath;
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
        
        if (this.isFarmland(x, y)) {
          tile = new PIXI.Sprite(new PIXI.Texture(this.dirtTexture, new PIXI.Rectangle(0, 0, 120, 120)));
        } else if (this.isPathway(x, y)) {
          tile = new PIXI.Sprite(new PIXI.Texture(this.pathTexture, new PIXI.Rectangle(32, 0, 32, 32)));
        } else if (noiseValue < -0.6) {
          tile = new PIXI.Graphics();
          tile.beginFill(0x0000FF);
          tile.drawRect(0, 0, this.tileSize, this.tileSize);
          tile.endFill();
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
    
    world.addChild(worldContainer);
  }

  isInvalid(x, y) {
    return this.invalidTiles.has(`${x},${y}`);
  }
}