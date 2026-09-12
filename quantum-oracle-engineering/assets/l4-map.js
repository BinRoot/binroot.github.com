// Records dominate the 169-qubit allocation. The detailed split is in the notes.
(function(){
  if(window.__l4MapInit)return;window.__l4MapInit=true;
  const L=window.L2;
  const groups=[['records',155,L.BLUE],['scratch',13,L.ORANGE],['payoff',1,L.GREEN]];
  document.querySelectorAll('svg.l4-map').forEach(svg=>{
    const root=L.el('g',{},svg);
    let start=60;
    const bars=groups.map(([name,n,color],i)=>{
      const width=640*n/169;
      const bar=L.el('rect',{x:start,y:55,width:0,height:90,fill:color},root);
      const label=L.el('g',{opacity:0},root);
      const x=155+i*225;
      L.text(label,String(n),x,212,{size:46,weight:700,fill:color});
      L.text(label,name,x,267,{size:28,weight:700,fill:color});
      start+=width;
      return {bar,label,width};
    });
    L.timeline(svg,{T:2.4,setState(t){
      bars.forEach((b,i)=>{
        const u=L.win(t,0.2+i*0.5,0.6,L.outQuart);
        b.bar.setAttribute('width',b.width*u);
        b.label.setAttribute('opacity',u);
      });
    }});
  });
})();
