import timeout from "../../assets/sounds/blast_timeout_music.mp3";
import countdown from "../../assets/sounds/countdown.mp3";
import success1 from "../../assets/sounds/success1.mp3";
import success2 from "../../assets/sounds/success2.mp3";
import victory1 from "../../assets/sounds/victory1.mp3";
import victory2 from "../../assets/sounds/victory2.mp3";
import victory3 from "../../assets/sounds/victory3.mp3";
import failure1 from "../../assets/sounds/failure1.mp3";
import failure2 from "../../assets/sounds/failure2.mp3";
import next from "../../assets/sounds/next.mp3";

const soundMap = {
  next: next,
  timeout: timeout,
  countdown: countdown,
  success: {
    0: success1,
    1: success2,
    2: success1,
    3: success1,
    4: success1,
  },
  victory: {
    0: victory1,
    1: victory2,
    2: victory3,
  },
  failure: {
    0: failure1,
    1: failure2,
    2: failure1,
    3: failure1,
    4: failure1,
  },
};

export const getSound = (name, variant) => {
  if (variant) {
    return soundMap[name][variant] || "no sound found!";
  }

  const o = soundMap[name];

  if (typeof o === "string") {
    return o;
  }

  const r = Math.floor(Math.random() * Object.values(o).length);

  return soundMap[name][r] || "no sound found!";
};
