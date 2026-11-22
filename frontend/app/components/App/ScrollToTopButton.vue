<script setup lang="ts">
import { ArrowUp } from 'lucide-vue-next';
import { ref, onMounted, onUnmounted } from 'vue';

const isVisible = ref(false);

const handleScroll = () => {
  const scrollPosition = window.scrollY || document.documentElement.scrollTop;
  isVisible.value = scrollPosition > 500;
};

onMounted(() => {
  window.addEventListener('scroll', handleScroll);
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
});
</script>

<template>
  <!-- Not on phones: it covered text there, and phones already scroll to the top natively
       (tap the status bar / the browser's own button). -->
  <div
    v-if="isVisible"
    class="fixed z-999 right-8 md:right-13 cursor-pointer bottom-10 md:bottom-30 size-14 aspect-square rounded-full max-md:hidden flex items-center justify-center p-4 bg-card shadow-lg transition-opacity duration-300"
    @click="useScrollToTop"
  >
    <ArrowUp :size="26" />
  </div>
</template>