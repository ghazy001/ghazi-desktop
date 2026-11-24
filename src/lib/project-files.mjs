export function projectDescription(project) {
  const lines = [
    project.caseStudyName || project.name,
    '='.repeat((project.caseStudyName || project.name).length),
    '',
    project.headline,
    '',
    project.description,
    '',
    'Technologies',
    project.technologies.join(' · ')
  ]
  if (project.highlights?.length) lines.push('', 'Highlights', ...project.highlights.map((text) => '• ' + text))
  for (const section of project.sections || []) {
    lines.push('', section.title, '-'.repeat(section.title.length))
    for (const block of section.blocks) lines.push(block.type === 'li' ? '• ' + block.text : block.text)
  }
  lines.push('', 'Image information', project.imageCaption)
  if (project.video) lines.push('', 'Video demo', project.video.caption, project.video.url)
  lines.push(
    '',
    'Links',
    ...project.links.map((link) => `${link.name}${link.availability ? ' (unavailable)' : ''}: ${link.url}`),
    `Original case study: ${project.source}`
  )
  return lines.filter((line) => line !== undefined).join('\r\n') + '\r\n'
}
export function projectFiles(project) {
  const image = {
    kind: 'image',
    name: 'image.jpg',
    src: `/projects/${project.id}/image.jpg`,
    caption: project.imageCaption,
    projectName: project.caseStudyName || project.name
  }
  const images = [
    image,
    ...(project.gallery || []).map((item) => ({
      kind: 'image',
      name: item.url.split('/').pop(),
      src: item.url,
      caption: item.title + '. ' + item.caption,
      projectName: project.caseStudyName || project.name
    }))
  ]
  return [
    { kind: 'text', name: 'description.txt', src: `/projects/${project.id}/description.txt`, text: projectDescription(project), projectName: project.name },
    ...(project.video
      ? [
          {
            kind: 'video',
            name: 'video demo.mp4',
            src: project.video.url,
            cover: project.video.poster,
            caption: project.video.caption,
            projectName: project.caseStudyName || project.name
          }
        ]
      : []),
    ...images.map((item, index) => ({ ...item, images, index })),
    ...project.links.map((link) => ({
      kind: 'link',
      name: link.name + (link.availability ? ' (unavailable)' : '') + '.url',
      url: link.url,
      availability: link.availability
    })),
    { kind: 'link', name: 'Original Case Study.url', url: project.source }
  ]
}
