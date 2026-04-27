declare module "howler" {
  export class Howl {
    constructor(options: Record<string, unknown>);
    play(sprite?: string | number): number;
  }
}
