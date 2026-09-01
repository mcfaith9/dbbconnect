<script setup lang="ts">
import SignupForm from "@/components/new-york-v4/blocks/signup-03/components/SignupForm.vue"
import type { HTMLAttributes } from "vue"

const props = defineProps<{
  class?: HTMLAttributes["class"]
}>()
</script>

<template>
  <SignupForm :class="props.class" />
</template>
