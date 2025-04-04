<template>
  <div>
    <Navbar :user="user" />
    
    <div class="container">
      <h1>All Recipes</h1>
      
      <div class="search-filter-container">
        <input 
          type="text" 
          v-model="searchQuery" 
          placeholder="Search recipes..." 
          class="search-box"
        />

        <select v-model="selectedCategory" class="filter-dropdown">
          <option value="">All Categories</option>
          <option v-for="category in categories" :key="category" :value="category">
            {{ category }}
          </option>
        </select>
      </div>

      <div class="recipe-grid">
        <div 
          v-for="recipe in filteredRecipes" 
          :key="recipe.id" 
          class="recipe-card"
          @click="openModal(recipe)"
        >
          <img :src="recipe.imageUrl" :alt="recipe.title">
          <h3>{{ recipe.title }}</h3>
          <h3 class="small-title">ingredient</h3>
          <p>{{ recipe.ingredients.substring(0, 100) }}</p>
          <h3 class="small-title" >instructions</h3>
          <p>{{ recipe.instructions.substring(0, 100) }}</p>
        </div>
      </div>
    </div>

    <div v-if="selectedRecipe" class="modal">
      <div class="modal-content">
        <span class="close" @click="selectedRecipe = null">&times;</span>
        <img :src="selectedRecipe.imageUrl" :alt="selectedRecipe.title">
        <h2>{{ selectedRecipe.title }}</h2>
        <h3>Ingredients</h3>
        <p>{{ selectedRecipe.ingredients }}</p>
        <h3>Instructions</h3>
        <p>{{ selectedRecipe.instructions }}</p>
        <button @click="saveRecipe(selectedRecipe)">
          {{ isSaved(selectedRecipe.id) ? 'Unsave' : 'Save' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, getDocs, doc, setDoc, arrayUnion } from 'firebase/firestore';
import Navbar from '../NavBar.vue';

export default {
  components: { Navbar },
  data() {
    
    return {
      user: null,
      selectedRecipe: null,
      searchQuery: "",
      selectedCategory: "",
      recipes: []
    };
  },
  computed: {
    categories() {
      return [...new Set(this.recipes.map(recipe => recipe.category))];

    },
    filteredRecipes() {
      return this.recipes.filter(recipe => {
        const matchesSearch = recipe.title.toLowerCase().includes(this.searchQuery.toLowerCase());
        const matchesCategory = this.selectedCategory ? recipe.category === this.selectedCategory : true;
        return matchesSearch && matchesCategory;
      });
    }
  },
  
  async created() {
    onAuthStateChanged(auth, (user) => {
      this.user = user;
    });
    
    await this.fetchRecipes();
  },
  methods: {
    async fetchRecipes() {
      console.log("User object:", this.user);
      const db = getFirestore();
      const querySnapshot = await getDocs(collection(db, 'recipes'));
      this.recipes = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
    openModal(recipe) {
      this.selectedRecipe = recipe;
    },
    isSaved(recipeId) {
      if (this.user) {
        return false;
      } else {
        const saved = JSON.parse(localStorage.getItem('savedRecipes') || '[]');
        return saved.some(r => r.id === recipeId);
      }
    },
    async saveRecipe(recipe) {
      if (this.user) {
        const db = getFirestore();
        await setDoc(doc(db, 'users', this.user.uid), {
          savedRecipes: arrayUnion(recipe)
        }, { merge: true });
      } else {
        const saved = JSON.parse(localStorage.getItem('savedRecipes') || '[]');
        if (this.isSaved(recipe.id)) {
          localStorage.setItem('savedRecipes', 
            JSON.stringify(saved.filter(r => r.id !== recipe.id)));
        } else {
          localStorage.setItem('savedRecipes', 
            JSON.stringify([...saved, recipe]));
        }
      }
      this.selectedRecipe = null;
    }
  }
};
</script>


<style scoped>
.search-filter-container {
  display: flex;
  gap: 15px;
  margin-bottom: 25px;
}

.search-box {
  flex: 1;
  padding: 12px 20px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 16px;
  transition: all 0.3s ease;
  background: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.search-box:focus {
  outline: none;
  border-color: #4CAF50;
  box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.1);
}

.filter-dropdown {
  flex: 0 0 200px;
  padding: 12px 15px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 16px;
  background: #fff url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e") right 12px center no-repeat;
  background-size: 18px;
  appearance: none;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}



@media (max-width: 768px) {
  .search-filter-container {
    flex-direction: column;
  }
  
  .filter-dropdown {
    flex: 1;
    width: 100%;
  }
}

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
  color: #696e6e;
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
.small-title{
  font-size: 1rem;
  color: #37ce5a;
  margin-bottom: 2rem;
}
</style>