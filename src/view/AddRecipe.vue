<template>
  <div>
    <Navbar :user="user" />
    <div class="add-recipe-container">
      
      <div v-if="!user" class="login-prompt">
        <h2>🍳 Recipe Sharing Requires Login</h2>
        <p>Please sign in to share your culinary creations with the community</p>
        <router-link to="/login" class="login-link">
          <button class="login-btn">Sign In / Register</button>
        </router-link>
      </div>

      <!-- Recipe Form -->
      <div v-else class="form-wrapper">
        <h1 class="form-title">{{ isEditing ? 'Edit Recipe' : 'Share Your Recipe' }}</h1>
        <form @submit.prevent="submitRecipe" class="recipe-form">
          <div class="form-columns">
            <div class="image-upload-section">
              <div class="drop-zone" 
                   @dragover.prevent="dragOver = true"
                   @dragleave="dragOver = false"
                   @drop="onDrop"
                   :class="{ 'dragover': dragOver }">
                <input type="file" 
                       id="image-upload"
                       accept="image/*"
                       @change="handleFileSelect"
                       hidden>
                <label for="image-upload" class="upload-label">
                  <div v-if="!imagePreview" class="upload-content">
                    <i class="fas fa-cloud-upload-alt"></i>
                    <p>Drag & drop or click to upload</p>
                    <small>Supported formats: JPG, PNG, WEBP (max 2MB)</small>
                  </div>
                  <img v-else :src="imagePreview" class="preview-image" alt="Preview">
                </label>
              </div>
              <div v-if="uploadError" class="error-message">{{ uploadError }}</div>
            </div>

            <!-- Recipe Form Fields -->
            <div class="form-fields">
              <div class="form-group">
                <label for="title">category</label>
                <input type="text" 
                      id="category" 
                      v-model="recipe.category" 
                      placeholder="e.g., Mexican, Dessert, Breakfast"
                      required>
              </div>
              <div class="form-group">
                <label for="title">Recipe Title</label>
                <input type="text" 
                       id="title" 
                       v-model="recipe.title" 
                       placeholder="e.g., Grandma's Apple Pie"
                       required>
              </div>
              <div class="form-group">
                <label for="ingredients">Ingredients</label>
                <textarea id="ingredients" 
                          v-model="recipe.ingredients"
                          placeholder="List each ingredient on a new line"
                          rows="6"
                          required></textarea>
              </div>
              <div class="form-group">
                <label for="instructions">Cooking Instructions</label>
                <textarea id="instructions" 
                          v-model="recipe.instructions"
                          placeholder="Detailed step-by-step instructions"
                          rows="8"
                          required></textarea>
              </div>
            </div>
          </div>
          
          <!-- Submission Controls -->
          <div class="form-actions">
            <button v-if="isEditing" 
                    type="button" 
                    class="delete-btn"
                    @click="confirmDelete"
                    :disabled="isSubmitting">
              Delete Recipe
            </button>
            <button type="submit" 
                    class="submit-btn"
                    :disabled="isSubmitting">
              <span v-if="!isSubmitting">{{ isEditing ? 'Update Recipe' : 'Publish Recipe' }}</span>
              <div v-else class="loading-spinner"></div>
            </button>
          </div>
        </form>
      </div>

      <!-- User Recipes Section -->
      <div v-if="user" class="user-recipes-section">
        <h2 class="section-title">Your Recipes</h2>
        <div v-if="userRecipes.length === 0" class="empty-state">
          <p>You haven't shared any recipes yet. Create your first recipe above!</p>
        </div>
        <div v-else class="recipe-grid">
          <div v-for="recipe in userRecipes" :key="recipe.id" class="recipe-card">
            <div class="recipe-image-container">
              <img :src="recipe.imageUrl" :alt="recipe.title" class="recipe-image">
              <div class="recipe-actions">
                <button @click="editRecipe(recipe)" class="action-btn edit-btn">
                  <i class="fas fa-edit"></i>
                </button>
                <button @click="confirmDelete(recipe.id)" class="action-btn delete-btn">
                  <i class="fas fa-trash-alt"></i>
                </button>
              </div>
            </div>
            <div class="recipe-content">
              <h3 class="recipe-title">{{ recipe.title }}</h3>
              <div class="recipe-meta">
                <span class="created-date">
                  <i class="far fa-calendar-alt"></i> 
                  {{ formatDate(recipe.createdAt) }}
                </span>
              </div>
              <p class="recipe-description">{{ recipe.ingredients.substring(0, 100) }}...</p>
              <router-link :to="`/recipe/${recipe.id}`" class="view-recipe-btn">
                View Recipe
              </router-link>
            </div>
          </div>
        </div>
      </div>

      <!-- Toast Notification -->
      <div v-if="toast.show" class="toast" :class="toast.type">
        {{ toast.message }}
      </div>

      <!-- Delete Confirmation Modal -->
      <div v-if="showDeleteModal" class="modal-overlay">
        <div class="modal-content">
          <h3>Confirm Deletion</h3>
          <p>Are you sure you want to delete this recipe? This action cannot be undone.</p>
          <div class="modal-actions">
            <button @click="showDeleteModal = false" class="cancel-btn">Cancel</button>
            <button @click="deleteRecipe" class="confirm-delete-btn">Delete</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { auth, db } from '@/firebase';
