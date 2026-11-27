// A virtual portfolio console. These commands never reach an operating-system shell.
export const APP_COMMANDS = Object.freeze({
  computer: 'computer',
  projects: 'myProjects',
  about: 'about',
  skills: 'skills',
  cv: 'myCV',
  documents: 'documents',
  contact: 'contact',
  certificates: 'certifications',
  browser: 'internet',
  paint: 'paint',
  music: 'music',
  doom: 'doom',
  solitaire: 'spider',
  gift: 'gift',
  msn: 'assistant'
})
export const INFO_COMMANDS = ['help', 'whoami', 'skills', 'experience', 'education', 'certifications', 'projects', 'contact', 'cv', 'dir']
export function commandCatalog(projects) {
  return [...INFO_COMMANDS, ...Object.keys(APP_COMMANDS).map((key) => `open ${key}`), ...projects.map((p) => `project ${p.id}`)]
}
export function resolveCommand(raw, profile, projects) {
  if (typeof raw !== 'string' || raw.length > 160) return null
  const normalized = raw.trim().toLowerCase().replace(/\s+/g, ' ')
  const command = normalized === 'open assistant' ? 'open msn' : normalized
  const names = projects.map((p) => `${p.id}  —  ${p.caseStudyName || p.name}`).join('\n')
  let output,
    app = null,
    projectId = null
  switch (command) {
    case 'help':
      output =
        'GHAZI XP • PORTFOLIO COMMANDS\n\nwhoami / skills / experience / education / certifications\nprojects                 List project folders\nproject <id>             Open a project folder\ncv / contact             Open CV or compose an email\nopen <app>               Open an XP application\ndir / clear / cls        Browse / clear this console\n\nApps: ' +
        Object.keys(APP_COMMANDS).join(', ') +
        '\n\nThis is a virtual portfolio console.'
      break
    case 'whoami':
      output = `${profile.name}\n${profile.title}\n${profile.location}\n\n${profile.intro}`
      break
    case 'skills':
      output = profile.skills.map((s) => `${s.category}\n  ${s.items.join(' · ')}`).join('\n\n')
      break
    case 'experience':
      output = profile.experience
        .map((e) => `${e.jobTitle}\n${e.company} | ${e.year}\n${(e.cvResponsibilities || e.responsibilities).map((r) => '  • ' + r).join('\n')}`)
        .join('\n\n')
      break
    case 'education':
      output = profile.education.map((e) => `${e.degree}\n${e.institution}\n${e.year}`).join('\n\n')
      break
    case 'certifications':
      output = profile.certifications.map((c) => `${c.name || c.title}${c.issuer ? ' — ' + c.issuer : ''}`).join('\n')
      break
    case 'projects':
      output = `${names}\n\nUse: project <id>`
      break
    case 'dir':
      output = 'Directory of C:\\Ghazi\\Portfolio\n\n<DIR> Projects\n<DIR> Documents\n<DIR> Skills\n      Ghazi_Saoudi_CV_EN.pdf\n\nType help to explore.'
      break
    case 'contact':
      app = 'contact'
      output = `Opening Outlook Express.\nTo: ${profile.email}\nCompose and send your message yourself.`
      break
    case 'cv':
      app = 'myCV'
      output = 'Opening Ghazi_Saoudi_CV_EN.pdf in Adobe Reader.'
      break
    case 'clear':
    case 'cls':
      return { command, clear: true, output: '' }
    default: {
      if (command.startsWith('open ') && Object.hasOwn(APP_COMMANDS, command.slice(5))) {
        app = APP_COMMANDS[command.slice(5)]
        output = `Opening ${command.slice(5)}…`
      } else if (command.startsWith('project ')) {
        const project = projects.find((p) => p.id === command.slice(8))
        if (!project) return null
        app = 'myProjects'
        projectId = project.id
        output = `Opening ${project.caseStudyName || project.name}.\n${project.summary}\n\nTechnologies: ${project.technologies.join(', ')}`
      } else return null
    }
  }
  return { command, output, app, projectId }
}
export function validatePlan(plan, profile, projects) {
  if (
    !plan ||
    typeof plan !== 'object' ||
    typeof plan.reply !== 'string' ||
    !plan.reply.trim() ||
    plan.reply.length > 4000 ||
    !Array.isArray(plan.commands) ||
    plan.commands.length > 3
  )
    return null
  const allowed = commandCatalog(projects)
  if (!plan.commands.every((command) => typeof command === 'string' && allowed.includes(command) && resolveCommand(command, profile, projects))) return null
  return { reply: plan.reply.trim(), commands: [...new Set(plan.commands)] }
}
