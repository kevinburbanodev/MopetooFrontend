<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
})

const authStore = useAuthStore()
const user = computed(() => authStore.currentUser)

useSeoMeta({
  title: 'Mi perfil — Mopetoo',
  description: 'Consulta y gestiona la información de tu perfil en Mopetoo.',
})
</script>

<template>
  <div class="container py-5">
    <div class="row">
      <div class="col-12 col-md-10 col-lg-8 mx-auto">
        <div class="d-flex align-items-center justify-content-between mb-4">
          <h1 class="h4 fw-bold mb-0">Mi perfil</h1>
          <NuxtLink
            to="/dashboard/profile/edit"
            class="btn btn-outline-primary btn-sm fw-semibold"
          >
            Editar perfil
          </NuxtLink>
        </div>

        <div v-if="user" class="card shadow-sm border-0">
          <div class="card-body p-4">
            <!-- Avatar + name -->
            <div class="d-flex align-items-center gap-4 mb-4">
              <div class="profile-avatar flex-shrink-0">
                <img
                  v-if="user.profile_picture_url"
                  :src="user.profile_picture_url"
                  :alt="`Foto de perfil de ${user.name} ${user.last_name}`"
                  class="profile-avatar__img"
                />
                <span
                  v-else
                  class="profile-avatar__initials"
                  aria-hidden="true"
                >
                  {{ user.name.charAt(0).toUpperCase() }}
                </span>
              </div>
              <div>
                <h2 class="h5 fw-bold mb-0">{{ user.name }} {{ user.last_name }}</h2>
                <p class="text-muted small mb-0">{{ user.email }}</p>
                <span
                  v-if="user.is_pro"
                  class="badge bg-warning text-dark mt-1"
                >
                  PRO
                </span>
              </div>
            </div>

            <!-- Details -->
            <dl class="row g-3 mb-0">
              <div class="col-sm-6">
                <dt class="small text-muted fw-semibold">País</dt>
                <dd class="mb-0">{{ user.country || '—' }}</dd>
              </div>
              <div class="col-sm-6">
                <dt class="small text-muted fw-semibold">Ciudad</dt>
                <dd class="mb-0">{{ user.city || '—' }}</dd>
              </div>
              <div class="col-sm-6">
                <dt class="small text-muted fw-semibold">Teléfono</dt>
                <dd class="mb-0">
                  <template v-if="user.phone">
                    {{ user.phone_country_code }} {{ user.phone }}
                  </template>
                  <template v-else>—</template>
                </dd>
              </div>
              <div class="col-sm-6">
                <dt class="small text-muted fw-semibold">Miembro desde</dt>
                <dd class="mb-0">
                  {{
                    new Date(user.created_at).toLocaleDateString('es', {
                      year: 'numeric',
                      month: 'long',
                    })
                  }}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.profile-avatar {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid var(--bs-border-color);

  &__img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  &__initials {
    display: flex;
    width: 100%;
    height: 100%;
    align-items: center;
    justify-content: center;
    background-color: var(--bs-primary);
    color: #fff;
    font-size: 1.75rem;
    font-weight: 700;
  }
}
</style>
