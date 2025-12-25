export function convertTime(seconds) {
  let sec = seconds;
  let min = 0;

  if (seconds > 59) {
    min = Math.floor(seconds / 60);
    sec = sec % 60;
  }

  return `${min.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
}

// availableAvatars is a Set
export function generateAvatarNumber(availableAvatars) {
  if (availableAvatars.size === 0) {
    // console.log("no avatars available!");
    return;
  }

  const avatarNumber =
    Array.from(availableAvatars)[
      Math.floor(Math.random() * availableAvatars.size)
    ];

  availableAvatars.delete(avatarNumber);

  return avatarNumber;
}
