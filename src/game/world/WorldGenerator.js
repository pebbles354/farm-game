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

    generate(world) {
      const worldContainer = new PIXI.Container();
      
      for (let x = 0; x < this.worldSize; x++) {
        for (let y = 0; y < this.worldSize; y++) {
          const noiseValue = this.noise2D(x * 0.1, y * 0.1);
          let tile;
          
          if (this.isFarmland(x, y)) {
            tile = new PIXI.Sprite(new PIXI.Texture(this.dirtTexture, new PIXI.Rectangle(0, 0, 120, 120)));
            tile.width = this.tileSize;
            tile.height = this.tileSize;
          } else if (this.isPathway(x, y)) {
            tile = new PIXI.Sprite(new PIXI.Texture(this.pathTexture, new PIXI.Rectangle(32, 0, 32, 32)));
            tile.width = this.tileSize;
            tile.height = this.tileSize;
          } else if (noiseValue < -0.6) {
            tile = new PIXI.Graphics();
            tile.beginFill(0x0000FF); // Blue for water
            tile.drawRect(0, 0, this.tileSize, this.tileSize);
            tile.endFill();
          } else {
            // Use grass texture from magecity.png
            tile = new PIXI.Sprite(new PIXI.Texture(this.grassTexture, new PIXI.Rectangle(0, 0, 32, 32)));
            tile.width = this.tileSize;
            tile.height = this.tileSize;
          }
          
          tile.position.set(x * this.tileSize, y * this.tileSize);
          worldContainer.addChild(tile);
        }
      }
      
      world.addChild(worldContainer);
    }
  }