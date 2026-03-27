import { useState } from "react";
import { C } from "../utils/constants";

const BRANCH_COLORS = ["#C9A84C","#0EA5A0","#A78BFA","#E05252","#3DB88A","#4A9EDB","#FB923C","#60A5FA"];

export default function MindMap({ data, subjectColor }) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  if (!data?.center) return null;

  const W=920,H=580,cx=W/2,cy=H/2,R=190;
  const branches=(data.branches||[]).slice(0,6);
  const step=(2*Math.PI)/Math.max(branches.length,1);
  const positions=branches.map((_,i)=>({ x:cx+R*Math.cos(i*step-Math.PI/2), y:cy+R*Math.sin(i*step-Math.PI/2) }));

  return (
    <div style={{position:"relative"}}>
      <div style={{position:"absolute",top:10,right:10,zIndex:10,display:"flex",gap:6}}>
        {[["−",-.15],["＋",.15]].map(([l,d])=>(
          <button key={l} onClick={()=>setZoom(z=>Math.max(0.4,Math.min(2.2,z+d)))}
            style={{background:C.surfaceHi,border:`1px solid ${C.border}`,borderRadius:8,color:C.text,width:30,height:30,cursor:"pointer",fontSize:15,fontWeight:800}}>{l}</button>
        ))}
        <button onClick={()=>{setZoom(1);setPan({x:0,y:0});}}
          style={{background:C.surfaceHi,border:`1px solid ${C.border}`,borderRadius:8,color:C.textMid,padding:"0 10px",cursor:"pointer",fontSize:11}}>Reset</button>
      </div>
      <div style={{background:`${C.bg}cc`,borderRadius:12,border:`1px solid ${C.border}`,overflow:"hidden",cursor:dragging?"grabbing":"grab"}}
        onMouseDown={e=>{setDragging(true);setDragStart({x:e.clientX-pan.x,y:e.clientY-pan.y});}}
        onMouseMove={e=>{if(dragging)setPan({x:e.clientX-dragStart.x,y:e.clientY-dragStart.y});}}
        onMouseUp={()=>setDragging(false)} onMouseLeave={()=>setDragging(false)}>
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{display:"block",minHeight:360}}>
          <defs>{BRANCH_COLORS.map((c,i)=>(
            <radialGradient key={i} id={`mg${i}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={c} stopOpacity="0.28"/><stop offset="100%" stopColor={c} stopOpacity="0.03"/>
            </radialGradient>
          ))}</defs>
          <g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`} style={{transformOrigin:`${cx}px ${cy}px`}}>
            <circle cx={cx} cy={cy} r={240} fill={`${subjectColor}04`}/>
            <circle cx={cx} cy={cy} r={240} fill="none" stroke={`${subjectColor}10`} strokeWidth="1" strokeDasharray="4,8"/>
            {positions.map((pos,i)=>{
              const col=BRANCH_COLORS[i%BRANCH_COLORS.length];
              const cpx=cx+(pos.x-cx)*0.45,cpy=cy+(pos.y-cy)*0.1;
              return <path key={i} d={`M ${cx} ${cy} Q ${cpx} ${cpy} ${pos.x} ${pos.y}`} fill="none" stroke={col} strokeWidth="1.8" strokeOpacity="0.45" strokeDasharray={i%2?"5,3":"none"}/>;
            })}
            {branches.map((branch,i)=>{
              const pos=positions[i],col=BRANCH_COLORS[i%BRANCH_COLORS.length];
              return (branch.subtopics||[]).slice(0,3).map((leaf,j)=>{
                const ang=i*step-Math.PI/2+(j-1)*0.38,lx=pos.x+88*Math.cos(ang),ly=pos.y+88*Math.sin(ang);
                return (<g key={`${i}-${j}`}>
                  <line x1={pos.x} y1={pos.y} x2={lx} y2={ly} stroke={col} strokeWidth="1" strokeOpacity="0.25"/>
                  <circle cx={lx} cy={ly} r={20} fill={`${col}12`} stroke={col} strokeWidth="0.8" strokeOpacity="0.5"/>
                  <foreignObject x={lx-18} y={ly-14} width={36} height={28}>
                    <div xmlns="http://www.w3.org/1999/xhtml" style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",textAlign:"center"}}>
                      <span style={{color:col,fontSize:8,fontWeight:600,lineHeight:1.2,wordBreak:"break-word",fontFamily:"Mulish,sans-serif"}}>{leaf.length>12?leaf.slice(0,12)+"…":leaf}</span>
                    </div>
                  </foreignObject>
                </g>);
              });
            })}
            {branches.map((branch,i)=>{
              const pos=positions[i],col=BRANCH_COLORS[i%BRANCH_COLORS.length];
              return (<g key={`b${i}`}>
                <circle cx={pos.x} cy={pos.y} r={50} fill={`url(#mg${i%BRANCH_COLORS.length})`} stroke={col} strokeWidth="1.5"/>
                <foreignObject x={pos.x-44} y={pos.y-30} width={88} height={60}>
                  <div xmlns="http://www.w3.org/1999/xhtml" style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",textAlign:"center"}}>
                    <span style={{color:col,fontSize:9.5,fontWeight:800,lineHeight:1.4,wordBreak:"break-word",fontFamily:"Mulish,sans-serif"}}>{branch.topic}</span>
                  </div>
                </foreignObject>
              </g>);
            })}
            <circle cx={cx} cy={cy} r={62} fill={`${subjectColor}18`} stroke={subjectColor} strokeWidth="2"/>
            <circle cx={cx} cy={cy} r={56} fill={`${subjectColor}10`} stroke={subjectColor} strokeWidth="1" strokeDasharray="3,3"/>
            <foreignObject x={cx-48} y={cy-32} width={96} height={64}>
              <div xmlns="http://www.w3.org/1999/xhtml" style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",textAlign:"center"}}>
                <span style={{color:subjectColor,fontSize:11,fontWeight:900,lineHeight:1.4,wordBreak:"break-word",fontFamily:"Playfair Display,serif"}}>{data.center}</span>
              </div>
            </foreignObject>
          </g>
        </svg>
      </div>
    </div>
  );
}
