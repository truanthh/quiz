import avatar0 from "../../assets/avatars/0.png";
import avatar1 from "../../assets/avatars/1.png";
import avatar2 from "../../assets/avatars/2.png";
import avatar3 from "../../assets/avatars/3.png";
import avatar4 from "../../assets/avatars/4.png";
import avatar5 from "../../assets/avatars/5.png";
import avatar6 from "../../assets/avatars/6.png";
import avatar7 from "../../assets/avatars/7.png";
import avatar8 from "../../assets/avatars/8.png";
import dog1 from "../../assets/gifs/dog1.gif";

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
};

export const gifMap = {
  dog1: dog1,
};

export const getAvatar = (id) => {
  return avatarMap[id] || avatarMap[0];
};

export const getGif = (name) => {
  if (!name) {
    return gifMap.dog1;
  }

  return gifMap[name];
};
