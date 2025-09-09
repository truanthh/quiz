<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const password = ref('')
const error = ref('')

const handleLogin = () => {
  if (password.value === 'player') {
    router.push('/player')
  } else if (password.value === 'screen') {
    router.push('/screen') 
  } else if (password.value === 'admin') {
    router.push('/admin')
  } else {
    error.value = 'Неверный пароль'
  }
}
</script>
<template>
  <div class="login">
    <h1>Подключиться к викторине</h1>
    <input v-model="password" placeholder="Введите пароль" type="password">
    <button @click="handleLogin">Войти</button>
    <p v-if="error" class="error">{{ error }}</p>
  </div>
</template>

