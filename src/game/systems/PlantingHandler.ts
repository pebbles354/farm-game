import * as PIXI from 'pixi.js';
import { Inventory } from '../inventory/Inventory';
import { InventoryUI } from '../inventory/InventoryUI';
import { MessageSystem } from '../systems/MessageSystem';
import { CropSystem } from '../systems/CropSystem';
import { WorldGenerator } from '../world/WorldGenerator';

export class PlantingHandler {
  private tileSize: number;
  private world: PIXI.Container;
  private inventory: Inventory;
  private inventoryUI: InventoryUI;
  private messageSystem: MessageSystem;
  private cropSystem: CropSystem;
  private worldGenerator: WorldGenerator;

  constructor(
    tileSize: number,
    world: PIXI.Container,
    inventory: Inventory,
    inventoryUI: InventoryUI,
    messageSystem: MessageSystem,
    cropSystem: CropSystem,
    worldGenerator: WorldGenerator
  ) {
    this.tileSize = tileSize;
    this.world = world;
    this.inventory = inventory;
    this.inventoryUI = inventoryUI;
    this.messageSystem = messageSystem;
    this.cropSystem = cropSystem;
    this.worldGenerator = worldGenerator;
  }

  handlePlanting(playerPos: PIXI.Point) {
    const worldX = Math.floor(playerPos.x / this.tileSize);
    const worldY = Math.floor(playerPos.y / this.tileSize);

    // First, try to harvest any grown crops
    const harvestedCrop = this.cropSystem.harvestCrop(worldX, worldY, this.world);
    if (harvestedCrop) {
      this.inventory.addItem('lettuce', 1);
      this.inventoryUI.update();
      this.messageSystem.showMessage('Harvested lettuce!');
      return;
    }

    // If there's an unripe crop here, show message
    if (this.cropSystem.hasCropAt(worldX, worldY)) {
      this.messageSystem.showMessage('This crop is not ready for harvest yet.');
      return;
    }

    // If no crop, try planting
    if (this.worldGenerator.isFarmland(worldX, worldY)) {
      if (this.inventory.getItemQuantity('seeds') > 0) {
        const plot = {
          position: new PIXI.Point(worldX * this.tileSize, worldY * this.tileSize)
        };
        this.cropSystem.plantCrop(plot, this.world);
        // Remove a seed from inventory
        this.inventory.removeItem('seeds', 1);
        this.inventoryUI.update();
      } else {
        this.messageSystem.showMessage('No seeds available to plant.');
      }
    }
  }
}