// src/inventory/Inventory.js
export class Inventory {
    constructor() {
      this.items = {
        seeds: 10,
        lettuce: 0,
        money: 0 // Starting money
      };
    }
  
    // Add a specified quantity to an item
    addItem(itemName, quantity = 1) {
      if (this.items.hasOwnProperty(itemName)) {
        this.items[itemName] += quantity;
        console.log(`Added ${quantity} ${itemName}. Total: ${this.items[itemName]}`);
      } else {
        console.warn(`Item "${itemName}" does not exist in the inventory.`);
      }
    }
  
    // Remove a specified quantity from an item
    removeItem(itemName, quantity = 1) {
      if (this.items.hasOwnProperty(itemName)) {
        if (this.items[itemName] >= quantity) {
          this.items[itemName] -= quantity;
          console.log(`Removed ${quantity} ${itemName}. Total: ${this.items[itemName]}`);
        } else {
          console.warn(`Not enough ${itemName} to remove.`);
        }
      } else {
        console.warn(`Item "${itemName}" does not exist in the inventory.`);
      }
    }
  
    // Get the quantity of an item
    getItemQuantity(itemName) {
      return this.items[itemName] || 0;
    }
  
    // Display the entire inventory
    displayInventory() {
      console.log("Current Inventory:", this.items);
    }
  }
  