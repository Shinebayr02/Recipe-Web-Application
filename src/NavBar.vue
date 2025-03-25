<template>
    <div>
      <button class="toggle-btn" @click="isOpen = !isOpen">
        {{ isOpen ? '×' : '☰' }}
      </button>
      
      <div class="sidebar" v-if="isOpen" @mouseleave="handleSidebarLeave">
        <div class="sidebar-content">
          <router-link to="/" class="nav-link">Home</router-link>
          <router-link to="/saved" class="nav-link">Saved Recipes</router-link>
          
          <!-- User Section -->
          <div class="auth-section">
            <div v-if="user" class="user-profile">
              <img :src="user.photoURL || defaultProfilePic" class="profile-pic" />
              <span class="username">{{ user.displayName || user.email }}</span>
              <button class="logout-btn" @click="confirmLogout">Logout</button>
              
              <!-- Overlay and Confirmation Dialog -->
              <div v-if="showLogoutConfirmation" class="overlay" @click="cancelLogout"></div>
              <div v-if="showLogoutConfirmation" class="confirmation-dialog">
                <p>Are you sure you want to logout?</p>
                <div class="dialog-buttons">
                  <button @click="logout" class="confirm-btn">Yes</button>
                  <button @click="cancelLogout" class="cancel-btn">No</button>
                </div>
              </div>
            </div>
            <button v-else class="login-btn" @click="login">Login</button>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import { auth } from './firebase'
  import { signOut } from 'firebase/auth'
  
  export default {
    props: ['user'],
    data() {
      return {
        isOpen: false,
        showLogoutConfirmation: false,
        defaultProfilePic: 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png'
      }
    },
    methods: {
      handleSidebarLeave() {
        if (!this.showLogoutConfirmation) {
          this.isOpen = false
        }
      },
      async logout() {
        try {
          await signOut(auth)
          this.isOpen = false
        } catch (error) {
          console.error(error)
        }
      },
      login() {
        this.$router.push('/login')
        this.isOpen = false
      },
      confirmLogout() {
        this.showLogoutConfirmation = true
      },
      cancelLogout() {
        this.showLogoutConfirmation = false
      }
    }
  }
  </script>
  
  <style scoped>
  /* Toggle Button */
  .toggle-btn {
    z-index: 1000;
    /* rest of your toggle button styles */
  }
  
  /* Sidebar */
  .sidebar {
    z-index: 999;
    /* rest of your sidebar styles */
  }
  
  .overlay {
    z-index: 1001;
    /* rest of overlay styles */
  }
  
  .confirmation-dialog {
    z-index: 1002;
    /* rest of dialog styles */
  }
  /* Toggle Button */
  .toggle-btn {
    position: fixed;
    top: 20px;
    left: 20px;
    font-size: 24px;
    background: #3a3a3a;
    color: white;
    border: none;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    cursor: pointer;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
  }
  
  /* Sidebar */
  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    width: 250px;
    height: 100vh;
    background: #2c3e50;
    z-index: 999;
    padding-top: 60px;
  }
  
  .sidebar-content {
    display: flex;
    flex-direction: column;
    height: 100%;
  }
  
  /* Navigation Links */
  .nav-link {
    color: #ecf0f1;
    padding: 12px 20px;
    text-decoration: none;
    transition: background 0.3s;
  }
  
  .nav-link:hover {
    background: #34495e;
  }
  
  /* Auth Section - Fixed positioning */
  .auth-section {
    margin-top: auto; /* Pushes to bottom */
    padding: 20px;
    border-top: 1px solid #34495e;
  }
  
  .user-profile {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
  }
  
  .profile-pic {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid #3498db;
  }
  
  .username {
    color: white;
    font-size: 14px;
    text-align: center;
    word-break: break-word;
    width: 100%;
  }
  
  /* Auth Buttons */
  .login-btn, .logout-btn {
    width: 100%;
    padding: 10px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: bold;
    transition: background 0.3s;
  }
  
  .login-btn {
    background: #2ecc71;
    color: white;
    margin-bottom: 50px;
  }
  
  .logout-btn {
    background: #e74c3c;
    color: white;
    margin-bottom: 50px;
  }
  
  .login-btn:hover {
    background: #27ae60;
  }
  
  .logout-btn:hover {
    background: #c0392b;
  }
  

.confirmation-dialog p {
  margin-bottom: 20px;
  color: #333;
}

.dialog-buttons {
  display: flex;
  justify-content: center;
  gap: 10px;
}

.confirm-btn, .cancel-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

.confirm-btn {
  background: #e74c3c;
  color: white;
}

.cancel-btn {
  background: #3498db;
  color: white;
}

.confirm-btn:hover {
  background: #c0392b;
}

.cancel-btn:hover {
  background: #2980b9;
}

/* Add overlay when dialog is open */
.sidebar-content::after {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  z-index: 1000;
  display: none;
}

.sidebar-content.show-overlay::after {
  display: block;
}
.overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  z-index: 1000;
}

.confirmation-dialog {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 0 20px rgba(0,0,0,0.2);
  z-index: 1001;
  width: 80%;
  max-width: 300px;
  text-align: center;
}
  </style>