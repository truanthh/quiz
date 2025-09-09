<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { io } from "socket.io-client"

const msg = ref('');
// const socket = inject('socket');

const status = ref("Не подключено")
const socket = ref(null)

const connectionInfo = ref(null)

function handleClick(){
  if (socket.value && socket.value.connected) {
    socket.value.emit('send-msg', {
      msg: msg.value,
      timestamp: new Date().toLocaleTimeString()
    })
    console.log('📤 Сообщение отправлено')
  } else {
    console.log('⚠️ Нет подключения к серверу')
  }
  msg.value = "";
}

onMounted(() => {
  socket.value = io('http://192.168.1.75:3000')
  
  socket.value.on('connect', () => {
    status.value = 'Подключено к серверу'
    console.log('✅ Подключено к серверу')
  })

  socket.value.on('disconnect', () => {
    status.value = 'Отключено от сервера'
    console.log('❌ Отключено от сервера')
  })

  socket.value.on('connection-established', (data) => {
    connectionInfo.value = data;
  })
})

onUnmounted(() => {
  if(socket.value){
    socket.value.disconnect()
  }
})
</script>

<template>
  <div class="connectionInfo" v-if="connectionInfo"> {{ connectionInfo.clientId }} </div>
  <h2 v-else> no connection </h2>
  <h1>GUESS THE SONG GAME</h1>
  <input type="text" v-model="msg"> </input>
  <button @click.prevent="handleClick"> click! </button>
</template>

<style scoped>
.app {
  text-align: center;
  padding: 20px;
  font-family: Arial, sans-serif;
}
button {
  padding: 15px 30px;
  font-size: 18px;
  margin: 10px;
  cursor: pointer;
}
.connectionInfo{
  font-size: 16px;
  font-weight: bold;
}
</style>
