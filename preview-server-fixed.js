const http = require('http');
const fs = require('fs');
const path = require('path');

const products = [
  { id: 'kfc-bucket', name: 'Streetwise Bucket', restaurant: 'KFC', price: 115 },
  { id: 'kfc-burger', name: 'Zinger Burger', restaurant: 'KFC', price: 72 },
  { id: 'kfc-wings', name: 'Hot Wings', restaurant: 'KFC', price: 58 },
  { id: 'cm-pizza', name: 'Chickenman Special', restaurant: 'Chickenman', price: 98 },
  { id: 'cm-rice', name: 'Chicken Fried Rice', restaurant: 'Chickenman', price: 65 },
  { id: 'cm-wings', name: 'Chickenman Wings', restaurant: 'Chickenman', price: 68 },
];
const orders = [];
const adminEmail = 'bayiviellajude1738quansavage@gmail.com';

function body(req) {
  return new Promise((resolve, reject) => {
    let value = '';
    req.on('data', chunk => { value += chunk; });
    req.on('end', () => { try { resolve(value ? JSON.parse(value) : {}); } catch (error) { reject(error); } });
    req.on('error', reject);
  });
}
function json(res, status, data) { res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(data)); }
function deliveryFee(count) { if (count <= 0) return 0; if (count === 1) return 20; if (count === 2) return 40; if (count === 3) return 50; return count * 20; }

