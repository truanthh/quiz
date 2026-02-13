import { Player } from "./types/index.ts";

export class Lobby {
  private readonly MAX_SLOTS = 8;
  private slots: (Player | null)[];

  constructor(createdBy: Player) {
    this.slots = new Array(this.MAX_SLOTS).fill(null);
  }

  addPlayer(player: Player) {
    const emptySlotIndex = this.slots.findIndex((el) => !el);

    if (emptySlotIndex === -1) return false;

    this.slots[emptySlotIndex] = player;
  }
}
