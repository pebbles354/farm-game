// src/inventory/InventoryUI.js
import * as PIXI from 'pixi.js';

export class InventoryUI {
  constructor(app, inventory) {
    this.app = app;
    this.inventory = inventory;
    this.container = new PIXI.Container();
    this.app.stage.addChild(this.container);

    // Background for the inventory
    const background = new PIXI.Graphics();
    background.beginFill(0x000000, 0.5); // Semi-transparent black
    background.drawRect(10, 10, 200, 100);
    background.endFill();
    this.container.addChild(background);

    // Titles
    const style = new PIXI.TextStyle({
      fill: "#FFFFFF",
      fontSize: 16,
      fontWeight: "bold"
    });

    const title = new PIXI.Text("Inventory", style);
    title.position.set(20, 20);
    this.container.addChild(title);

    // Item Labels
    this.itemLabels = {};

    const items = ["seeds", "lettuce", "money"];
    items.forEach((item, index) => {
      const itemName = new PIXI.Text(`${item.charAt(0).toUpperCase() + item.slice(1)}:`, {
        fill: "#FFFFFF",
        fontSize: 14
      });
      itemName.position.set(20, 50 + index * 20);
      this.container.addChild(itemName);

      const itemQuantity = new PIXI.Text(this.inventory.getItemQuantity(item), {
        fill: "#FFFFFF",
        fontSize: 14
      });
      itemQuantity.position.set(100, 50 + index * 20);
      this.container.addChild(itemQuantity);

      this.itemLabels[item] = itemQuantity;
    });
  }

  // Update the UI to reflect inventory changes
  update() {
    for (let item in this.itemLabels) {
      if (this.itemLabels.hasOwnProperty(item)) {
        this.itemLabels[item].text = this.inventory.getItemQuantity(item);
      }
    }
  }
}
