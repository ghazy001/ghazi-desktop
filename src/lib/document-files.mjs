export const DOCUMENTS_ROOT = 'documents'
const icon = {
  folder: '/img/icons/documents/folder-docs-icon-lg.webp',
  text: '/img/icons/documents/txt-icon.webp',
  pdf: '/img/icons/cv/adobe-pdf.png',
  link: '/img/icons/explorer-icon-lg.webp'
}
const encodeSize = (text) => new TextEncoder().encode(text).byteLength
export const shortcutText = (url) => `[InternetShortcut]\r\nURL=${url}\r\n`
export function documentCatalog(profile, config, language = 'en') {
  const copy = config[language] || config.en,
    folders = new Map(),
    entries = []
  const root = { id: DOCUMENTS_ROOT, name: copy.title, parent: null, icon: icon.folder }
  const career = { id: 'profile', name: copy.profile, parent: root.id, icon: icon.folder, description: copy.folderDescription }
  const credentials = { id: 'certificates', name: copy.certificates, parent: root.id, icon: icon.folder, description: copy.certificateDescription }
  ;[root, career, credentials].forEach((folder) => folders.set(folder.id, folder))
  function add(item) {
    const entry = { ...item, icon: item.icon || icon[item.kind] || icon.folder, type: copy[item.kind] || copy.shortcut }
    entries.push(entry)
    return entry
  }
  function folderEntry(folder) {
    return add({ ...folder, kind: 'folder', target: folder.id })
  }
  function text(id, parent, name, body, description = '') {
    return add({ id, parent, name, kind: 'text', text: body, bytes: encodeSize(body), description })
  }
  folderEntry(career)
  folderEntry(credentials)
  for (const [id, app, img] of [
    ['projects', 'myProjects', '/img/icons/projects/projects-icon-lg.webp'],
    ['pictures', 'pictures', '/img/icons/pictures/folder-images-icon-lg.webp'],
    ['music', 'music', '/img/icons/music/windows-media-player.png']
  ])
    add({ id: `shortcut-${id}`, parent: root.id, name: copy[id], kind: 'shortcut', app, icon: img, description: copy.shortcut })
  add({
    id: 'cv',
    parent: root.id,
    name: profile.cv.filename,
    kind: 'pdf',
    app: 'myCV',
    src: profile.cv.url,
    bytes: config.assetBytes[profile.cv.url],
    description: `${profile.cv.language} · ${copy.original}`,
    summary: profile.cvSummary || profile.specialization
  })
  text('about', root.id, copy.about, `${profile.name}\n${profile.title}\n${profile.location}\n\n${profile.bio.join('\n\n')}\n\n${profile.focus}`, profile.specialization)
  text(
    'contact',
    root.id,
    copy.contact,
    `${profile.name}\n${profile.title}\n\nEmail: ${profile.email}\nPhone: ${profile.phone}\nLocation: ${profile.location}\n\n${profile.links.map((link) => `${link.name}: ${link.url}`).join('\n')}`,
    profile.email
  )
  add({
    id: 'portfolio',
    parent: root.id,
    name: copy.portfolio,
    kind: 'link',
    url: profile.website,
    bytes: encodeSize(shortcutText(profile.website)),
    description: profile.website
  })
  const header = `${profile.name}\n${profile.title}\n\n`
  text(
    'experience',
    career.id,
    copy.experience,
    header +
      profile.experience
        .map(
          (job) =>
            `${job.jobTitle}\n${job.company}\n${job.year}\n\n${[...new Set([...job.responsibilities, ...(job.cvResponsibilities || [])])].map((item) => `- ${item}`).join('\n')}\n\nTechnologies: ${job.technologies.join(', ')}`
        )
        .join('\n\n----------------------------------------\n\n'),
    `${profile.experience.length} ${language === 'fr' ? 'expériences' : 'roles'}`
  )
  text(
    'education',
    career.id,
    copy.education,
    header + profile.education.map((education) => `${education.degree}\n${education.institution}\n${education.year}`).join('\n\n'),
    `${profile.education.length} ${language === 'fr' ? 'formations' : 'education entries'}`
  )
  text(
    'skills',
    career.id,
    copy.skills,
    header + [...profile.skills, ...profile.cvSkills].map((group) => `${group.category}\n${group.items.join(', ')}`).join('\n\n'),
    profile.specialization
  )
  text(
    'languages',
    career.id,
    copy.languages,
    header + profile.languages.map((language) => `${language.name} — ${language.level}`).join('\n'),
    profile.languages.map((language) => language.name).join(' · ')
  )
  text('strengths', career.id, copy.strengths, header + profile.softSkills.map((skill) => `- ${skill}`).join('\n'), profile.softSkills.join(' · '))
  const badgeImages = profile.certifications
    .filter((cert) => cert.image)
    .map((cert) => ({ kind: 'image', name: `${cert.name}.webp`, src: cert.image, caption: `${cert.name} — ${cert.issuer}${cert.issued ? ' · ' + cert.issued : ''}` }))
  profile.certifications.forEach((cert, index) => {
    const folder = {
      id: `credential-${index}`,
      name: cert.name,
      parent: credentials.id,
      icon: icon.folder,
      preview: cert.image,
      description: cert.issuer,
      issuer: cert.issuer,
      issued: cert.issued
    }
    folders.set(folder.id, folder)
    folderEntry(folder)
    text(
      `${folder.id}-text`,
      folder.id,
      copy.credential,
      `${cert.name}\n\n${copy.issuer}: ${cert.issuer}\n${copy.issued}: ${cert.issued || copy.notProvided}\n\n${cert.url ? `Verification: ${cert.url}` : copy.sourceMissing}\n\nSource: ${cert.url || cert.source || profile.cv.source}`,
      cert.issuer
    )
    if (cert.image) {
      const imageIndex = badgeImages.findIndex((image) => image.src === cert.image)
      add({
        id: `${folder.id}-badge`,
        parent: folder.id,
        name: `${cert.name}.webp`,
        kind: 'image',
        icon: cert.image,
        src: cert.image,
        images: badgeImages,
        index: imageIndex,
        bytes: config.assetBytes[cert.image],
        description: cert.issuer,
        caption: badgeImages[imageIndex].caption,
        issuer: cert.issuer,
        issued: cert.issued
      })
    }
    if (cert.url)
      add({
        id: `${folder.id}-verify`,
        parent: folder.id,
        name: copy.verify,
        kind: 'link',
        url: cert.url,
        bytes: encodeSize(shortcutText(cert.url)),
        description: cert.url,
        issuer: cert.issuer,
        issued: cert.issued
      })
  })
  for (const folder of folders.values()) folder.count = entries.filter((entry) => entry.parent === folder.id).length
  for (const entry of entries) if (entry.target) entry.count = folders.get(entry.target).count
  function path(id) {
    const folder = folders.get(id)
    return folder?.parent ? `${path(folder.parent)}\\${folder.name}` : root.name
  }
  return { root, folders, entries, path, children: (id) => entries.filter((entry) => entry.parent === id) }
}
export function findDocuments(items, query) {
  const clean = (value) =>
    String(value || '')
      .normalize('NFD')
      .replace(/\p{M}/gu, '')
      .toLowerCase()
  const terms = clean(query).trim().split(/\s+/).filter(Boolean)
  return items.filter((item) =>
    terms.every((term) => clean(`${item.name} ${item.description || ''} ${item.text || ''} ${item.issuer || ''} ${item.url || ''}`).includes(term))
  )
}
export function resolveDocumentFolder(value, catalog) {
  const clean = (value) => String(value).replaceAll('/', '\\').replace(/\\+$/, '').normalize('NFD').replace(/\p{M}/gu, '').trim().toLowerCase()
  const input = clean(value)
  for (const folder of catalog.folders.values())
    if ([folder.id, catalog.path(folder.id), `C:\\Documents and Settings\\Ghazi\\${catalog.path(folder.id)}`].some((alias) => clean(alias) === input)) return folder.id
  return null
}
export function sortDocuments(items, key = 'name', language = 'en') {
  const collator = new Intl.Collator(language, { numeric: true, sensitivity: 'base' })
  return [...items].sort(
    (a, b) => Number(b.kind === 'folder') - Number(a.kind === 'folder') || (key === 'size' ? (b.bytes || 0) - (a.bytes || 0) : 0) || collator.compare(a.name, b.name)
  )
}
export function downloadableDocument(item) {
  if (!item || ['folder', 'shortcut'].includes(item.kind)) return null
  const name = item.name.replace(/[<>:"/\\|?*\u0000-\u001f]/g, '-')
  if (item.kind === 'pdf' || item.kind === 'image') return { name, url: item.src }
  return { name, text: item.kind === 'link' ? shortcutText(item.url) : item.text, type: 'text/plain;charset=utf-8' }
}
