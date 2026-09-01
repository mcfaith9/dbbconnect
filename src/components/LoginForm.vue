<script setup lang="ts">
import LoginForm from "@/components/new-york-v4/blocks/login-03/components/LoginForm.vue"
import type { HTMLAttributes } from "vue"

const props = defineProps<{
  class?: HTMLAttributes["class"]
}>()
</script>

<template>
  <LoginForm :class="props.class" />
</template>
