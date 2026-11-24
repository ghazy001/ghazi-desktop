// The canvas is drawn from the same verified profile used by the rest of the portfolio.
export function drawAbout(canvas, profile, data, language = 'en') {
  const copy = data[language] || data.en
  canvas.width = data.width
  canvas.height = data.height
  const c = canvas.getContext('2d', { willReadFrequently: true })
  c.fillStyle = '#fff'
  c.fillRect(0, 0, canvas.width, canvas.height)
  c.lineCap = 'round'
  c.lineJoin = 'round'
  function text(value, x, y, size = 28, color = '#25324a', weight = 500, angle = 0) {
    c.save();c.translate(x, y);c.rotate(angle);c.fillStyle=color;c.font=`${weight} ${size}px PaintHand, cursive`;c.fillText(value,0,0);c.restore()
  }
  function line(points, color = '#246dc2', width = 2.5) {
    c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(...points[0]);for(const p of points.slice(1))c.lineTo(...p);c.stroke()
  }
  function highlight(x,y,w,color) { c.fillStyle=color;c.beginPath();c.moveTo(x,y);c.lineTo(x+w,y-3);c.lineTo(x+w-2,y+12);c.lineTo(x-3,y+14);c.fill() }
  function arrow(points,color='#ec7b35') { line(points,color,3);const p=points.at(-1);line([[p[0]-10,p[1]-4],p,[p[0]-3,p[1]-11]],color,3) }
  function star(x,y,size=10) { line([[x,y-size],[x+3,y-3],[x+size,y],[x+3,y+3],[x,y+size],[x-3,y+3],[x-size,y],[x-3,y-3],[x,y-size]],'#dc9b25',2) }
  text(copy.hello,55,54,28,'#66758c',500,-.025)
  highlight(52,116,363,'#fff2a3')
  text(profile.name,54,111,64,'#17467e',700,-.018)
  line([[54,131],[120,133],[195,130],[275,133],[353,129],[417,131]],'#236bba',2)
  text(copy.role,56,171,36,'#25324a',600,.008)
  text(copy.focus,57,211,26,'#7954a1',500,-.012)
  copy.intro.forEach((value,i)=>text(value,59,260+i*32,29,'#303943',500,i%2?.008:-.006))
  // A deliberately imperfect pen-drawn desktop and code window.
  line([[667,68],[918,73],[914,239],[664,234],[667,68]],'#365166',3)
  line([[677,82],[906,85],[902,219],[676,215],[677,82]],'#365166',2)
  line([[681,101],[901,104]],'#89aac3',2)
  for(let i=0;i<3;i++){c.fillStyle=['#ed885b','#e3bf50','#76ac6b'][i];c.beginPath();c.arc(688+i*12,94,3,0,Math.PI*2);c.fill()}
  text('</>',737,176,55,'#276bb2',600,-.04)
  line([[717,191],[753,194],[787,191],[853,195]],'#abc6df',3)
  line([[774,237],[774,261],[739,274],[846,277],[809,262],[811,240]],'#365166',3)
  line([[686,295],[883,299],[908,326],[666,322],[686,295]],'#365166',2)
  for(let r=0;r<2;r++)for(let col=0;col<11;col++)line([[690+col*16-r*5,303+r*9],[700+col*16-r*5,303+r*9]],'#96a6b1',1.3)
  arrow([[463,153],[509,133],[553,136],[588,163]])
  text(copy.code,630,361,27,'#47735d',500,-.025)
  star(626,83,10);star(936,269,9);star(601,309,6)
  line([[54,388],[255,385],[493,389],[730,386],[944,389]],'#d5dee8',1.6)
  highlight(51,419,318,'#e0f0d1')
  text(copy.tools,57,436,31,'#285e47',600,-.02)
  data.skillGroups.forEach((category,index)=>{
    const group=profile.skills.find(group=>group.category===category)
    const entries=group?.items.slice(0,category==='Backend'?3:category==='Programming Languages'?3:3) || []
    c.fillStyle=['#2676b9','#8d62a7','#e78b3b','#55955d'][index];c.beginPath();c.arc(65,472+index*36,3,0,Math.PI*2);c.fill()
    text(entries.join(' / '),80,481+index*36,26,'#303943',500,index%2?.012:-.013)
  })
  // A small cloud and location note.
  c.strokeStyle='#7da9ce';c.lineWidth=2.4;c.beginPath();c.moveTo(593,450);c.bezierCurveTo(572,443,579,417,597,418);c.bezierCurveTo(596,392,635,385,645,408);c.bezierCurveTo(671,398,686,429,668,442);c.bezierCurveTo(669,458,615,456,593,450);c.stroke()
  text(copy.location,698,419,24,'#66758c',500,.02)
  text(profile.location,696,451,30,'#285e86',600,-.012)
  text(copy.education,592,505,30,'#845995',600,-.02)
  line([[590,513],[689,516],[781,512]],'#bca3cf',2)
  text(copy.degree,592,546,27,'#303943')
  const education=profile.education[0]
  const school=education.institution.split(' — ')[0]
  text(`${school}  ·  ${education.year}`,593,576,26,'#303943',500,.01)
  line([[55,625],[304,622],[535,626],[761,623],[944,626]],'#d5dee8',1.6)
  text(copy.invitation,58,661,32,'#17467e',600,-.015)
  text(profile.email,58,693,24,'#4a6078')
  text(copy.note,650,681,23,'#b66f2e',500,-.04)
  arrow([[892,640],[926,646],[939,669]],'#d59b58')
  return copy.filename
}
