<template>
  <div class="login-container">
    <div v-if="!user" class="login-box">
      <h2 class="login-title">Welcome to Recipe App</h2>
      <p class="login-subtitle">Log in to explore delicious recipes</p>
      <button class="login-button" @click="loginWithFacebook">
        <img src="../assets/facebook-icon.png" alt="Facebook Icon" class="icon" />
        Login with Facebook
      </button>
    </div>
    <div v-else class="logged-in-box">
      <p class="logged-in-text">You are already logged in.</p>
      <button class="logout-button" @click="logout">Logout</button>
    </div>
  </div>
</template>

<script>
import { signInWithPopup, FacebookAuthProvider, signOut } from "firebase/auth";
import { auth } from "../firebase";

export default {
  data() {
    return {
      user: null,
    };
  },
  mounted() {
    auth.onAuthStateChanged((user) => {
      this.user = user;
      if (user && this.$route.path === "/login") {
        this.$router.replace("/recipes");
      }
    });
  },
  methods: {
    async loginWithFacebook() {
      const provider = new FacebookAuthProvider();
      try {
        await signInWithPopup(auth, provider);
        if (this.$route.path !== "/recipes") {
          this.$router.replace("/recipes");
        }
      } catch (error) {
        console.error("Login error:", error);
      }
    },
    async logout() {
      try {
        await signOut(auth);
        this.user = null;
        this.$router.replace("/login");
      } catch (error) {
        console.error("Logout error:", error);
      }
    },
  },
};
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f5f5f5;
}

.login-box {
  background: white;
  padding: 2rem;
  border-radius: 10px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  text-align: center;
  max-width: 400px;
  width: 100%;
}

.login-title {
  font-size: 2rem;
  color: #333333;
  margin-bottom: 0.5rem;
}

.login-subtitle {
  font-size: 1rem;
  color: #666666;
  margin-bottom: 2rem;
}

.login-button {
  display: flex;
  align-items: center;
  margin-left: 85px;
  justify-content: center;
  background-color: #4a90e2;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 5px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s ease;
  
}

.login-button:hover {
  background-color: #357abd;
}

.icon {
  width: 20px;
  height: 20px;
  margin-right: 10px;
}

.logged-in-box {
  background: white;
  padding: 2rem;
  border-radius: 10px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  text-align: center;
  max-width: 400px;
  width: 100%;
}

.logged-in-text {
  font-size: 1.25rem;
  color: #333333;
  margin-bottom: 1.5rem;
}

.logout-button {
  background-color: #ff6f61;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 5px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.logout-button:hover {
  background-color: #e65a50;
}
</style>