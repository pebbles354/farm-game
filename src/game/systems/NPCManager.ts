import { NPCState, NPCRelationship, NPCEvent, NPCAction } from '../types/NPCTypes';
import { MessageSystem } from './MessageSystem';
import { NPC } from '../entities/NPC';

export class NPCManager {
  private npcs: Map<string, NPCState> = new Map();
  private npcSprites: Map<string, NPC> = new Map();
  private messageSystem: MessageSystem;
  private tileSize: number;

  constructor(messageSystem: MessageSystem, tileSize: number) {
    this.messageSystem = messageSystem;
    this.tileSize = tileSize;
  }

  registerNPCSprite(npcId: string, npcSprite: NPC) {
    this.npcSprites.set(npcId, npcSprite);
  }

  initializeNPC(id: string, name: string, position: { x: number; y: number }) {
    const npc: NPCState = {
      id,
      name,
      gold: 100, // Starting gold
      currentAction: null,
      relationships: [],
      events: [],
      position
    };

    this.npcs.set(id, npc);
  }

  getNPCState(id: string): NPCState | undefined {
    return this.npcs.get(id);
  }

  private updateRelationship(npcId: string, targetId: string, change: number) {
    const npc = this.npcs.get(npcId);
    if (!npc) return;

    const relationship = npc.relationships.find(r => r.npcId === targetId);
    if (relationship) {
      relationship.friendshipScore = Math.max(1, Math.min(10, relationship.friendshipScore + change));
    } else {
      npc.relationships.push({ npcId: targetId, friendshipScore: 5 + change });
    }
  }

  private generateRandomEvent(npcId: string) {
    if (Math.random() < 0.1) { // 10% chance
      const npc = this.npcs.get(npcId);
      if (!npc) return;

      const event: NPCEvent = {
        id: `event_${Date.now()}`,
        description: `${npc.name} needs help resolving an issue`,
        goldRequired: Math.floor(Math.random() * 50) + 10,
        npcId
      };

      npc.events.push(event);
      console.log(`${npc.name} has encountered an event requiring ${event.goldRequired} gold!`);
    }
  }

  private async performAction(npcId: string) {
    const npc = this.npcs.get(npcId);
    if (!npc) return;

    const actions = ['FARM', 'VISIT'];
    const randomAction = actions[Math.floor(Math.random() * actions.length)];

    if (randomAction === 'FARM') {
      const sourceNpcSprite = this.npcSprites.get(npcId);
      if (sourceNpcSprite) {
        // Return to original farm position first
        console.log(`${npc.name} is returning to their farm`);
        sourceNpcSprite.moveTo(npc.position.x, npc.position.y);

        // Wait until NPC reaches their farm
        while (!sourceNpcSprite.isAtTarget()) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Start farming once they're at their farm
        npc.currentAction = { type: 'FARM' };
        console.log(`${npc.name} is farming`);
        
        await new Promise(resolve => setTimeout(resolve, 10000));
        const goldEarned = Math.floor(Math.random() * 20) + 5;
        npc.gold += goldEarned;
        
        console.log(`${npc.name} earned ${goldEarned} gold from farming`);
      }
    } else {
      const otherNpcs = Array.from(this.npcs.values()).filter(n => n.id !== npcId);
      const targetNpc = otherNpcs[Math.floor(Math.random() * otherNpcs.length)];
      
      npc.currentAction = { type: 'VISIT', targetId: targetNpc.id };
      console.log(`${npc.name} is visiting ${targetNpc.name}`);

      const sourceNpcSprite = this.npcSprites.get(npcId);
      const targetNpcSprite = this.npcSprites.get(targetNpc.id);

      if (sourceNpcSprite && targetNpcSprite) {
        let hasReachedTarget = false;
        let attempts = 0;
        const maxAttempts = 3; // Prevent infinite chase

        while (!hasReachedTarget && attempts < maxAttempts) {
          const targetPos = targetNpcSprite.getPosition();
          sourceNpcSprite.moveTo(targetPos.x, targetPos.y);

          // Wait for NPC to reach target or get close enough
          while (!sourceNpcSprite.isAtTarget()) {
            const currentPos = sourceNpcSprite.getPosition();
            const newTargetPos = targetNpcSprite.getPosition();
            
            // Check if target has moved significantly
            const distance = Math.sqrt(
              Math.pow(currentPos.x - newTargetPos.x, 2) + 
              Math.pow(currentPos.y - newTargetPos.y, 2)
            );

            // If within 2 tiles, consider it close enough
            if (distance <= this.tileSize * 2) {
              hasReachedTarget = true;
              break;
            }

            // If target has moved significantly, update path
            if (Math.abs(targetPos.x - newTargetPos.x) > this.tileSize || 
                Math.abs(targetPos.y - newTargetPos.y) > this.tileSize) {
              break; // Break the inner loop to recalculate path
            }

            await new Promise(resolve => setTimeout(resolve, 100));
          }

          attempts++;
        }

        // Only proceed with conversation if we reached the target
        if (hasReachedTarget) {
          console.log(`${npc.name} is talking with ${targetNpc.name}`);
          
          // Stop both NPCs for conversation
          sourceNpcSprite.startConversation();
          targetNpcSprite.startConversation();
          
          await new Promise(resolve => setTimeout(resolve, 10000));
          
          // Resume both NPCs after conversation
          sourceNpcSprite.endConversation();
          targetNpcSprite.endConversation();

          // Random chance to help with event or accuse
          if (Math.random() < 0.3 && targetNpc.events.length > 0) {
            const event = targetNpc.events[0];
            if (npc.gold >= event.goldRequired) {
              npc.gold -= event.goldRequired;
              targetNpc.events = targetNpc.events.filter(e => e.id !== event.id);
              this.updateRelationship(npcId, targetNpc.id, 2);
              console.log(`${npc.name} helped ${targetNpc.name} resolve their event!`);
              // Add another delay after helping
              await new Promise(resolve => setTimeout(resolve, 5000));
            }
          } else if (Math.random() < 0.1) {
            npc.currentAction = { type: 'ACCUSE', targetId: targetNpc.id };
            this.updateRelationship(npcId, targetNpc.id, -3);
            console.log(`${npc.name} accused ${targetNpc.name} of being a witch!`);
            // Add delay after accusation
            await new Promise(resolve => setTimeout(resolve, 5000));
          }

          // Return to original position
          const originalPos = npc.position;
          sourceNpcSprite.moveTo(originalPos.x, originalPos.y);
          
          while (!sourceNpcSprite.isAtTarget()) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        } else {
          console.log(`${npc.name} couldn't catch up with ${targetNpc.name}`);
        }
      }
    }

    npc.currentAction = null;
  }

  update() {
    for (const npc of this.npcs.values()) {
      if (!npc.currentAction) {
        this.generateRandomEvent(npc.id);
        this.performAction(npc.id);
      }
    }
  }
} 