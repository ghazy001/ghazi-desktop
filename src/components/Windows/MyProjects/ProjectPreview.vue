<script setup>
import { computed, inject, ref, watch } from 'vue'
import { projectDestinations, projectPreview } from '@/lib/project-presentation.mjs'
const props = defineProps({ project: { type: Object, required: true }, insideFolder: Boolean })
const emit = defineEmits(['open-folder'])
const openFile = inject('openFile')
const destinations = computed(() => projectDestinations(props.project))
const imageMode = ref('cover')
watch(
  () => props.project.id,
  () => {
    imageMode.value = 'cover'
  }
)
const preview = computed(() => (imageMode.value === 'demo' ? projectPreview(props.project) : destinations.value.files.find((file) => file.kind === 'image')))
</script>

<template>
  <section class="xp-project-preview" :aria-label="$t('projectExplorer.preview') + ' — ' + (project.caseStudyName || project.name)">
    <header class="xp-project-preview-title">
      <span><img src="/img/icons/pictures/image-file.svg" alt="" />{{ insideFolder ? $t('projectExplorer.overview') : $t('projectExplorer.preview') }}</span>
      <slot name="navigation"></slot>
    </header>
    <div class="xp-project-preview-body">
      <figure class="xp-project-preview-picture">
        <div v-if="project.video" class="xp-project-preview-tabs" role="group" :aria-label="$t('projectExplorer.previewImage')">
          <button :aria-pressed="imageMode === 'cover'" @click="imageMode = 'cover'">{{ $t('projectExplorer.coverImage') }}</button>
          <button :aria-pressed="imageMode === 'demo'" @click="imageMode = 'demo'">{{ $t('projectExplorer.demoPreview') }}</button>
        </div>
        <button @click="openFile(preview)" :aria-label="$t('projectExplorer.viewImage') + ' — ' + project.name" :title="$t('projectExplorer.viewImage')">
          <img :src="preview.src" :alt="project.caseStudyName + ' — ' + preview.caption" decoding="async" />
        </button>
        <figcaption>{{ preview.caption }}</figcaption>
      </figure>
      <div class="xp-project-preview-copy">
        <h2>{{ project.caseStudyName || project.name }}</h2>
        <p class="xp-project-headline">{{ project.headline }}</p>
        <p class="xp-project-description">{{ project.description }}</p>
        <div class="xp-project-evidence">
          <span v-if="destinations.video"><img src="/img/icons/music/windows-media-player.png" alt="" />{{ $t('projectExplorer.recordedDemo') }}</span>
          <span v-if="project.gallery.length"
            ><img src="/img/icons/pictures/image-file.svg" alt="" />{{ project.gallery.length }} {{ $t('projectExplorer.screenshots') }}</span
          >
          <span v-if="destinations.source"><img src="/img/icons/explorer-icon-sm.webp" alt="" />{{ $t('projectExplorer.sourceAvailable') }}</span>
        </div>
        <div class="xp-project-actions">
          <button v-if="!insideFolder" class="xp-button xp-project-open" @click="emit('open-folder')">
            <img src="/img/icons/windows-header-tools/open-folders.webp" alt="" />{{ $t('projectExplorer.openFolder') }}
          </button>
          <button v-else class="xp-button" @click="openFile(destinations.description)">
            <img src="/img/icons/documents/txt-icon.webp" alt="" />{{ $t('projectExplorer.readDescription') }}
          </button>
          <button v-if="destinations.video" class="xp-button" @click="openFile(destinations.video)">
            <img src="/img/icons/music/windows-media-player.png" alt="" />{{ $t('projectExplorer.watchDemo') }}
          </button>
          <a
            v-if="destinations.live"
            class="xp-button"
            :href="destinations.live.url"
            target="_blank"
            rel="noopener noreferrer"
            @click.prevent="openFile(destinations.live)"
            ><img src="/img/icons/explorer-icon-sm.webp" alt="" />{{ $t('projectExplorer.liveDemo') }}</a
          >
          <a
            v-if="destinations.source"
            class="xp-button"
            :href="destinations.source.url"
            target="_blank"
            rel="noopener noreferrer"
            @click.prevent="openFile(destinations.source)"
            ><img src="/img/icons/explorer-icon-sm.webp" alt="" />{{ $t('projectExplorer.sourceCode') }}</a
          >
        </div>
        <details class="xp-project-stack" :open="insideFolder">
          <summary>{{ $t('projectExplorer.technologies') }} ({{ project.technologies.length }})</summary>
          <p>{{ project.technologies.join(' · ') }}</p>
        </details>
      </div>
    </div>
  </section>
</template>
