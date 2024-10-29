import * as PIXI from 'pixi.js';

export class CropSystem {
  constructor(tileSize) {
    this.tileSize = tileSize;
    this.crops = [];
  }

  plantCrop(plot, world) {
    const crop = PIXI.Sprite.from('assets/plants/cabbage_2.png');
    crop.anchor.set(0.5);
    crop.position.set(
      plot.position.x + this.tileSize / 2,
      plot.position.y + this.tileSize / 4 // Changed from tileSize/2 to tileSize/4 to move sprite up
    );
    
    // Add growth animation
    crop.growthStage = 0;
    crop.name = 'crop';
    this.crops.push(crop);
    world.addChild(crop);
    
    // Start growing
    this.growCrop(crop);
  }

  growCrop(crop) {
    const growthInterval = setInterval(() => {
      crop.growthStage++;
      
      if (crop.growthStage === 1) {
        crop.texture = PIXI.Texture.from('assets/plants/cabbage_4.png');
      } else if (crop.growthStage === 2) {
        crop.texture = PIXI.Texture.from('assets/plants/cabbage_10.png');
      } else if (crop.growthStage === 3) {
        crop.texture = PIXI.Texture.from('assets/plants/cabbage_18.png');
        crop.isGrown = true;
        clearInterval(growthInterval);
      }
    }, 1000); // Changed from 2000ms to 5000ms (5 seconds) between growth stages
  }

  harvestCrop(worldX, worldY, world) {
    // Convert world coordinates to pixel coordinates
    const pixelX = worldX * this.tileSize;
    const pixelY = worldY * this.tileSize;
    
    // Find all grown crops at this position (in case there are duplicates)
    const cropSprites = world.children.filter(child => {
        return child instanceof PIXI.Sprite && 
               child.name === 'crop' &&
               child.isGrown &&
               Math.abs(child.x - (pixelX + this.tileSize/2)) < this.tileSize/2 &&
               Math.abs(child.y - (pixelY + this.tileSize/4)) < this.tileSize/2;
    });

    if (cropSprites.length > 0) {
        // Remove all crops at this position
        cropSprites.forEach(cropSprite => {
            // Remove from our internal crops array
            const cropIndex = this.crops.indexOf(cropSprite);
            if (cropIndex > -1) {
                this.crops.splice(cropIndex, 1);
            }
            
            // Ensure the sprite is properly destroyed
            cropSprite.destroy();
            world.removeChild(cropSprite);
        });
        return true;
    }
    
    return false;
  }

  hasCropAt(worldX, worldY) {
    const pixelX = worldX * this.tileSize;
    const pixelY = worldY * this.tileSize;
    
    return this.crops.some(crop => 
      Math.abs(crop.x - (pixelX + this.tileSize/2)) < this.tileSize/2 &&
      Math.abs(crop.y - (pixelY + this.tileSize/4)) < this.tileSize/2
    );
  }
}