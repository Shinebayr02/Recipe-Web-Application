<template>
    <div id="app">
      <NavBar />
      <router-view></router-view>
    </div>
  </template>
  
  <script>
  import NavBar from "./NavBar.vue";
  import { auth } from "./firebase";
  
  export default {
    name: "App",
    components: {
      NavBar,
    },
    data() {
      return {
        user: null,
      };
    },
    mounted() {
      auth.onAuthStateChanged((user) => {
        this.user = user;
      });
    },
  };
  </script>