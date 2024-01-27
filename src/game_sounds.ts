import revealSoundFile from "./sounds/drip2.wav";
import checkSoundFile from "./sounds/drip9.wav";
import flagSoundFile from "./sounds/drip8.wav";
import mineSoundFile from "./sounds/drip4.wav";
import { debounce } from "./utils";


type Sounds = {
  [index: string]: HTMLAudioElement;
};

export class GameSounds {
  soundOn: boolean = true;
  sounds: Sounds = {
    reveal: new Audio(revealSoundFile),
    multiReveal: new Audio(revealSoundFile),
    check: new Audio(checkSoundFile),
    flag: new Audio(flagSoundFile),
    mine: new Audio(mineSoundFile),
    win: new Audio(mineSoundFile),
  };
  play: (name: keyof typeof GameSounds.prototype.sounds) => void;

  constructor() {
    this.play = debounce(this.playSound.bind(this), 100);
  }

  private playSound(name: string) {
    const sound = this.sounds[name];
    if (!this.soundOn || !sound) return;
    sound.currentTime = 0;
    sound.play();
  }
}
