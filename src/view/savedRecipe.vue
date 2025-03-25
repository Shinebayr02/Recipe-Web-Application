<template>
  <div>
    <Navbar :user="user" />
    
    <div class="container">
      <h1>Saved Recipes</h1>
      <div v-if="savedRecipes.length > 0" class="recipe-grid">
        <div 
          v-for="recipe in savedRecipes" 
          :key="recipe.id" 
          class="recipe-card"
          @click="openModal(recipe)"
        >
          <img :src="recipe.image" :alt="recipe.title">
          <h3>{{ recipe.title }}</h3>
          <p>{{ recipe.description.substring(0, 100) }}...</p>
        </div>
      </div>
      <p v-else>No saved recipes yet!</p>
    </div>

    <!-- Recipe Modal -->
    <div v-if="selectedRecipe" class="modal">
      <div class="modal-content">
        <span class="close" @click="selectedRecipe = null">&times;</span>
        <img :src="selectedRecipe.image" :alt="selectedRecipe.title">
        <h2>{{ selectedRecipe.title }}</h2>
        <p>{{ selectedRecipe.description }}</p>
        <button @click="removeRecipe(selectedRecipe)">Remove</button>
      </div>
    </div>
  </div>
</template>

<script>
import { auth } from '../firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { getFirestore, doc, setDoc, arrayRemove } from 'firebase/firestore'
import Navbar from '../NavBar.vue'

export default {
  components: { Navbar },
  data() {
    return {
      user: null,
      selectedRecipe: null,
      savedRecipes: []
    }
  },
  created() {
    onAuthStateChanged(auth, async (user) => {
      this.user = user
      await this.loadSavedRecipes()
    })
  },
  methods: {
    async loadSavedRecipes() {
      if (this.user) {
        // Load from Firestore
        // Implement this
      } else {
        this.savedRecipes = JSON.parse(localStorage.getItem('savedRecipes') || [])
      }
    },
    openModal(recipe) {
      this.selectedRecipe = recipe
    },
    async removeRecipe(recipe) {
      if (this.user) {
        const db = getFirestore()
        await setDoc(doc(db, 'users', this.user.uid), {
          savedRecipes: arrayRemove(recipe)
        }, { merge: true })
      } else {
        localStorage.setItem('savedRecipes', 
          JSON.stringify(this.savedRecipes.filter(r => r.id !== recipe.id)))
      }
      await this.loadSavedRecipes()
      this.selectedRecipe = null
    }
  }
}
</script>
<style scoped>
.container {
  padding: 20px;
  margin-left: 70px; /* Account for sidebar */
}

h1 {
  color: #2c3e50;
  margin-bottom: 30px;
  text-align: center;
  font-size: 2.2rem;
}

/* Empty State */
p {
  text-align: center;
  color: #7f8c8d;
  font-size: 1.1rem;
  margin-top: 40px;
}

/* Recipe Grid - Same as FoodRecipe */
.recipe-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 25px;
  padding: 10px;
}

.recipe-card {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 3px 10px rgba(0,0,0,0.1);
  transition: all 0.3s ease;
  cursor: pointer;
}

.recipe-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0,0,0,0.2);
}

.recipe-card img {
  width: 100%;
  height: 200px;
  object-fit: cover;
}

.recipe-card h3 {
  padding: 15px 15px 5px;
  color: #2c3e50;
  font-size: 1.2rem;
}

.recipe-card p {
  padding: 0 15px 15px;
  color: #7f8c8d;
  line-height: 1.4;
}

/* Modal - Same as FoodRecipe with different button */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  padding: 20px;
  position: relative;
}

.close {
  position: absolute;
  top: 15px;
  right: 15px;
  font-size: 24px;
  cursor: pointer;
  color: #7f8c8d;
}

.modal-content img {
  width: 100%;
  max-height: 300px;
  object-fit: cover;
  border-radius: 4px;
  margin-bottom: 20px;
}

.modal-content h2 {
  color: #2c3e50;
  margin-bottom: 10px;
}

.modal-content p {
  color: #34495e;
  line-height: 1.6;
  margin-bottom: 20px;
}

.modal-content button {
  background: #e74c3c;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  transition: background 0.3s ease;
}

.modal-content button:hover {
  background: #c0392b;
}
</style>