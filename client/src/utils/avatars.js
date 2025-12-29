import avatar0 from "../../assets/avatars/0.png";
import avatar1 from "../../assets/avatars/1.png";
import avatar2 from "../../assets/avatars/2.png";
import avatar3 from "../../assets/avatars/3.png";
import avatar4 from "../../assets/avatars/4.png";
import avatar5 from "../../assets/avatars/5.png";
import avatar6 from "../../assets/avatars/6.png";
import avatar7 from "../../assets/avatars/7.png";
import avatar8 from "../../assets/avatars/8.png";
import avatar9 from "../../assets/avatars/9.png";
import avatar10 from "../../assets/avatars/10.png";
import avatar11 from "../../assets/avatars/11.png";
import avatar12 from "../../assets/avatars/12.png";
import avatar13 from "../../assets/avatars/13.png";
import avatar14 from "../../assets/avatars/14.png";
import avatar15 from "../../assets/avatars/15.png";
import avatar16 from "../../assets/avatars/16.png";
import avatar17 from "../../assets/avatars/17.png";
import avatar18 from "../../assets/avatars/18.png";
import avatar19 from "../../assets/avatars/19.png";
import gif1 from "../../assets/gifs/gif1.gif";
import gif2 from "../../assets/gifs/gif2.webp";
import gif3 from "../../assets/gifs/gif3.webp";
import gif4 from "../../assets/gifs/gif4.gif";
import gif5 from "../../assets/gifs/gif5.gif";
import gif6 from "../../assets/gifs/gif6.webp";
import gif7 from "../../assets/gifs/gif7.gif";
import gif8 from "../../assets/gifs/gif8.gif";
import gif9 from "../../assets/gifs/gif9.gif";
import gif10 from "../../assets/gifs/gif10.gif";
import gif11 from "../../assets/gifs/gif11.gif";
import gif12 from "../../assets/gifs/gif12.gif";

export const avatarMap = {
  0: avatar0,
  1: avatar1,
  2: avatar2,
  3: avatar3,
  4: avatar4,
  5: avatar5,
  6: avatar6,
  7: avatar7,
  8: avatar8,
  9: avatar9,
  10: avatar10,
  11: avatar11,
  12: avatar12,
  13: avatar13,
  14: avatar14,
  15: avatar15,
  16: avatar16,
  17: avatar17,
  18: avatar18,
  19: avatar19,
};

export const gifMap = {
  0: gif1,
  1: gif1,
  2: gif2,
  3: gif3,
  4: gif4,
  5: gif5,
  6: gif6,
  7: gif7,
  8: gif8,
  9: gif9,
  10: gif10,
  11: gif11,
  12: gif12,
};

export const getAvatar = (id) => {
  return avatarMap[id] || avatarMap[0];
};

export const getGif = (id) => {
  const r = Math.floor(Math.random() * Object.values(gifMap).length);
  return gifMap[id] || gifMap[r];
};
