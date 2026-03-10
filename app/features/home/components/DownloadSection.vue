<template>
  <section id="app" class="download-stitch landing-section">
    <div class="container">
      <div class="download-stitch__card">
        <div class="row g-5 align-items-center">
          <!-- Left: Content -->
          <div class="col-12 col-lg-6 text-center text-lg-start position-relative" style="z-index: 1;">
            <h2 class="download-stitch__title">Lista para ser parte de tu familia.</h2>
            <p class="download-stitch__subtitle">
              Unete a los miles de duenos que ya estan transformando el cuidado de sus mascotas.
            </p>
            <div class="download-stitch__badges">
              <a href="#" class="download-stitch__store-link">
                <img
                  alt="Play Store"
                  class="download-stitch__store-img"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAKdMWPN5441MvTyAbUyEWZ490bxKHp2b_Q3eUVHq-Wcsjw3MyY1GY93Xb1bp4bhwUs5tX_U-gCVE9p8EXzmjlXE1Aj8f4cxXfw9AlFSbQnckubxMvaTp4QpBv_L2S3C0Zh5pG-crD4vmMhAaW0p3kUe7hXki1w-E01j7np-9KPE7rYIcUKPCo6mSvtM65MFXsFG-aFnR_RdkuScIH7C0Oi6XZyX_gT39BuWt-SjRF4Av_npS_92wb8CcoQ_GHq4CrmEqbkjvhzWbph"
                />
              </a>
              <a href="#" class="download-stitch__store-link">
                <img
                  alt="App Store"
                  class="download-stitch__store-img"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuApR_zf0JZIvIsC8weJQq8y-kNHi8s9tckEWEskuRKRTZaCGDCTh-VjTOgZf-Lu6TurV3SJfhQumYZz5bTV32Xtv1QJCDQN6GSagAH_OpOu0F5XzIxogt73yOqqqG_pNekSPumqN0RueM_fgObGGgU0j-Ric7UMTp8dnGhtqdXMezl1dHK5MTEewlUKwi7z1cOYJt75h_szDvk_p1ZjBYCiFL00FrPr_MgcTnRnvlzVxwUJWS2jbCb792U0TyRfBAPGlh1F67EDLbs6"
                />
              </a>
            </div>
          </div>

          <!-- Right: Phone mockup -->
          <div class="col-12 col-lg-6 d-none d-lg-flex justify-content-center position-relative" style="z-index: 1;">
            <img
              alt="App Preview"
              class="download-stitch__phone"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuA_vUKZ3VH55vCJqEk6cQ84HNQGKkwcC2GtmF3ogN_GydtsXLafcFkQcENg6mtWAyX0ylU102Z6avIUuW4jW-WALIMxD8a1TwWXPuJx3UI3FIWSXH01REPYT0SrVGg3bqyasRuyVi3XWcn0c48CxQsV6DVnxKOhayiRYYr6Z-Kb2805DVk5e9mrTrUU1p-C721mNaJyRnzP0lGUdrbSbJhnaFuIAuSK2nFE--4UO44ANAAnNlLLwe8kseWgDxZmrOdrh7SHe6PWSLby"
            />
          </div>
        </div>

        <!-- Decorative -->
        <div class="download-stitch__deco" aria-hidden="true" />
        <div class="download-stitch__paw" aria-hidden="true">🐾</div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.download-stitch {
  background: #fff;
}

.download-stitch__card {
  background: #111827;
  border-radius: 3rem;
  padding: 3rem 2rem;
  overflow: hidden;
  position: relative;
}

@media (min-width: 992px) {
  .download-stitch__card {
    padding: 4rem 5rem;
  }
}

.download-stitch__title {
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 700;
  color: #fff;
  margin-bottom: 1rem;
  line-height: 1.15;
}

.download-stitch__subtitle {
  font-size: 1.0625rem;
  color: #9ca3af;
  line-height: 1.7;
  max-width: 420px;
  margin-bottom: 2rem;
}

@media (max-width: 991.98px) {
  .download-stitch__subtitle {
    margin-inline: auto;
  }
}

.download-stitch__badges {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  justify-content: center;
}

@media (min-width: 992px) {
  .download-stitch__badges {
    justify-content: flex-start;
  }
}

.download-stitch__store-link {
  transition: transform 0.2s ease;
}

.download-stitch__store-link:hover {
  transform: scale(1.05);
}

.download-stitch__store-img {
  height: 3.5rem;
}

.download-stitch__phone {
  max-width: 280px;
  border-radius: 2rem;
  border: 8px solid #374151;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
}

.download-stitch__deco {
  position: absolute;
  bottom: -80px;
  right: -80px;
  width: 384px;
  height: 384px;
  background: rgba(16, 185, 129, 0.2);
  border-radius: 50%;
  filter: blur(60px);
  pointer-events: none;
}

.download-stitch__paw {
  position: absolute;
  top: 2rem;
  right: 4rem;
  font-size: 2rem;
  opacity: 0.1;
  color: #fff;
}
</style>
