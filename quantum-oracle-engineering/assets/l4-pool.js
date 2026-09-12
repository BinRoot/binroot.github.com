// One borrower of each kind; every pulse returns the shared work to zero.
(function(){
  if(window.__l4PoolInit)return;window.__l4PoolInit=true;
  const L=window.L2;
  const borrowers=[['select',13,L.BLUE],['event',8,L.ORANGE],['payoff',9,L.GREEN]];
  document.querySelectorAll('svg.l4-pool').forEach(svg=>{
    const root=L.el('g',{},svg);
    const slots=Array.from({length:13},(_,i)=>L.el('rect',{
      x:60,y:58+(12-i)*15,width:58,height:12,rx:3,
      fill:'#eee',stroke:L.RULE,'stroke-width':1
    },root));
    const used=L.text(root,'0 / 13',89,282,{size:28,weight:700,fill:L.GREEN});
    const blocks=borrowers.map(([name,n,color],i)=>{
      const x=215+i*175;
      const gate=L.el('rect',{x,y:55,width:145,height:56,rx:7,fill:'#fff',stroke:color,'stroke-width':1.8},root);
      L.text(root,name,x+72.5,83,{size:28,weight:700,fill:color});
      return {x,n,color,gate};
    });
    const baseline=275,height=115,begin=205,end=715;
    L.el('line',{x1:begin,y1:baseline,x2:end,y2:baseline,stroke:L.GREEN,'stroke-width':1.5,'stroke-dasharray':'4 5'},root);
    L.text(root,'0',182,baseline,{size:24,fill:L.GREEN});
    L.text(root,'13',182,baseline-height,{size:24});
    const trace=L.el('path',{fill:'none',stroke:L.ORANGE,'stroke-width':3},root);
    const pointer=L.el('line',{x1:begin,y1:130,x2:begin,y2:baseline+8,stroke:L.ORANGE,'stroke-width':1.5},root);
    const activeAt=x=>blocks.find(b=>x>=b.x&&x<b.x+100);
    const setState=t=>{
      const x=L.lerp(begin,end,Math.min(1,t/6));
      const active=activeAt(x),n=active?.n||0;
      slots.forEach((slot,i)=>slot.setAttribute('fill',i<n?active.color:'#eee'));
      blocks.forEach(b=>b.gate.setAttribute('fill',b===active?'#f2eee5':'#fff'));
      used.textContent=n+' / 13';used.setAttribute('fill',active?.color||L.GREEN);
      pointer.setAttribute('x1',x);pointer.setAttribute('x2',x);
      let d='M '+begin+' '+baseline;
      for(let xx=begin;xx<=x;xx+=1)d+=' L '+xx+' '+(baseline-height*(activeAt(xx)?.n||0)/13);
      trace.setAttribute('d',d);
    };
    L.timeline(svg,{T:6.8,setState});
  });
})();
