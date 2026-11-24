export const MAX_DIMENSION = 2000
export const palette = ['#000000','#808080','#800000','#808000','#008000','#008080','#000080','#800080','#808040','#004040','#0080ff','#004080','#8000ff','#804000','#ffffff','#c0c0c0','#ff0000','#ffff00','#00ff00','#00ffff','#0000ff','#ff00ff','#ffff80','#00ff80','#80ffff','#8080ff','#ff0080','#ff8040']
export const tools = ['lasso','select','eraser','fill','picker','zoom','pencil','brush','spray','text','line','curve','rectangle','polygon','ellipse','rounded']
export function bounds(a,b) { return { x:Math.floor(Math.min(a.x,b.x)),y:Math.floor(Math.min(a.y,b.y)),width:Math.max(1,Math.ceil(Math.abs(b.x-a.x))),height:Math.max(1,Math.ceil(Math.abs(b.y-a.y))) } }
export function fillPixels(image,x,y,color) {
  x=Math.floor(x);y=Math.floor(y)
  if(x<0||y<0||x>=image.width||y>=image.height)return false
  const pixels=new Uint32Array(image.data.buffer,image.data.byteOffset,image.data.byteLength/4)
  const bytes=new Uint8ClampedArray([parseInt(color.slice(1,3),16),parseInt(color.slice(3,5),16),parseInt(color.slice(5,7),16),255])
  const replacement=new Uint32Array(bytes.buffer)[0], target=pixels[y*image.width+x]
  if(target===replacement)return false
  const w=image.width,h=image.height,stack=[x,y]
  while(stack.length){ const cy=stack.pop();let cx=stack.pop();while(cx>=0&&pixels[cy*w+cx]===target)cx--;cx++;let above=false,below=false
    for(;cx<w&&pixels[cy*w+cx]===target;cx++){pixels[cy*w+cx]=replacement
      if(cy>0){if(pixels[(cy-1)*w+cx]===target){if(!above)stack.push(cx,cy-1);above=true}else above=false}
      if(cy<h-1){if(pixels[(cy+1)*w+cx]===target){if(!below)stack.push(cx,cy+1);below=true}else below=false}
    }
  }
  return true
}
export function shape(context,tool,a,b,options,controls=[]) {
  const box=bounds(a,b),{color,background,width,fill='outline'}=options
  context.save();context.lineCap='round';context.lineJoin='round';context.lineWidth=width;context.strokeStyle=color;context.fillStyle=fill==='solid'?color:background;context.beginPath()
  if(tool==='line'||tool==='curve'){context.moveTo(a.x,a.y);if(tool==='curve'&&controls.length===1)context.quadraticCurveTo(controls[0].x,controls[0].y,b.x,b.y);else if(controls.length===2)context.bezierCurveTo(controls[0].x,controls[0].y,controls[1].x,controls[1].y,b.x,b.y);else context.lineTo(b.x,b.y)}
  else if(tool==='ellipse')context.ellipse(box.x+box.width/2,box.y+box.height/2,box.width/2,box.height/2,0,0,Math.PI*2)
  else if(tool==='rounded'){const r=Math.min(18,box.width/3,box.height/3),x=box.x,y=box.y,w=box.width,h=box.height;context.moveTo(x+r,y);context.arcTo(x+w,y,x+w,y+h,r);context.arcTo(x+w,y+h,x,y+h,r);context.arcTo(x,y+h,x,y,r);context.arcTo(x,y,x+w,y,r);context.closePath()}
  else context.rect(box.x,box.y,box.width,box.height)
  if(!['line','curve'].includes(tool)&&fill!=='outline')context.fill()
  if(fill!=='solid'||['line','curve'].includes(tool))context.stroke()
  context.restore()
}
export function polygon(context,points,options,closed=true){
  if(points.length<2)return
  context.save();context.strokeStyle=options.color;context.fillStyle=options.fill==='solid'?options.color:options.background;context.lineWidth=options.width;context.lineJoin='round';context.beginPath();context.moveTo(points[0].x,points[0].y);points.slice(1).forEach(p=>context.lineTo(p.x,p.y));if(closed)context.closePath();if(closed&&options.fill!=='outline')context.fill();if(options.fill!=='solid'||!closed)context.stroke();context.restore()
}
export class PaintHistory {
  constructor(canvas,onChange=()=>{}) { this.canvas=canvas;this.onChange=onChange;this.undoStates=[];this.redoStates=[];this.limit=32*1024*1024 }
  snapshot(){return {width:this.canvas.width,height:this.canvas.height,data:this.canvas.getContext('2d').getImageData(0,0,this.canvas.width,this.canvas.height)}}
  commit(){this.undoStates.push(this.snapshot());this.redoStates=[];this.trim();this.onChange()}
  trim(){let bytes=this.undoStates.reduce((sum,state)=>sum+state.data.data.byteLength,0);while(this.undoStates.length>2&&bytes>this.limit)bytes-=this.undoStates.shift().data.data.byteLength}
  restore(state){this.canvas.width=state.width;this.canvas.height=state.height;this.canvas.getContext('2d').putImageData(state.data,0,0);this.onChange()}
  undo(){if(this.undoStates.length<2)return false;this.redoStates.push(this.undoStates.pop());this.restore(this.undoStates.at(-1));return true}
  redo(){if(!this.redoStates.length)return false;const state=this.redoStates.pop();this.undoStates.push(state);this.restore(state);return true}
}
