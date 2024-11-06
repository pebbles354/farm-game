export interface NPCRelationship {
  npcId: string;
  friendshipScore: number;
}

export interface NPCEvent {
  id: string;
  description: string;
  goldRequired: number;
  npcId: string;
}

export type NPCAction = 
  | { type: 'FARM' }
  | { type: 'VISIT', targetId: string }
  | { type: 'HELP', targetId: string, eventId: string }
  | { type: 'ACCUSE', targetId: string };

export interface NPCState {
  id: string;
  name: string;
  gold: number;
  currentAction: NPCAction | null;
  relationships: NPCRelationship[];
  events: NPCEvent[];
  position: { x: number; y: number };
} 