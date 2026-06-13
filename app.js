/* Client-side SPA prototype
   - simple register/login stored in localStorage (prototype only)
   - donors create offers with location
   - suggestions: match by simple Haversine distance to NGO fixtures
*/
const STORAGE = {
  USERS: 'fw_users_v1',
  NGOS: 'fw_ngos_v1'
}

const API_BASE = 'http://localhost:4000/api'

// Offers now live on backend; helper API calls
async function apiLoadOffers(){
  try{const res=await fetch(API_BASE+'/offers');if(!res.ok)throw new Error('Failed');return await res.json()}catch(e){console.error(e);return []}}
async function apiAddOffer(o){
  try{
    const headers={'Content-Type':'application/json'};const token=localStorage.getItem('token');if(token)headers['Authorization']='Bearer '+token;
    const res=await fetch(API_BASE+'/offers',{method:'POST',headers,body:JSON.stringify(o)});if(!res.ok)throw new Error('Create failed');return await res.json()
  }catch(e){console.error(e);throw e}}
async function apiRemoveOffer(id){
  try{const headers={};const token=localStorage.getItem('token');if(token)headers['Authorization']='Bearer '+token;const res=await fetch(API_BASE+'/offers/'+encodeURIComponent(id),{method:'DELETE',headers});if(!res.ok)throw new Error('Delete failed');return true}catch(e){console.error(e);return false}}
async function apiAcceptOffer(id, ngoId){
  try{const headers={'Content-Type':'application/json'};const token=localStorage.getItem('token');if(token)headers['Authorization']='Bearer '+token;const res=await fetch(API_BASE+`/offers/${encodeURIComponent(id)}/accept`,{method:'POST',headers,body:JSON.stringify({ngoId})});if(!res.ok)throw new Error('Accept failed');return await res.json()}catch(e){console.error(e);throw e}}


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
async function loadOffers(){return await apiLoadOffers()}
function saveOffers(){/* noop; server persists */}
async function addOffer(o){await apiAddOffer(o);await renderOffers()}
async function removeOffer(id){await apiRemoveOffer(id);await renderOffers()}

/* --- Render --- */
async function renderOffers(){const root=document.getElementById('offers');const offers=await loadOffers();if(!offers||!offers.length){root.innerHTML='<p class="small">No offers yet.</p>';return}root.innerHTML='';offers.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).forEach(o=>{const el=document.createElement('div');el.className='offer';const img=document.createElement('img');img.src=o.photo||'https://via.placeholder.com/96?text=Food';const meta=document.createElement('div');meta.className='meta';const title=document.createElement('div');title.innerHTML=`<strong>${escapeHtml(o.itemName)}</strong> <span class="small">(${o.quantity})</span>`;const info=document.createElement('div');info.className='small';const expiry=o.expiry?new Date(o.expiry).toLocaleString():'N/A';info.innerHTML=`<div class="timestamp">Created: ${new Date(o.createdAt).toLocaleString()}</div><div>Expiry: ${expiry}</div><div>Pickup: ${escapeHtml(o.pickup||'')}</div>`;const actions=document.createElement('div');const removeBtn=document.createElement('button');removeBtn.textContent='Remove';removeBtn.style.background='#e53e3e';removeBtn.onclick=()=>{if(confirm('Remove this offer?')) removeOffer(o.id)};actions.appendChild(removeBtn);meta.appendChild(title);meta.appendChild(info);meta.appendChild(actions);el.appendChild(img);el.appendChild(meta);root.appendChild(el)})}

function escapeHtml(s){return String(s||'').replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]))}

/* --- NGOs suggestions by distance --- */
function haversine(lat1,lon1,lat2,lon2){function toRad(d){return d*Math.PI/180}const R=6371;const dLat=toRad(lat2-lat1);const dLon=toRad(lon2-lon1);const a=Math.sin(dLat/2)*Math.sin(dLat/2)+Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)*Math.sin(dLon/2);const c=2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));return R*c}

function suggestNgos(lat,lon,limit=5){ensureNgos();const ngos=read(STORAGE.NGOS).map(n=>({...n,distance:haversine(lat,lon,n.lat,n.lon)})).sort((a,b)=>a.distance-b.distance);return ngos.slice(0,limit)}

function renderNgos(list){const root=document.getElementById('ngos');if(!list||!list.length){root.innerHTML='<p class="small">No suggestions yet.</p>';return}root.innerHTML='';list.forEach(n=>{const el=document.createElement('div');el.className='offer';el.innerHTML=`<div class="meta"><strong>${escapeHtml(n.name)}</strong><div class="small">${escapeHtml(n.contact)}</div><div class="small">Distance: ${n.distance.toFixed(2)} km</div></div>`;root.appendChild(el)})}

