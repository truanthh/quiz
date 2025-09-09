<script setup></script>
<template>
  <div class="login">
    <h1>PLAYER PAGE</h1>
    <button class="playerButton__big">CLICK!</button>
  </div>
</template>
<style>
.playerButton__big {
  /* Размеры */
  width: 120px; /* ~3 см на Retina экранах */
  height: 120px;
  min-width: 120px;
  min-height: 120px;

  /* Позиционирование */
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);

  /* Внешний вид */
  background: linear-gradient(145deg, #667eea, #764ba2);
  border: none;
  border-radius: 25px;
  box-shadow:
    0 12px 24px rgba(0, 0, 0, 0.2),
    0 6px 12px rgba(0, 0, 0, 0.15),
    inset 0 2px 4px rgba(255, 255, 255, 0.3);

  /* Текст */
  color: white;
  font-size: 18px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;

  /* Анимации */
  transition: all 0.3s ease;
  cursor: pointer;

  /* Для мобильных */
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}

/* Эффекты при наведении/касании */
.playerButton__big:hover {
  transform: translate(-50%, -50%) scale(1.05);
  box-shadow:
    0 16px 32px rgba(0, 0, 0, 0.25),
    0 8px 16px rgba(0, 0, 0, 0.2),
    inset 0 2px 4px rgba(255, 255, 255, 0.4);
}

.playerButton__big:active {
  transform: translate(-50%, -50%) scale(0.95);
  box-shadow:
    0 8px 16px rgba(0, 0, 0, 0.15),
    0 4px 8px rgba(0, 0, 0, 0.1),
    inset 0 2px 4px rgba(0, 0, 0, 0.2);
}

/* Анимация пульсации для привлечения внимания */
@keyframes pulse {
  0% {
    transform: translate(-50%, -50%) scale(1);
  }
  50% {
    transform: translate(-50%, -50%) scale(1.1);
  }
  100% {
    transform: translate(-50%, -50%) scale(1);
  }
}

.playerButton__big.pulse {
  animation: pulse 2s infinite;
}

/* Адаптивность для разных экранов */
@media (max-width: 480px) {
  .playerButton__big {
    width: 100px;
    height: 100px;
    min-width: 100px;
    min-height: 100px;
    font-size: 16px;
    border-radius: 20px;
  }
}

/* Для очень маленьких экранов */
@media (max-width: 320px) {
  .playerButton__big {
    width: 90px;
    height: 90px;
    min-width: 90px;
    min-height: 90px;
    font-size: 14px;
  }
}
</style>
