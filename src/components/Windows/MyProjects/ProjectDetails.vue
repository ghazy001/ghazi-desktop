<script setup>
defineProps({ project: { type: Object, required: true } })
</script>
<template>
  <article class="xp-content select-text">
    <h3>{{ project.headline }}</h3>
    <p>{{ project.description }}</p>
    <fieldset class="xp-fieldset">
      <legend>{{ $t('common.techInfo') }}</legend>
      <p>{{ project.technologies.join(' · ') }}</p>
    </fieldset>
    <div class="xp-project-links">
      <span v-for="link in project.links" :key="link.url"
        ><a :href="link.url" target="_blank" rel="noopener noreferrer" class="xp-button" :title="link.availability"
          >{{ link.name }}{{ link.availability ? ' (unavailable)' : '' }}</a
        ></span
      >
    </div>
    <figure v-if="project.video">
      <video controls playsinline preload="none" :poster="project.video.poster" :aria-label="project.caseStudyName + ' product walkthrough'" class="xp-project-media">
        <source :src="project.video.url" type="video/mp4" />
        {{ $t('common.videoNotSupported') }}
      </video>
      <figcaption>{{ project.video.caption }}</figcaption>
      <a :href="project.video.url" target="_blank" rel="noopener noreferrer">Download the demo video</a>
    </figure>
    <figure>
      <a :href="project.image" target="_blank" rel="noopener noreferrer"
        ><img :src="project.image" :alt="project.caseStudyName + ' — ' + project.imageCaption" loading="lazy" class="xp-project-media"
      /></a>
      <figcaption>{{ project.imageCaption }}</figcaption>
    </figure>
    <details v-if="project.gallery.length">
      <summary>Project screenshots ({{ project.gallery.length }})</summary>
      <figure v-for="image in project.gallery" :key="image.url">
        <a :href="image.url" target="_blank" rel="noopener noreferrer"><img :src="image.url" :alt="image.title" loading="lazy" class="xp-project-media" /></a>
        <figcaption>{{ image.title }}. {{ image.caption }}</figcaption>
      </figure>
    </details>
    <section v-for="section in project.sections" :key="section.title">
      <h2>{{ section.title }}</h2>
      <template v-for="(block, index) in section.blocks" :key="index"
        ><h3 v-if="block.type === 'h3'">{{ block.text }}</h3>
        <p v-else :class="{ 'xp-list-item': block.type === 'li' }">{{ block.text }}</p></template
      >
    </section>
    <p><a :href="project.source" target="_blank" rel="noopener noreferrer">Original case study</a></p>
  </article>
</template>
