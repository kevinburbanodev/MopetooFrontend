<template>
  <section class="blog-preview landing-section">
    <div class="container">
      <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-end mb-4 gap-3">
        <div>
          <h2 class="blog-preview__title">Cuidado y Consejos</h2>
          <p class="blog-preview__subtitle">Aprende de la mano de expertos veterinarios.</p>
        </div>
        <NuxtLink to="/blog" class="blog-preview__link">
          Ir al Blog <span aria-hidden="true">&rarr;</span>
        </NuxtLink>
      </div>

      <div class="row g-4">
        <div
          v-for="article in articles"
          :key="article.title"
          class="col-12 col-md-4"
        >
          <article class="blog-preview__card">
            <div class="blog-preview__img-wrap">
              <img
                :alt="article.title"
                :src="article.image"
                class="blog-preview__img"
              />
            </div>
            <span class="blog-preview__category">{{ article.category }}</span>
            <h3 class="blog-preview__card-title">{{ article.title }}</h3>
          </article>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const articles = [
  {
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuArDXaPQoViANIhwr_xsdVxh7fnCSq40NpavOUfUqc3HisXeKfdJ--d8A0Xq4Iq5pxH_wYpJG9lqjbZo4_LMTPt8fG57RDwTEWZHbYs_TfS8RgTUyjgqf1ETf9ZF2l8loM2J0s22JEP-g67FViFzyq-fj3plaaq4FTS_Fle225szhWDPgMs2Nt32oTk51FDFVf7pQkpi053RPXgmGQo1IpvZc81XH7CNRDJ9YhGoZTaenqcFu6mA9MvUVRsVbzRxgZFF_PWgob48ipg',
    category: 'Alimentacion',
    title: 'Mitos y verdades sobre la comida barf en gatos',
  },
  {
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDbHAXl4NVuYT2_-XyMc3Lg_yKz-rQLt0ox9PMqiWTin9Xozs5EFagQXKSDjLzH9pACpr-yfDKQFU5bTOSZHP6xyTeg1fhqcWwEL2CX7O4zbVVoAfAqQujwODamULsjp1G-0T_lqq3Dr21D7LJgzvRkfnnypO9avStoodjQbhuinXOTDz80b0tXO5AQghJ5ToDOQWk2nUgkR_uK4dFTds4DPPq-aYU1fKSBS4GIQV64KPiqOBhnkcLzc2lZVKaxglLVXFnUl2cbp9vW',
    category: 'Comportamiento',
    title: 'Como calmar la ansiedad por separacion',
  },
  {
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDL4uBc7iC6CbLyD5NN8Pxb9mHuDUKCHoA5j1LVjAbf9WLRumg3QdkaG-wn80tclgGgiEsRDWg2MkuKcEE13rYgIFQuj7kTQqtNinzkkct1gM1neqYNv3oP4BEu53M3LlkEuE3gBTj90RWfVbivO4_OnjdJnFELDkSK7xxv7AqRUQHanVinvlsuyCaZumGH2oKN2LfFjNo8xZc0yRihAo2DYAG2uN-YkgyZ9ysx5ze5Ns5GcBuVU7uMsOz5RlglYSz3ByU8TeCIHTee',
    category: 'Salud',
    title: 'Esquema de vacunacion esencial para 2024',
  },
]
</script>

<style scoped>
.blog-preview {
  background: #fff;
}

.blog-preview__title {
  font-size: clamp(1.75rem, 3vw, 2.25rem);
  font-weight: 700;
  color: #111827;
  margin-bottom: 0.25rem;
}

.blog-preview__subtitle {
  color: #6b7280;
  margin: 0;
}

.blog-preview__link {
  color: #10B981;
  font-weight: 700;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  white-space: nowrap;
}

.blog-preview__link:hover {
  text-decoration: underline;
}

.blog-preview__card {
  cursor: pointer;
}

.blog-preview__img-wrap {
  border-radius: 1rem;
  overflow: hidden;
  height: 12rem;
  background: #f3f4f6;
  margin-bottom: 1rem;
}

.blog-preview__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.blog-preview__card:hover .blog-preview__img {
  transform: scale(1.05);
}

.blog-preview__category {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #F97316;
}

.blog-preview__card-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: #111827;
  margin-top: 0.375rem;
  transition: color 0.2s ease;
  line-height: 1.4;
}

.blog-preview__card:hover .blog-preview__card-title {
  color: #10B981;
}
</style>
