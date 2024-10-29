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
        clearInterval(growthInterval);
      }
    }, 10000); // Changed from 2000ms to 5000ms (5 seconds) between growth stages
  }
}