import { 
  getDocs, 
  query, 
  collection, 
  addDoc, 
  doc, 
  updateDoc, 
  deleteDoc,
  where,
  serverTimestamp 
} from 'firebase/firestore';
import axios from 'axios';
import Navbar from '../NavBar.vue';
export default {
  name: 'AddRecipe',
  components: { Navbar },
  data() {
    return {
      user: null,
      recipe: {
        title: '',
        ingredients: '',
        instructions: '',
        imageUrl: '',
        category:'',
      },
      selectedFile: null,
      imagePreview: null,
      uploadError: '',
      dragOver: false,
      isEditing: false,
      currentRecipeId: null,
      isSubmitting: false,
      toast: {
        show: false,
        message: '',
        type: 'success'
      },
      userRecipes: [],
      showDeleteModal: false,
      recipeToDelete: null
    };
  },
  created() {
    auth.onAuthStateChanged(user => {
      this.user = user;
      if (user) {
        this.fetchUserRecipes();
      }
    });
  },
  methods: {
    async fetchUserRecipes() {
  if (!this.user) return;
  
  try {
    // Simple query - no sorting, no index needed
    const recipesQuery = query(
      collection(db, 'recipes'),
      where('userId', '==', this.user.uid)
    );
    
    const querySnapshot = await getDocs(recipesQuery);

    // Sort manually in JavaScript
    this.userRecipes = querySnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      .sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds);
      
  } catch (error) {
    console.error('Error fetching recipes:', error);
    this.showToast('Failed to fetch recipes', 'error');
  }
},
    handleFileSelect(event) {
      const file = event.target.files[0];
      this.validateAndPreviewImage(file);
    },
    
    onDrop(event) {
      event.preventDefault();
      this.dragOver = false;
      const file = event.dataTransfer.files[0];
      this.validateAndPreviewImage(file);
    },
    
    validateAndPreviewImage(file) {
      if (!file) return;
      
      const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
      const maxSize = 2 * 1024 * 1024; // 2MB
      
      if (!validTypes.includes(file.type)) {
        this.uploadError = 'Invalid file type. Please upload JPG, PNG, or WEBP.';
        return;
      }
      
      if (file.size > maxSize) {
        this.uploadError = 'File size exceeds 2MB limit.';
        return;
      }
      
      this.selectedFile = file;
      this.uploadError = '';
      const reader = new FileReader();
      reader.onload = e => (this.imagePreview = e.target.result);
      reader.readAsDataURL(file);
    },

   

    // Image upload method
    async uploadImageToImageBB() {
      const formData = new FormData();
      formData.append('image', this.selectedFile);
      formData.append('key', 'a7bdc197854de4411ea1939eeb9be07f'); 
      
      try {
        const response = await axios.post('https://api.imgbb.com/1/upload', formData);
        return response.data.data.url;
      } catch (error) {
        console.error('Image upload failed:', error);
        throw new Error('Failed to upload image. Please try again.');
      }
    },

    // Recipe submission (create or update)
    async submitRecipe() {
      if (!this.user) return;
      
      try {
        this.isSubmitting = true;
        
        // Upload image if new file selected
        if (this.selectedFile) {
          this.recipe.imageUrl = await this.uploadImageToImageBB();
        }
        
        // Prepare recipe data
        const recipeData = {
          ...this.recipe,
          userId: this.user.uid,
          author: this.user.displayName || this.user.email,
          updatedAt: serverTimestamp(),
        };

        if (this.isEditing) {
          // Update existing recipe
          await updateDoc(doc(db, 'recipes', this.currentRecipeId), recipeData);
          this.showToast('Recipe updated successfully!', 'success');
        } else {
          // Create new recipe
          recipeData.createdAt = serverTimestamp();
          recipeData.likes = [];
          recipeData.views = 0;
          await addDoc(collection(db, 'recipes'), recipeData);
          this.showToast('Recipe published successfully!', 'success');
        }
        
        // Refresh the user's recipes list
        await this.fetchUserRecipes();
        this.resetForm();
      } catch (error) {
        console.error('Error submitting recipe:', error);
        this.showToast(error.message || 'Failed to save recipe', 'error');
      } finally {
        this.isSubmitting = false;
      }
    },

    // Edit recipe
    editRecipe(recipe) {
      this.recipe = {
        title: recipe.title,
        ingredients: recipe.ingredients,
        instructions: recipe.instructions,
        imageUrl: recipe.imageUrl
      };
      this.imagePreview = recipe.imageUrl;
      this.currentRecipeId = recipe.id;
      this.isEditing = true;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    // Delete recipe confirmation
    confirmDelete(recipeId) {
      this.recipeToDelete = recipeId;
      this.showDeleteModal = true;
    },

    // Delete recipe
    async deleteRecipe() {
      try {
        await deleteDoc(doc(db, 'recipes', this.recipeToDelete));
        this.showToast('Recipe deleted successfully', 'success');
        await this.fetchUserRecipes();
      } catch (error) {
        console.error('Error deleting recipe:', error);
        this.showToast('Failed to delete recipe', 'error');
      } finally {
        this.showDeleteModal = false;
        this.recipeToDelete = null;
        if (this.isEditing && this.currentRecipeId === this.recipeToDelete) {
          this.resetForm();
        }
      }
    },

    // Format date for display
    formatDate(timestamp) {
      if (!timestamp) return '';
      const date = timestamp.toDate();
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    },

    // Utility methods
    resetForm() {
      this.recipe = {
        title: '',
        ingredients: '',
        instructions: '',
        imageUrl: ''
      };
      this.selectedFile = null;
      this.imagePreview = null;
      this.uploadError = '';
      this.isEditing = false;
      this.currentRecipeId = null;
    },
    
    showToast(message, type = 'success') {
      this.toast = { show: true, message, type };
      setTimeout(() => {
        this.toast.show = false;
      }, 3000);
    }
  }
};
</script>

