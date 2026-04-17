// localizedRecommendations.js
// Region-aware dietary and lifestyle recommendations for the demo.

const LocalizedRecommendations = (() => {
  const matrix = {
    north: {
      prediabetes: ['Swap white rice for bajra roti or mixed millet khichdi.', 'Prefer grilled paneer, dal, and salad over fried snacks.'],
      cholesterol: ['Use mustard oil or groundnut oil in moderation.', 'Add soluble fiber through oats, chana, and sabzi.'],
      thyroid: ['Use iodized salt consistently and avoid extreme crash diets.']
    },
    south: {
      prediabetes: ['Reduce polished rice portions and add ragi, millets, and vegetables.', 'Prefer sambar, sprouts, and curd-based meals over sweets.'],
      cholesterol: ['Include sesame, lentils, and steamed preparations instead of deep-fried foods.'],
      thyroid: ['Maintain regular protein intake and consistent follow-up labs.']
    },
    east: {
      prediabetes: ['Keep rice portions controlled and add fish, dal, and greens when possible.'],
      cholesterol: ['Use less mustard oil and balance fish-fry meals with steamed items.'],
      thyroid: ['Check iodine intake and avoid skipping meals during busy days.']
    },
    west: {
      prediabetes: ['Limit farsan, bakery snacks, and sugar-heavy chai accompaniments.', 'Use jowar/bajra with dal and vegetables.'],
      cholesterol: ['Reduce fried snacks and choose roasted chana, fruits, and sprouts.'],
      thyroid: ['Ensure adequate sleep and regular follow-up blood work.']
    },
    urban: {
      prediabetes: ['Use a post-meal 10-15 minute walk after lunch and dinner.', 'Batch-prep meals to reduce reliance on takeout and bakery foods.'],
      cholesterol: ['Target 150 minutes/week of brisk walking or cycling.', 'Swap late-night snacking for protein + fiber options.'],
      thyroid: ['Keep medication and lab review reminders consistent if thyroid treatment is already in place.']
    }
  };

  function getLocalizedRecommendations(region = 'urban', condition = 'prediabetes') {
    const r = String(region || 'urban').toLowerCase();
    const c = String(condition || 'prediabetes').toLowerCase();
    const bucket = matrix[r] || matrix.urban;
    return bucket[c] || bucket.prediabetes;
  }

  return { getLocalizedRecommendations };
})();

export default LocalizedRecommendations;
