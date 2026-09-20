/* Recent work near this town — Second Nature Tree (Sept 20 2026).
   Reads the public work-days feed, picks the nearest approved days, renders 3 cards. No names, no addresses. */
(function(){
  var host=document.getElementById('rw-near'); if(!host) return;
  var lat=parseFloat(host.getAttribute('data-lat')), lng=parseFloat(host.getAttribute('data-lng')), town=host.getAttribute('data-town')||'you';
  var FEED='https://ltpivkqahvplapyagljt.supabase.co/functions/v1/work-days';
  function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]});}
  function mi(a,b,c,d){var p=Math.PI/180,x=Math.sin((c-a)*p/2),y=Math.sin((d-b)*p/2);return 2*3958.8*Math.asin(Math.sqrt(x*x+Math.cos(a*p)*Math.cos(c*p)*y*y));}
  function when(d){try{var x=new Date(d+'T12:00:00');return x.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});}catch(e){return d;}}
  fetch(FEED).then(function(r){return r.json();}).then(function(j){
    var rows=(j&&j.rows)||[]; if(!rows.length){host.hidden=true;return;}
    rows.forEach(function(r){r._mi=(r.lat&&r.lng&&!isNaN(lat))?mi(lat,lng,r.lat,r.lng):999;});
    rows.sort(function(a,b){return a._mi-b._mi;});
    var near=rows.filter(function(r){return r._mi<=12;}); var pick=(near.length?near:rows).slice(0,3);
    var title=near.length?('Recent work near '+esc(town)):'Recent work nearby';
    host.innerHTML='<div class="container"><h2 class="rwn-h">'+title+'</h2><p class="rwn-p">Real days our crew was on site. Locations are rounded; no names or addresses.</p><div class="rwn-grid">'
      + pick.map(function(r){return '<a class="rwn-card" href="work-day.html?w='+encodeURIComponent(r.id)+'">'+(r.cover?'<img src="'+esc(r.cover)+'" alt="'+esc((r.service||'Tree work')+' in '+r.town)+'" loading="lazy">':'')+'<div class="b"><div class="t">'+esc(r.service||'Tree work')+' · '+esc(r.town||'')+'</div><div class="s">'+esc(r.blurb||'')+'</div><div class="s">'+when(r.date)+(r._mi<999?' · '+Math.round(r._mi)+' mi from '+esc(town):'')+'</div></div></a>';}).join('')
      + '</div><a class="rwn-all" href="recent-work.html">See all recent work on the map →</a></div>';
  }).catch(function(){host.hidden=true;});
})();