<style scoped>
.add-recipe-container {
  padding: 2rem;
  min-height: calc(100vh - 80px);
  background: #f8f9fa;
}

.login-prompt {
  text-align: center;
  max-width: 600px;
  margin: 4rem auto;
  padding: 3rem;
  background: white;
  border-radius: 1rem;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
}

.login-prompt h2 {
  color: #2c3e50;
  margin-bottom: 1rem;
  font-size: 2rem;
}

.login-prompt p {
  color: #6c757d;
  margin-bottom: 2rem;
}

.login-btn {
  background: #28a745;
  color: white;
  padding: 1rem 2.5rem;
  border: none;
  border-radius: 50px;
  font-size: 1.1rem;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.login-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
}

.form-wrapper {
  background: white;
  border-radius: 1rem;
  padding: 2.5rem;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
  max-width: 1200px;
  margin: 2rem auto;
}

.form-title {
  text-align: center;
  color: #2c3e50;
  margin-bottom: 2.5rem;
  font-size: 2.2rem;
  font-weight: 600;
}

.form-columns {
  display: grid;
  grid-template-columns: 350px 1fr;
  gap: 2.5rem;
  margin-bottom: 2rem;
}

.drop-zone {
  border: 2px dashed #dee2e6;
  border-radius: 1rem;
  height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  background: #f8f9fa;
  position: relative;
  overflow: hidden;
}

.dragover {
  border-color: #28a745;
  background: rgba(40, 167, 69, 0.05);
}

