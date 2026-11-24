import { projectFiles } from './project-files.mjs'
const destinationsCache = new WeakMap()

export function projectDestinations(project) {
  if (destinationsCache.has(project)) return destinationsCache.get(project)
  const files = projectFiles(project)
  const destinations = {
    files,
    description: files.find((file) => file.kind === 'text'),
    video: files.find((file) => file.kind === 'video'),
    live: files.find((file) => file.kind === 'link' && /live demo/i.test(file.name) && !file.availability),
    source: files.find(
      (file) => file.kind === 'link' && new URL(file.url).hostname === 'github.com' && /^(github|source repo|desktop repo|web repo)\.url$/i.test(file.name)
    )
  }
  destinationsCache.set(project, destinations)
  return destinations
}

export function projectPreview(project) {
  if (project.video?.poster)
    return {
      kind: 'image',
      name: project.video.poster.split('/').pop(),
      src: project.video.poster,
      caption: project.video.caption,
      projectName: project.caseStudyName || project.name
    }
  return projectDestinations(project).files.find((file) => file.kind === 'image')
}

export function matchesProject(project, query, filter) {
  const search = `${project.name} ${project.caseStudyName} ${project.headline} ${project.description} ${project.technologies.join(' ')}`.toLowerCase()
  if (!search.includes(query.trim().toLowerCase())) return false
  if (filter === 'video') return !!project.video
  if (filter === 'live') return !!projectDestinations(project).live
  if (filter === 'source') return !!projectDestinations(project).source
  return true
}