/* --- Receiver / NGO interactions --- */
async function renderReceiverOffers(){const root=document.getElementById('receiverOffers');if(!root){return}const offers=await loadOffers();const open=offers.filter(o=>!o.acceptedBy).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));if(!open.length){root.innerHTML='<p class="small">No available offers right now.</p>';return}root.innerHTML='';open.forEach(o=>{const el=document.createElement('div');el.className='offer';const img=document.createElement('img');img.src=o.photo||'https://via.placeholder.com/96?text=Food';const meta=document.createElement('div');meta.className='meta';const title=document.createElement('div');title.innerHTML=`<strong>${escapeHtml(o.itemName)}</strong> <span class="small">(${o.quantity})</span>`;const info=document.createElement('div');info.className='small';const expiry=o.expiry?new Date(o.expiry).toLocaleString():'N/A';info.innerHTML=`<div class="timestamp">Created: ${new Date(o.createdAt).toLocaleString()}</div><div>Expiry: ${expiry}</div><div>Pickup: ${escapeHtml(o.pickup||'')}</div><div class="small">Donor ID: ${escapeHtml(o.userId)}</div>`;const actions=document.createElement('div');const acceptBtn=document.createElement('button');acceptBtn.textContent='Accept';acceptBtn.style.background='#2b6cb0';acceptBtn.onclick=async ()=>{if(!currentUser||currentUser.role!=='ngo'){alert('Please login as NGO to accept');return}if(confirm('Accept this offer?')){await apiAcceptOffer(o.id,currentUser.id);await renderReceiverOffers();alert('Offer accepted — contact donor to arrange pickup.')}};actions.appendChild(acceptBtn);meta.appendChild(title);meta.appendChild(info);meta.appendChild(actions);el.appendChild(img);el.appendChild(meta);root.appendChild(el)})}

async function acceptOffer(id){await apiAcceptOffer(id,currentUser.id);await renderReceiverOffers();alert('Offer accepted — contact donor to arrange pickup.')}

/* --- SPA navigation & auth wiring --- */
let currentUser=null
function showView(id){document.querySelectorAll('.view').forEach(v=>v.style.display=v.id===id?'block':'none');document.querySelectorAll('button[data-view]').forEach(b=>b.disabled=b.getAttribute('data-view')===id)}

document.querySelectorAll('button[data-view]').forEach(b=>b.addEventListener('click',e=>{showView(b.getAttribute('data-view'))}))

document.getElementById('registerForm').addEventListener('submit',e=>{e.preventDefault();try{const u={id:uid(),name:document.getElementById('regName').value.trim(),email:document.getElementById('regEmail').value.trim(),password:document.getElementById('regPass').value,role:document.getElementById('regRole').value};register(u);alert('Registered — please login');showView('login')}catch(err){alert(err.message)}})

document.getElementById('loginForm').addEventListener('submit',e=>{e.preventDefault();const email=document.getElementById('loginEmail').value.trim();const pass=document.getElementById('loginPass').value;const user=login(email,pass);if(!user){alert('Invalid credentials');return}else{currentUser=user;onLoginForRole()}})

function onLogin(){
  document.getElementById('logoutBtn').style.display='inline-block';
  document.querySelectorAll('button[data-view]').forEach(b=>b.style.display=b.getAttribute('data-view')==='home'?'inline-block':'none');
  document.getElementById('userInfo').textContent=`Signed in as ${currentUser.name} (${currentUser.role})`;
  showView('dashboard');
  renderOffers();
}

function onLoginForRole(){
  document.getElementById('logoutBtn').style.display='inline-block';
  document.querySelectorAll('button[data-view]').forEach(b=>b.style.display='inline-block');
  document.getElementById('userInfo').textContent=`Signed in as ${currentUser.name} (${currentUser.role})`;
  if(currentUser.role==='ngo'){
    showView('receiver');
    renderReceiverOffers();
  } else {
    showView('dashboard');
    renderOffers();
  }
}

document.getElementById('logoutBtn').addEventListener('click',()=>{currentUser=null;document.getElementById('logoutBtn').style.display='none';document.querySelectorAll('button[data-view]').forEach(b=>b.style.display='inline-block');showView('home')})

// Offer form
document.getElementById('offerForm').addEventListener('submit',e=>{e.preventDefault();if(!currentUser){alert('Please login/register first');showView('login');return}const itemName=document.getElementById('itemName').value.trim();const quantity=parseInt(document.getElementById('quantity').value,10)||1;const pickup=document.getElementById('pickup').value.trim();const lat=parseFloat(document.getElementById('lat').value)||null;const lon=parseFloat(document.getElementById('lon').value)||null;const expiry=document.getElementById('expiry').value||null;const photo=document.getElementById('photo').value.trim()||null;const offer={id:uid(),userId:currentUser.id,itemName,quantity,pickup,lat,lon,expiry,photo,createdAt:Date.now()};addOffer(offer);if(lat!=null&&lon!=null){const suggestions=suggestNgos(lat,lon);renderNgos(suggestions)}else{renderNgos([])};document.getElementById('offerForm').reset()})

// Google login popup
document.getElementById('googleLogin').addEventListener('click',()=>{
  const w=window.open(API_BASE+'/auth/google','_blank','width=600,height=600');
});

// receive token from popup
window.addEventListener('message', (ev)=>{
  try{
    const data = ev.data;
    if(data && data.token){
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      currentUser = data.user;
      onLoginForRole();
    }
  }catch(e){console.error(e)}
});

document.getElementById('geoBtn').addEventListener('click',()=>{if(!navigator.geolocation){alert('Geolocation not supported');return}navigator.geolocation.getCurrentPosition(pos=>{document.getElementById('lat').value=pos.coords.latitude;document.getElementById('lon').value=pos.coords.longitude},err=>{alert('Unable to get location')})})

// Initial boot
ensureNgos();renderOffers();renderNgos([]);showView('home')
