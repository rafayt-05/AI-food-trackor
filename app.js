/* Client-side SPA prototype
   - simple register/login stored in localStorage (prototype only)
   - donors create offers with location
   - suggestions: match by simple Haversine distance to NGO fixtures
*/
const STORAGE = {
  USERS: 'fw_users_v1',
  OFFERS: 'fw_offers_v1',
  NGOS: 'fw_ngos_v1'
}

function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,6)}

function read(key){try{return JSON.parse(localStorage.getItem(key)||'[]')}catch(e){return[]}}
function write(key,val){localStorage.setItem(key,JSON.stringify(val))}

/* --- Simple auth --- */
function register(user){const users=read(STORAGE.USERS);if(users.find(u=>u.email===user.email))throw new Error('Email exists');users.push(user);write(STORAGE.USERS,users)}
function login(email,password){const users=read(STORAGE.USERS);return users.find(u=>u.email===email&&u.password===password)||null}

/* --- NGOs fixtures (if not present) --- */
function ensureNgos(){let ngos=read(STORAGE.NGOS);if(ngos.length===0){ngos=[
  {id:'ngo1',name:'Helping Hands',lat:28.6139,lon:77.2090,contact:'+911234567890'},
  {id:'ngo2',name:'Food For All',lat:28.7041,lon:77.1025,contact:'+919876543210'},
  {id:'ngo3',name:'Community Care',lat:28.5355,lon:77.3910,contact:'+911112223334'}
];write(STORAGE.NGOS,ngos)}
}

/* --- Offers --- */
function loadOffers(){return read(STORAGE.OFFERS)}
function saveOffers(list){write(STORAGE.OFFERS,list)}
function addOffer(o){const offers=loadOffers();offers.push(o);saveOffers(offers);renderOffers()}
function removeOffer(id){let offers=loadOffers();offers=offers.filter(x=>x.id!==id);saveOffers(offers);renderOffers()}

/* --- Render --- */
function renderOffers(){const root=document.getElementById('offers');const offers=loadOffers().sort((a,b)=>b.createdAt-a.createdAt);if(!offers.length){root.innerHTML='<p class="small">No offers yet.</p>';return}root.innerHTML='';offers.forEach(o=>{const el=document.createElement('div');el.className='offer';const img=document.createElement('img');img.src=o.photo||'https://via.placeholder.com/96?text=Food';const meta=document.createElement('div');meta.className='meta';const title=document.createElement('div');title.innerHTML=`<strong>${escapeHtml(o.itemName)}</strong> <span class="small">(${o.quantity})</span>`;const info=document.createElement('div');info.className='small';const expiry=o.expiry?new Date(o.expiry).toLocaleString():'N/A';info.innerHTML=`<div class="timestamp">Created: ${new Date(o.createdAt).toLocaleString()}</div><div>Expiry: ${expiry}</div><div>Pickup: ${escapeHtml(o.pickup||'')}</div>`;const actions=document.createElement('div');const removeBtn=document.createElement('button');removeBtn.textContent='Remove';removeBtn.style.background='#e53e3e';removeBtn.onclick=()=>{if(confirm('Remove this offer?')) removeOffer(o.id)};actions.appendChild(removeBtn);meta.appendChild(title);meta.appendChild(info);meta.appendChild(actions);el.appendChild(img);el.appendChild(meta);root.appendChild(el)})}

function escapeHtml(s){return String(s||'').replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]))}

/* --- NGOs suggestions by distance --- */
function haversine(lat1,lon1,lat2,lon2){function toRad(d){return d*Math.PI/180}const R=6371;const dLat=toRad(lat2-lat1);const dLon=toRad(lon2-lon1);const a=Math.sin(dLat/2)*Math.sin(dLat/2)+Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)*Math.sin(dLon/2);const c=2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));return R*c}

function suggestNgos(lat,lon,limit=5){ensureNgos();const ngos=read(STORAGE.NGOS).map(n=>({...n,distance:haversine(lat,lon,n.lat,n.lon)})).sort((a,b)=>a.distance-b.distance);return ngos.slice(0,limit)}

function renderNgos(list){const root=document.getElementById('ngos');if(!list||!list.length){root.innerHTML='<p class="small">No suggestions yet.</p>';return}root.innerHTML='';list.forEach(n=>{const el=document.createElement('div');el.className='offer';el.innerHTML=`<div class="meta"><strong>${escapeHtml(n.name)}</strong><div class="small">${escapeHtml(n.contact)}</div><div class="small">Distance: ${n.distance.toFixed(2)} km</div></div>`;root.appendChild(el)})}

/* --- SPA navigation & auth wiring --- */
let currentUser=null
function showView(id){document.querySelectorAll('.view').forEach(v=>v.style.display=v.id===id?'block':'none');document.querySelectorAll('button[data-view]').forEach(b=>b.disabled=b.getAttribute('data-view')===id)}

document.querySelectorAll('button[data-view]').forEach(b=>b.addEventListener('click',e=>{showView(b.getAttribute('data-view'))}))

document.getElementById('registerForm').addEventListener('submit',e=>{e.preventDefault();try{const u={id:uid(),name:document.getElementById('regName').value.trim(),email:document.getElementById('regEmail').value.trim(),password:document.getElementById('regPass').value,role:document.getElementById('regRole').value};register(u);alert('Registered — please login');showView('login')}catch(err){alert(err.message)}})

document.getElementById('loginForm').addEventListener('submit',e=>{e.preventDefault();const email=document.getElementById('loginEmail').value.trim();const pass=document.getElementById('loginPass').value;const user=login(email,pass);if(!user){alert('Invalid credentials');return}else{currentUser=user;onLogin()}})

function onLogin(){document.getElementById('logoutBtn').style.display='inline-block';document.querySelectorAll('button[data-view]').forEach(b=>b.style.display=b.getAttribute('data-view')==='home'?'inline-block':'none');document.getElementById('userInfo').textContent=`Signed in as ${currentUser.name} (${currentUser.role})`;showView('dashboard');renderOffers();}

document.getElementById('logoutBtn').addEventListener('click',()=>{currentUser=null;document.getElementById('logoutBtn').style.display='none';document.querySelectorAll('button[data-view]').forEach(b=>b.style.display='inline-block');showView('home')})

// Offer form
document.getElementById('offerForm').addEventListener('submit',e=>{e.preventDefault();if(!currentUser){alert('Please login/register first');showView('login');return}const itemName=document.getElementById('itemName').value.trim();const quantity=parseInt(document.getElementById('quantity').value,10)||1;const pickup=document.getElementById('pickup').value.trim();const lat=parseFloat(document.getElementById('lat').value)||null;const lon=parseFloat(document.getElementById('lon').value)||null;const expiry=document.getElementById('expiry').value||null;const photo=document.getElementById('photo').value.trim()||null;const offer={id:uid(),userId:currentUser.id,itemName,quantity,pickup,lat,lon,expiry,photo,createdAt:Date.now()};addOffer(offer);if(lat!=null&&lon!=null){const suggestions=suggestNgos(lat,lon);renderNgos(suggestions)}else{renderNgos([])};document.getElementById('offerForm').reset()})

document.getElementById('geoBtn').addEventListener('click',()=>{if(!navigator.geolocation){alert('Geolocation not supported');return}navigator.geolocation.getCurrentPosition(pos=>{document.getElementById('lat').value=pos.coords.latitude;document.getElementById('lon').value=pos.coords.longitude},err=>{alert('Unable to get location')})})

// Initial boot
ensureNgos();renderOffers();renderNgos([]);showView('home')