.upload-label {
  cursor: pointer;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-content {
  text-align: center;
  padding: 2rem;
}

.upload-content i {
  font-size: 3.5rem;
  color: #adb5bd;
  margin-bottom: 1.5rem;
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 0.8rem;
}

.form-fields {
  display: flex;
  flex-direction: column;
  gap: 1.8rem;
}

.form-group label {
  font-weight: 600;
  color: #495057;
  margin-bottom: 0.5rem;
  display: block;
}

input, textarea {
  width: 100%;
  padding: 1rem;
  border: 2px solid #e9ecef;
  border-radius: 0.8rem;
  font-size: 1rem;
  transition: border-color 0.3s ease;
}

input:focus, textarea:focus {
  border-color: #28a745;
  box-shadow: 0 0 0 3px rgba(40, 167, 69, 0.2);
  outline: none;
}

textarea {
  min-height: 150px;
  resize: vertical;
}

.form-actions {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
}

.submit-btn {
  background: #28a745;
  color: white;
  padding: 1.2rem;
  flex: 1;
  border: none;
  border-radius: 0.8rem;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.3s, transform 0.2s;
}

.submit-btn:hover:not(:disabled) {
  background: #218838;
  transform: translateY(-2px);
}

.submit-btn:disabled {
  background: #94d3a2;
  cursor: not-allowed;
}

.delete-btn {
  background: #dc3545;
  color: white;
  padding: 1.2rem;
  border: none;
  border-radius: 0.8rem;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.3s, transform 0.2s;
}

.delete-btn:hover:not(:disabled) {
  background: #c82333;
  transform: translateY(-2px);
}

.delete-btn:disabled {
  background: #e99ca6;
  cursor: not-allowed;
}

.loading-spinner {
  width: 26px;
  height: 26px;
  border: 3px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.toast {
  position: fixed;
  bottom: 30px;
  right: 30px;
  padding: 1rem 2rem;
  border-radius: 0.8rem;
  color: white;
  font-weight: 500;
  box-shadow: 0 4px 15px rgba(0,0,0,0.15);
  z-index: 1000;
}

.toast.success {
  background: #28a745;
}

.toast.error {
  background: #dc3545;
}

.error-message {
  color: #dc3545;
  margin-top: 1rem;
  font-size: 0.95rem;
  text-align: center;
}

/* User Recipes Section */
.user-recipes-section {
  max-width: 1200px;
  margin: 4rem auto;
}

.section-title {
  color: #2c3e50;
  margin-bottom: 2rem;
  font-size: 1.8rem;
  text-align: center;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  background: white;
  border-radius: 1rem;
  box-shadow: 0 4px 15px rgba(0,0,0,0.05);
}

.recipe-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
}

.recipe-card {
  background: white;
  border-radius: 1rem;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0,0,0,0.08);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.recipe-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 6px 20px rgba(0,0,0,0.12);
}

.recipe-image-container {
  position: relative;
  height: 200px;
  overflow: hidden;
}

.recipe-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.recipe-card:hover .recipe-image {
  transform: scale(1.05);
}

.recipe-actions {
  position: absolute;
  top: 1rem;
  right: 1rem;
  display: flex;
  gap: 0.5rem;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.recipe-card:hover .recipe-actions {
  opacity: 1;
}

.action-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.edit-btn {
  background: rgba(40, 167, 69, 0.9);
  color: white;
}

.edit-btn:hover {
  background: #28a745;
  transform: scale(1.1);
}

.delete-btn {
  background: rgba(220, 53, 69, 0.9);
  color: white;
}

.delete-btn:hover {
  background: #dc3545;
  transform: scale(1.1);
}

.recipe-content {
  padding: 1.5rem;
}

.recipe-title {
  color: #2c3e50;
  margin-bottom: 0.5rem;
  font-size: 1.2rem;
}

.recipe-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
  font-size: 0.85rem;
  color: #6c757d;
}

.recipe-meta i {
  margin-right: 0.3rem;
}

.recipe-description {
  color: #495057;
  margin-bottom: 1.5rem;
  font-size: 0.95rem;
  line-height: 1.5;
}

.view-recipe-btn {
  display: inline-block;
  padding: 0.6rem 1.2rem;
  background: #f8f9fa;
  color: #28a745;
  border-radius: 50px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.3s ease;
}

.view-recipe-btn:hover {
  background: #28a745;
  color: white;
}

/* Delete Confirmation Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.modal-content {
  background: white;
  padding: 2rem;
  border-radius: 1rem;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
}

.modal-content h3 {
  color: #2c3e50;
  margin-bottom: 1rem;
}

.modal-content p {
  color: #6c757d;
  margin-bottom: 2rem;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.cancel-btn {
  padding: 0.8rem 1.5rem;
  background: #f8f9fa;
  color: #495057;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: background 0.3s;
}

.cancel-btn:hover {
  background: #e9ecef;
}

.confirm-delete-btn {
  padding: 0.8rem 1.5rem;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: background 0.3s;
}

.confirm-delete-btn:hover {
  background: #c82333;
}

@media (max-width: 768px) {
  .form-columns {
    grid-template-columns: 1fr;
  }

  .drop-zone {
    height: 300px;
  }

  .form-wrapper {
    padding: 1.5rem;
  }

  .form-title {
    font-size: 1.8rem;
  }

  .recipe-grid {
    grid-template-columns: 1fr;
  }
}
</style>