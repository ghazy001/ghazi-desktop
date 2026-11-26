import { projectFiles } from './project-files.mjs'
export const ROOT = 'computer'
export function resolveComputerLocation(value, config) {
  const normalized = String(value).trim().replaceAll('/', '\\').replace(/\\+$/, '').toLowerCase()
  if (['computer', 'my computer', 'poste de travail', ''].includes(normalized)) return ROOT
  return config.drives.find((d) => d.id.toLowerCase() === normalized || `${d.label.toLowerCase()} (${d.id.toLowerCase()})` === normalized)?.id || null
}
export function computerCatalog({ config, profile, projects, playlist, apps }, language = 'en') {
  const copy = config[language] || config.en,
    appById = new Map(apps.map((a) => [a.id, a])),
    locations = {}
  function application(id, parent) {
    const app = appById.get(id)
    if (!app) throw new Error(`Missing app: ${id}`)
    return {
      id: `${parent}/${id}`,
      name: app.title[language] || app.title.en,
      icon: app.imgSrc,
      type: copy.folder,
      description: app.subtitle?.[language] || '',
      app: id,
      parent
    }
  }
  for (const drive of config.drives) {
    const entries = (drive.apps || []).map((id) => application(id, drive.id))
    if (drive.id === 'C:')
      entries.push({
        id: 'C:/readme',
        name: 'README.txt',
        icon: '/img/icons/documents/txt-icon.webp',
        type: copy.text,
        parent: 'C:',
        file: {
          kind: 'text',
          name: 'README.txt',
          text: `${profile.name}\n${profile.title}\n${profile.location}\n\n${profile.intro}\n\n${profile.bio.join('\n\n')}\n\n${profile.email}\n${profile.website}`
        }
      })
    if (drive.id === 'D:')
      for (const project of projects)
        entries.push({
          id: `D:/${project.id}`,
          name: project.caseStudyName || project.name,
          icon: '/img/icons/documents/folder-docs-icon-lg.webp',
          type: copy.folder,
          description: project.headline || project.summary,
          search: project.technologies.join(' '),
          parent: 'D:',
          project
        })
    if (drive.id === 'E:')
      for (const project of projects) {
        const video = projectFiles(project).find((f) => f.kind === 'video')
        if (video)
          entries.push({
            id: `E:/${project.id}`,
            name: `${project.caseStudyName || project.name} — video demo.mp4`,
            icon: '/img/icons/music/windows-media-player.png',
            type: copy.video,
            description: project.name,
            parent: 'E:',
            file: video
          })
      }
    if (drive.id === 'F:')
      entries.forEach((entry) => {
        entry.name = entry.app === 'gift' ? 'gift.exe' : `${entry.name}.exe`
        entry.type = copy.application
      })
    locations[drive.id] = entries
  }
  const drives = config.drives.map((d) => ({
    id: `drive-${d.id}`,
    name: `${d.label} (${d.id})`,
    iconKind: d.icon,
    type: d.icon === 'disc' ? copy.cdDrive : copy.localDisk,
    description: d.id === 'D:' ? `${projects.length} ${copy.projectCount}` : d.id === 'E:' ? `${playlist.tracks.length} ${copy.trackCount}` : d.description[language],
    target: d.id,
    parent: ROOT,
    count: locations[d.id].length,
    group: d.icon === 'disc' ? 'removable' : 'disks'
  }))
  locations[ROOT] = [
    {
      id: 'shared',
      name: copy.shared,
      icon: '/img/icons/documents/folder-docs-icon-lg.webp',
      type: copy.folder,
      description: copy.files,
      app: 'documents',
      group: 'files',
      parent: ROOT
    },
    {
      id: 'personal',
      name: copy.personal,
      icon: '/img/icons/documents/folder-docs-icon-lg.webp',
      type: copy.folder,
      description: profile.name,
      target: 'C:',
      group: 'files',
      parent: ROOT
    },
    ...drives,
    {
      id: 'network-portfolio',
      name: copy.portfolio,
      icon: '/img/icons/side-menu/networking-icon.webp',
      type: copy.networkType,
      description: profile.website,
      app: 'internet',
      file: { kind: 'link', name: 'Original Portfolio.url', url: profile.website },
      group: 'network',
      parent: ROOT
    }
  ]
  return { locations, drives, all: Object.values(locations).flat() }
}
export function searchComputer(items, query) {
  const clean = (value) => String(value).normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
  const terms = clean(query).trim().split(/\s+/).filter(Boolean)
  return items.filter((item) => terms.every((term) => clean(`${item.name} ${item.type} ${item.description || ''} ${item.search || ''} ${item.parent}`).includes(term)))
}