const server = http.createServer(async (req, res) => {
  if (req.url === '/api/state' && req.method === 'GET') {
    json(res, 200, { orders, activeProducts: products.length, awaitingConfirmation: orders.filter(order => order.status === 'received').length, estimatedSales: orders.reduce((sum, order) => sum + order.total, 0), email: adminEmail });
    return;
  }
  if (req.url === '/api/orders' && req.method === 'POST') {
    try {
      const payload = await body(req);
      const order = { ...payload, id: 'PLUG-' + Math.random().toString(36).slice(2, 8).toUpperCase(), status: 'received', createdAt: new Date().toISOString(), emailTarget: adminEmail };
      orders.unshift(order);
      json(res, 201, order);
    } catch { json(res, 400, { error: 'Invalid order payload' }); }
    return;
  }
  if (req.url.startsWith('/api/orders/') && req.method === 'PATCH') {
    const order = orders.find(item => item.id === req.url.split('/').pop());
    if (!order) { res.writeHead(404); res.end(); return; }
    const payload = await body(req);
    if (['received', 'processed', 'delivered', 'cancelled'].includes(payload.status)) order.status = payload.status;
    json(res, 200, order);
    return;
  }
  if (req.url === '/dashboard' || req.url === '/dashboard/') {
    let html = fs.readFileSync(path.join(__dirname, 'dashboard-v2.html'), 'utf8');
    const sync = `<script>(function(){async function sync(){try{var s=await fetch('/api/state',{cache:'no-store'}).then(function(r){return r.json()});var stats=document.querySelectorAll('.stat strong');if(stats[0])stats[0].textContent=s.orders.length;if(stats[1])stats[1].textContent=s.awaitingConfirmation;if(stats[2])stats[2].textContent=s.activeProducts;if(stats[3])stats[3].textContent='GH₵ '+s.estimatedSales.toFixed(2);var rows=document.querySelector('#overview .table tbody');if(rows)rows.innerHTML=s.orders.slice(0,6).map(function(o){return '<tr><td>#'+o.id+'</td><td>'+(o.customer&&o.customer.name||'Customer')+'<br><small>'+(o.items||[]).length+' items</small></td><td>GH₵'+Number(o.total||0).toFixed(2)+'</td><td><span class="badge">'+o.status+'</span></td></tr>'}).join('')||'<tr><td colspan="4">No orders yet</td></tr>';}catch(e){console.warn(e)}}sync();setInterval(sync,2500)})();</script>`;
    html = html.replace('<strong>12</strong>', '<strong>0</strong>').replace('<strong>3</strong>', '<strong>0</strong>').replace('<strong>24</strong>', '<strong>0</strong>').replace('<strong>GH₵ 1.8k</strong>', '<strong>GH₵ 0.00</strong>').replace('</body>', sync + '</body>');
    const mobileCheckoutFix = `<script>(function(){var form=document.getElementById('orderForm');if(!form)return;form.onsubmit=async function(e){e.preventDefault();var items=Object.keys(cart).map(function(i){return{name:data[i][1],restaurant:data[i][0],quantity:cart[i],unitPrice:data[i][2],total:data[i][2]*cart[i]}});var count=items.reduce(function(n,i){return n+i.quantity},0),subtotal=items.reduce(function(n,i){return n+i.total},0),delivery=count<=0?0:count===1?20:count===2?40:count===3?50:count*20;var customer={name:document.getElementById('name').value,phone:document.getElementById('phone').value,area:document.getElementById('area').value,address:document.getElementById('address').value,notes:document.getElementById('notes').value};var order=await fetch('/api/orders',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({customer:customer,items:items,subtotal:subtotal,delivery:delivery,total:subtotal+delivery,email:'bayiviellajude1738quansavage@gmail.com'})}).then(function(r){return r.json()});cart={};update();document.getElementById('orderModal').hidden=true;window.location.assign('https://wa.me/233501242319?text='+encodeURIComponent('NEW FOOD ORDER\\nOrder: '+order.id+'\\nName: '+customer.name+'\\nPhone: '+customer.phone+'\\nArea: '+customer.area+'\\nAddress: '+customer.address+'\\nItems: '+items.map(function(i){return i.name+' x'+i.quantity}).join(', ')+'\\nSubtotal: GH₵ '+subtotal.toFixed(2)+'\\nDelivery: GH₵ '+delivery.toFixed(2)+'\\nTotal: GH₵ '+(subtotal+delivery).toFixed(2)))}})();</script>`;
    html = html.replace('</body>', mobileCheckoutFix + '</body>');
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); res.end(html); return;
  }
  if (req.url === '/' || req.url === '/index.html') {
    let html = fs.readFileSync(path.join(__dirname, 'preview-v2.html'), 'utf8');
    const carousel = `<section class="food-carousel"><div><div class="eyebrow">TODAY'S CRAVINGS</div><h2>Pick your<br><i>next bite.</i></h2><p>Fresh picks from both kitchens, ready to plug into your order.</p><div class="carousel-controls"><button id="prev">←</button><button id="next">→</button><span id="dots">01 / 04</span></div></div><div class="carousel-stage"><div class="carousel-slide active" style="background-image:url('https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=900&q=85')"><b>CRISPY<br>CHICKEN</b></div><div class="carousel-slide" style="background-image:url('https://images.unsplash.com/photo-1579751626657-72bc17010498?auto=format&fit=crop&w=900&q=85')"><b>LOADED<br>PIZZA</b></div><div class="carousel-slide" style="background-image:url('https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=900&q=85')"><b>RICE<br>COMBOS</b></div><div class="carousel-slide" style="background-image:url('https://images.unsplash.com/photo-1567620832903-9fc6debc209f?auto=format&fit=crop&w=900&q=85')"><b>HOT<br>WINGS</b></div></div></section>`;
    const css = `<style>.nav{position:sticky;top:0;z-index:20;background:rgba(245,241,233,.95);backdrop-filter:blur(14px)}.food-carousel{display:grid;grid-template-columns:.7fr 1.3fr;gap:30px;align-items:center;padding:44px 0 58px;border-bottom:1px solid #ddd5c8}.food-carousel h2{font-size:43px;line-height:.9;margin:12px 0}.food-carousel p{color:#827b70;font-size:12px;line-height:1.5}.carousel-controls{display:flex;gap:8px;align-items:center;margin-top:25px}.carousel-controls button{width:31px;height:31px;border-radius:50%;background:#191816;color:#fff}.carousel-controls span{font-size:10px;color:#827b70}.carousel-stage{height:245px;display:flex;gap:12px;overflow:hidden}.carousel-slide{min-width:22%;height:245px;border-radius:8px;background-size:cover;background-position:center;display:flex;align-items:end;padding:18px;color:#fff;transition:.35s}.carousel-slide.active{min-width:62%}.drawer{z-index:40!important;overflow-y:auto!important}.toast{z-index:80!important}@media(max-width:800px){.food-carousel{grid-template-columns:1fr;padding:35px 0 45px}.carousel-stage,.carousel-slide{height:190px}.food-carousel h2{font-size:38px}}</style>`;
    const moveHero = html.indexOf('<section class="hero"');
    const heroEnd = html.indexOf('</section>', moveHero) + 10;
    const hero = html.slice(moveHero, heroEnd);
    html = html.slice(0, moveHero) + html.slice(heroEnd);
    html = html.replace('</header>', '</header>' + carousel);
    const how = html.indexOf('<section class="how"');
    html = html.slice(0, how) + hero + html.slice(how);
    const orderUi = `<style>.order-modal{position:fixed;inset:0;z-index:70;background:#19181699;display:grid;place-items:center;padding:18px}.order-modal[hidden]{display:none}.order-card{background:#f5f1e9;width:min(520px,100%);max-height:92vh;overflow:auto;border-radius:8px;padding:28px}.order-form{display:grid;gap:12px}.order-form label{display:grid;gap:5px;font-size:10px;text-transform:uppercase;color:#827b70}.order-form input,.order-form textarea{border:1px solid #ddd5c8;border-radius:4px;padding:11px;background:#fff;font:14px Arial}.order-form textarea{min-height:70px}.order-actions{display:flex;gap:10px}.order-actions button{flex:1}</style><div class="order-modal" id="orderModal" hidden><form class="order-card order-form" id="orderForm"><button type="button" class="close" id="closeOrder">×</button><div class="eyebrow">CHECKOUT DETAILS</div><h2>Where should we<br><i>send your order?</i></h2><p>Your details will be saved to the live order board and included in WhatsApp.</p><label>Full name<input id="name" required></label><label>Phone number<input id="phone" required></label><label>Delivery area<input id="area" required></label><label>Address or landmark<input id="address" required></label><label>Notes<textarea id="notes"></textarea></label><div class="order-actions"><button type="button" id="cancel">Keep shopping</button><button class="button primary" type="submit">Send to WhatsApp ↗</button></div></form></div>`;
    const js = `<script>(function(){var modal=document.getElementById('orderModal');var form=document.getElementById('orderForm');document.addEventListener('click',function(e){if(e.target.matches('.checkout')){e.preventDefault();e.stopImmediatePropagation();if(Object.keys(cart).length)modal.hidden=false;else plugToast('Your basket is empty')}},true);document.getElementById('closeOrder').onclick=document.getElementById('cancel').onclick=function(){modal.hidden=true};form.onsubmit=async function(e){e.preventDefault();var items=Object.keys(cart).map(function(i){return{name:data[i][1],restaurant:data[i][0],quantity:cart[i],unitPrice:data[i][2],total:data[i][2]*cart[i]}});var count=items.reduce(function(n,i){return n+i.quantity},0),subtotal=items.reduce(function(n,i){return n+i.total},0),delivery=count<=0?0:count===1?20:count===2?40:count===3?50:count*20;var customer={name:name.value,phone:phone.value,area:area.value,address:address.value,notes:notes.value};var order=await fetch('/api/orders',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({customer:customer,items:items,subtotal:subtotal,delivery:delivery,total:subtotal+delivery,email:'bayiviellajude1738quansavage@gmail.com'})}).then(function(r){return r.json()});var text='NEW FOOD ORDER\\nOrder: '+order.id+'\\nName: '+customer.name+'\\nPhone: '+customer.phone+'\\nArea: '+customer.area+'\\nAddress: '+customer.address+'\\nItems: '+items.map(function(i){return i.name+' x'+i.quantity}).join(', ')+'\\nSubtotal: GH₵ '+subtotal.toFixed(2)+'\\nDelivery: GH₵ '+delivery.toFixed(2)+'\\nTotal: GH₵ '+(subtotal+delivery).toFixed(2);window.open('https://wa.me/233501242319?text='+encodeURIComponent(text),'_blank');window.open('mailto:bayiviellajude1738quansavage@gmail.com?subject='+encodeURIComponent('Order '+order.id)+'&body='+encodeURIComponent(text),'_blank');cart={};update();modal.hidden=true;plugToast('Order '+order.id+' received and basket cleared ✦')};var slides=[].slice.call(document.querySelectorAll('.carousel-slide')),current=0;function show(n){current=(n+slides.length)%slides.length;slides.forEach(function(s,i){s.classList.toggle('active',i===current)});dots.textContent=String(current+1).padStart(2,'0')+' / 04'}prev.onclick=function(){show(current-1)};next.onclick=function(){show(current+1)};setInterval(function(){show(current+1)},5200)})();</script>`;
    const restoreCss = `<style>.drawer{z-index:40!important;overflow-y:auto!important;max-height:100vh}.item{display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center}.remove-item{grid-column:2;border:0!important;background:#fff0eb!important;color:#f4512a!important;border-radius:4px!important;padding:6px 9px!important;width:auto!important;height:auto!important;font-size:10px}.food-footer{margin:75px -24px 0;background:#191816;color:#fff;padding:38px 24px 25px;display:grid;grid-template-columns:1.5fr 1fr 1fr;gap:30px;border-radius:10px 10px 0 0}.food-footer h3{font-size:20px;margin:0 0 8px}.food-footer p,.food-footer a{color:#bdb6aa;font-size:12px;line-height:1.55}.food-footer a{display:block;margin:5px 0}.footer-kicker{color:#f3c84b!important;font-size:10px!important;letter-spacing:1.5px;text-transform:uppercase;font-weight:700}.footer-bottom{grid-column:1/-1;border-top:1px solid #3b3935;padding-top:18px;color:#8e887e;font-size:10px;display:flex;justify-content:space-between}@media(max-width:800px){.food-footer{margin:50px -18px 0;padding:30px 18px 20px;grid-template-columns:1fr 1fr;gap:22px}.food-footer>div:first-child{grid-column:1/-1}.footer-bottom{display:block;line-height:1.7}.footer-bottom span{display:block}.drawer{padding:90px 18px 24px!important}.order-card{padding:22px!important}}@media(min-width:801px) and (max-width:1200px){main{padding-left:28px!important;padding-right:28px!important}.grid{grid-template-columns:repeat(2,1fr)!important}}@media(min-width:1400px){main{max-width:1280px!important}.grid{grid-template-columns:repeat(4,1fr)!important}}</style>`;
    const footer = `<footer class="food-footer"><div><div class="footer-kicker">KFC × Chickenman</div><h3>Good food, plugged in.</h3><p>Your independent ordering plug for tasty moments, easy WhatsApp orders and food worth sharing.</p></div><div><div class="footer-kicker">Explore</div><a href="#menu">All dishes</a><a href="#menu">KFC favourites</a><a href="#menu">Chickenman favourites</a></div><div><div class="footer-kicker">Need a hand?</div><a href="https://wa.me/233501242319">WhatsApp: 050 124 2319</a><a href="#top">Back to top ↑</a></div><div class="footer-bottom"><span>© 2026 KFC — Chicken Man Plug</span><span>Powered by Hybrid Inc. ✦</span></div></footer>`;
    html = html.replace('</main>', footer + '</main>');
    html = html.replace('</style>', '</style>' + css + restoreCss).replace('</body>', orderUi + js + '<script>(function(){function addRemove(){document.querySelectorAll(".item").forEach(function(row){if(row.querySelector(".remove-item"))return;var title=row.querySelector("b")?.textContent.trim();var index=data.findIndex(function(item){return item[1]===title});if(index<0)return;var btn=document.createElement("button");btn.className="remove-item";btn.textContent="Remove";btn.setAttribute("onclick","while(cart["+index+"])cart["+index+"]--;update();plugToast(\'Removed from your basket\')");row.appendChild(btn)})}var items=document.getElementById("items");if(items)new MutationObserver(addRemove).observe(items,{childList:true});document.addEventListener("click",function(e){if(e.target.matches(".cart")){setTimeout(addRemove,50)}})})();</script></body>');
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); res.end(html); return;
  }
  res.writeHead(404); res.end('Not found');
});
server.listen(3000, '127.0.0.1', () => console.log('Preview running at http://localhost:3000'));
