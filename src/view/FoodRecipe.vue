<template>
  <div>
    <Navbar :user="user" />
    
    <div class="container">
      <h1>All Recipes</h1>
      <div class="recipe-grid">
        <div 
          v-for="recipe in recipes" 
          :key="recipe.id" 
          class="recipe-card"
          @click="openModal(recipe)"
        >
          <img :src="recipe.image" :alt="recipe.title">
          <h3>{{ recipe.title }}</h3>
          <p>{{ recipe.description.substring(0, 100) }}...</p>
        </div>
      </div>
    </div>

    <!-- Recipe Modal -->
    <div v-if="selectedRecipe" class="modal">
      <div class="modal-content">
        <span class="close" @click="selectedRecipe = null">&times;</span>
        <img :src="selectedRecipe.image" :alt="selectedRecipe.title">
        <h2>{{ selectedRecipe.title }}</h2>
        <p>{{ selectedRecipe.description }}</p>
        <button @click="saveRecipe(selectedRecipe)">
          {{ isSaved(selectedRecipe.id) ? 'Unsave' : 'Save' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { auth } from '../firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { getFirestore, doc, setDoc, arrayUnion } from 'firebase/firestore'
import Navbar from '../NavBar.vue'

export default {
  components: { Navbar },
  data() {
    return {
      user: null,
      selectedRecipe: null,
      recipes: [
        {
          id: 1,
          title: "Pasta Carbonara",
          description: "Classic Italian pasta with eggs, cheese, pancetta, and pepper.",
          image: "https://static.toiimg.com/thumb/84784534.cms?imgsize=468021&width=800&height=800"
        },
        // More recipes...
      ]
    }
  },
  created() {
    onAuthStateChanged(auth, (user) => {
      this.user = user
    })
  },
  methods: {
    openModal(recipe) {
      this.selectedRecipe = recipe
    },
    isSaved(recipeId) {
      if (this.user) {
        // Check Firestore
        return false // Implement this
      } else {
        const saved = JSON.parse(localStorage.getItem('savedRecipes') || '[]')
        return saved.some(r => r.id === recipeId)
      }
    },
    async saveRecipe(recipe) {
      if (this.user) {
        const db = getFirestore()
        await setDoc(doc(db, 'users', this.user.uid), {
          savedRecipes: arrayUnion(recipe)
        }, { merge: true })
      } else {
        const saved = JSON.parse(localStorage.getItem('savedRecipes') || [])
        if(this.isSaved(recipe.id)) {
          localStorage.setItem('savedRecipes', 
            JSON.stringify(saved.filter(r => r.id !== recipe.id)))
        } else {
          localStorage.setItem('savedRecipes', 
            JSON.stringify([...saved, recipe]))
        }
      }
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

/* Recipe Grid */
.recipe-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 25px;
  padding: 10px;
}

/* Recipe Cards */
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

/* Modal Styles */
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
  background: #3498db;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  transition: background 0.3s ease;
}

.modal-content button:hover {
  background: #2980b9;
}
</style>