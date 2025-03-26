import Vue from 'vue';
import VueRouter from 'vue-router';
import Login from './view/LoginPage.vue';
import FoodRecipes from './view/FoodRecipe.vue';
import SavedRecipes from './view/savedRecipe.vue';
import AddRecipe from './view/AddRecipe.vue';

Vue.use(VueRouter);

const routes = [
  { path: '/', redirect: '/recipes' },
  { path: '/login', component: Login },
  { path: '/recipes', component: FoodRecipes },
  { path: '/saved', component: SavedRecipes },
  {path: '/addrecipe', component: AddRecipe}
];

const router = new VueRouter({
  mode: 'history',
  routes
});

export default router;