import React, { useEffect, useMemo, useState } from "react";
import {
  BrowserRouter, Routes, Route, Link, NavLink,
  useNavigate, useLocation
} from "react-router-dom";
import {
  ChefHat, Search, ShoppingBag, ShoppingCart, Home,
  ClipboardList, QrCode, Star, Plus, Minus, Trash2,
  ArrowRight, ArrowLeft, Sparkles, Heart, Menu as MenuIcon,
  X, UserRound, CheckCircle2, Clock, Utensils, LogOut,
  LayoutDashboard, RefreshCw, MessageSquare, TrendingUp
} from "lucide-react";
import QRScanner from "./components/QRScanner.jsx";
import { parseTableQR } from "./components/qrUtils.js";
import { loginUser, registerUser, getFoods, createOrder } from "./services/api.js";
import "./index.css";
const demoFoods = [
  {id:"demo-1",name:"Chicken Burger",category:"Burgers",price:149,rating:4.8,reviews:124,score:4.8,image:"https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=85",description:"Grilled chicken, fresh lettuce, melted cheese and our signature sauce.",tags:["Bestseller"]},
  {id:"demo-2",name:"Paneer Pizza",category:"Pizza",price:229,rating:4.6,reviews:98,score:4.7,image:"https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=900&q=85",description:"Stone-baked pizza topped with paneer, vegetables and mozzarella.",tags:["Vegetarian"]},
  {id:"demo-3",name:"Chicken Biryani",category:"Biryani",price:199,rating:4.7,reviews:86,score:4.6,image:"https://images.unsplash.com/photo-1563379091339-03246963d96c?auto=format&fit=crop&w=900&q=85",description:"Fragrant basmati rice, traditional spices and tender chicken.",tags:["Popular"]},
  {id:"demo-4",name:"Masala Dosa",category:"South Indian",price:89,rating:4.7,reviews:65,score:4.6,image:"https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=900&q=85",description:"Golden crispy dosa with potato masala and coconut chutney.",tags:["Vegetarian"]},
  {id:"demo-5",name:"French Fries",category:"Snacks",price:99,rating:4.3,reviews:74,score:4.4,image:"https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=900&q=85",description:"Crispy golden fries seasoned and served fresh.",tags:["Quick bite"]},
  {id:"demo-6",name:"Chocolate Shake",category:"Drinks",price:129,rating:4.5,reviews:51,score:4.5,image:"https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=900&q=85",description:"A rich, creamy chocolate shake for a sweet finish.",tags:["Cold drink"]},
  {id:"demo-7",name:"Margherita Pizza",category:"Pizza",price:179,rating:4.6,reviews:82,score:4.5,image:"https://images.unsplash.com/photo-1579751626657-72bc17010498?auto=format&fit=crop&w=900&q=85",description:"Classic tomato sauce, mozzarella and fresh basil.",tags:["Vegetarian"]},
  {id:"demo-8",name:"Veg Burger",category:"Burgers",price:119,rating:4.4,reviews:63,score:4.3,image:"https://images.unsplash.com/photo-1520072959219-c595dc870360?auto=format&fit=crop&w=900&q=85",description:"A crunchy vegetable patty with crisp lettuce and house sauce.",tags:["Vegetarian"]}
];
const categories = ["All","Burgers","Pizza","Biryani","Snacks","South Indian","Drinks"];
const money = n => "₹" + Number(n || 0).toLocaleString("en-IN");
const foodId = f => String(f._id ?? f.id);
const foodPrice = f => Number(f.price ?? f.amount ?? 0);
const foodImage = f => f.image || f.imageUrl || f.imageURL || f.photo || demoFoods[0].image;
const foodScore = f => Number(f.score ?? f.rating ?? 0);
const foodCategory = f => f.category || "Other";
function App() {
  const [foods,setFoods] = useState(demoFoods);
  const [cart,setCart] = useState([]);
  const [table,setTable] = useState("12");
  const [orders,setOrders] = useState([]);
  const [favorites,setFavorites] = useState([]);
  const [user,setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("foodsense_user") || "null"); }
    catch { return null; }
  });
  const [loading,setLoading] = useState(true);
  const [apiMessage,setApiMessage] = useState("");
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const result = await getFoods();
        const data = Array.isArray(result)
          ? result
          : result?.foods || result?.data?.foods || result?.data;

        if (alive && Array.isArray(data) && data.length > 0) {
          setFoods(data);
          setApiMessage("");
        } else if (alive) {
          setApiMessage("The live menu returned no foods. Sample items are displayed for browsing only.");
        }
      } catch (e) {
        if (alive) {
          setApiMessage("Showing sample menu because the live menu API is unavailable. Sample items cannot be ordered.");
        }
        console.warn("Food menu API:", e);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);
  const add = food => {
    const id = foodId(food);

    // Only MongoDB-backed menu items can be ordered.
    if (!/^[a-f\d]{24}$/i.test(id)) {
      setApiMessage("This is a sample menu item, not a live database item. Wait for the live menu to load before ordering.");
      return;
    }

    setCart(old => {
      const found = old.find(item => foodId(item) === id);
      return found
        ? old.map(item => foodId(item) === id
          ? { ...item, quantity: item.quantity + 1 }
          : item)
        : [...old, { ...food, quantity: 1 }];
    });
  };
  const changeQty = (id,delta) => setCart(old =>
    old.map(x => foodId(x) === id ? {...x,quantity:x.quantity+delta} : x)
      .filter(x => x.quantity > 0)
  );
  const remove = id => setCart(old => old.filter(x => foodId(x) !== id));
  const count = cart.reduce((sum,x) => sum + x.quantity,0);
  const subtotal = cart.reduce((sum,x) => sum + foodPrice(x)*x.quantity,0);
  const toggleFavorite = id => setFavorites(old =>
    old.includes(id) ? old.filter(x => x !== id) : [...old,id]
  );
  const login = async credentials => {
    const result = await loginUser(credentials);
    const data = result?.data || result;
    if (data?.success === false) throw new Error(data.message || "Login failed");
    const account = data?.user || data?.data?.user || data?.data || null;
    if (!account) throw new Error("Login response did not contain a user.");
    setUser(account);
    localStorage.setItem("foodsense_user",JSON.stringify(account));
    return account;
  };
  const logout = () => {
    setUser(null);
    localStorage.removeItem("foodsense_user");
    localStorage.removeItem("foodsense_token");
  };
  const placeOrder = async paymentMethod => {
    if (!cart.length) throw new Error("Your cart is empty.");

    const payload = {
      items: cart.map(item => {
        const id = item._id ?? item.id;

        if (!id || !/^[a-f\d]{24}$/i.test(String(id))) {
          throw new Error(
            `${item.name} has no valid live food ID. Remove it and add the item again after the live menu loads.`
          );
        }

        return {
          foodId: String(id),
          name: item.name,
          quantity: item.quantity,
          price: foodPrice(item)
        };
      }),
      tableNumber: table,
      totalAmount: subtotal,
      total: subtotal,
      paymentMethod
    };

    const result = await createOrder(payload);
    const data = result?.data || result;

    if (data?.success === false) {
      throw new Error(data.message || "Could not place order.");
    }

    const order = data?.order || data?.data?.order || data?.data || data;

    setOrders(old => [{
      ...order,
      items: cart.map(item => ({ ...item })),
      total: subtotal,
      tableNumber: table,
      status: order?.status || "Placed",
      createdAt: new Date().toISOString(),
      localId: Date.now()
    }, ...old]);

    setCart([]);
    return order;
  };
  return (
    <BrowserRouter>
      <div className="app-shell">
        <Header count={count} user={user} logout={logout}/>
        <Routes>
          <Route path="/" element={<HomePage foods={foods}/>}/>
          <Route path="/menu" element={<MenuPage foods={foods} loading={loading} apiMessage={apiMessage} add={add} favorites={favorites} toggleFavorite={toggleFavorite}/>}/>
          <Route path="/food/:id" element={<FoodDetail foods={foods} add={add}/>}/>
          <Route path="/scan" element={<ScanPage table={table} setTable={setTable}/>}/>
          <Route path="/cart" element={<CartPage cart={cart} changeQty={changeQty} remove={remove} subtotal={subtotal}/>}/>
          <Route path="/checkout" element={<CheckoutPage cart={cart} subtotal={subtotal} placeOrder={placeOrder} table={table}/>}/>
          <Route path="/order-confirmed" element={<ConfirmedPage orders={orders}/>}/>
          <Route path="/orders" element={<OrdersPage orders={orders}/>}/>
          <Route path="/review" element={<ReviewPage foods={foods}/>}/>
          <Route path="/profile" element={<ProfilePage user={user} logout={logout}/>}/>
          <Route path="/login" element={<AuthPage mode="login" onAuth={login}/>}/>
          <Route path="/register" element={<AuthPage mode="register" onAuth={async values => {
            const result = await registerUser(values);
            const data = result?.data || result;
            if (data?.success === false) throw new Error(data.message || "Registration failed");
            return login({email:values.email,password:values.password});
          }}/>}/>
          <Route path="/manager/*" element={<ManagerPage foods={foods} orders={orders}/>}/>
          <Route path="*" element={<NotFound/>}/>
        </Routes>
        <Footer/>
      </div>
    </BrowserRouter>
  );
}
function Header({count,user,logout}) {
  const [open,setOpen] = useState(false);
  const loc = useLocation();
  useEffect(() => setOpen(false),[loc.pathname]);
  return <>
    <header className="topbar">
      <Link to="/" className="brand">
        <span className="brand-mark"><ChefHat size={25}/></span>
        <span><b>FoodSense <em>AI</em></b><small>Good food. Better insights.</small></span>
      </Link>
      <nav className="desktop-nav">
        <NavLink to="/" end>Home</NavLink>
        <NavLink to="/menu">Menu</NavLink>
        <NavLink to="/scan">Scan QR</NavLink>
        <NavLink to="/orders">My Orders</NavLink>
        <NavLink to="/manager">Manager</NavLink>
      </nav>
      <div className="top-actions">
        <Link to="/cart" className="round-action" aria-label="Shopping cart">
          <ShoppingCart size={20}/>{count > 0 && <span className="cart-count">{count}</span>}
        </Link>
        <Link to={user ? "/profile" : "/login"} className="profile-link"><UserRound size={19}/><span>{user?.name || "Account"}</span></Link>
        <button className="mobile-menu-button" onClick={()=>setOpen(!open)} aria-label="Toggle navigation">{open?<X/>:<MenuIcon/>}</button>
      </div>
    </header>
    {open && <nav className="mobile-menu">
      <Link to="/">Home</Link><Link to="/menu">Menu</Link><Link to="/scan">Scan QR</Link>
      <Link to="/orders">My Orders</Link><Link to="/cart">Cart ({count})</Link>
      <Link to="/manager">Manager</Link><Link to="/profile">Account</Link>
    </nav>}
  </>;
}
function HomePage({foods}) {
  return <main>
    <section className="hero">
      <div className="hero-copy">
        <span className="eyebrow"><Sparkles size={15}/> A smarter way to dine</span>
        <h1>Good food.<br/><span>Great feelings.</span></h1>
        <p>Discover your next favourite dish, order from your table, and help us make every meal better with AI-powered customer feedback.</p>
        <div className="hero-actions">
          <Link to="/menu" className="btn btn-primary">Explore menu <ArrowRight size={17}/></Link>
          <Link to="/scan" className="btn btn-light"><QrCode size={17}/> Scan table QR</Link>
        </div>
        <div className="hero-stats">
          <div><strong>4.8 <Star size={16} fill="currentColor"/></strong><span>Guest favourites</span></div>
          <div><strong>AI</strong><span>Food insights</span></div>
          <div><strong>Fresh</strong><span>Made to order</span></div>
        </div>
      </div>
      <div className="hero-visual">
        <img src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1100&q=85" alt="Freshly prepared burger"/>
        <div className="hero-note"><span className="note-icon"><TrendingUp size={20}/></span><span><small>Customer favourite</small><b>Made with care, served with love</b></span></div>
      </div>
    </section>
    <section className="section-wrap">
      <div className="section-title"><div><span className="eyebrow">THE CROWD FAVOURITES</span><h2>Worth every bite.</h2></div><Link to="/menu" className="text-link">View full menu <ArrowRight size={16}/></Link></div>
      <div className="food-grid home-food-grid">
        {foods.slice(0,4).map((food,i)=><FoodCard key={foodId(food)} food={food} rank={i+1}/>)}
      </div>
    </section>
    <section className="steps-section">
      <div className="section-title"><div><span className="eyebrow">SIMPLE BY DESIGN</span><h2>Your table, your way.</h2></div></div>
      <div className="steps-grid">
        <Step number="01" icon={<QrCode/>} title="Scan your table" text="Open the menu using the QR code at your table."/>
        <Step number="02" icon={<Utensils/>} title="Choose your food" text="Explore dishes, discover favourites and add to cart."/>
        <Step number="03" icon={<ShoppingBag/>} title="Place your order" text="Review your order and send it to the restaurant."/>
        <Step number="04" icon={<MessageSquare/>} title="Share feedback" text="Tell us what you loved and help improve food rankings."/>
      </div>
    </section>
    <section className="ai-banner"><div className="ai-banner-icon"><Sparkles size={28}/></div><div><span>FOODSENSE AI</span><h2>Your feedback makes the menu smarter.</h2><p>Customer ratings and reviews help restaurants understand what diners love.</p></div><Link to="/review" className="btn btn-light">Share feedback <ArrowRight size={16}/></Link></section>
  </main>;
}
function Step({number,icon,title,text}) {
  return <article className="step-card"><span className="step-number">{number}</span><div className="step-icon">{icon}</div><h3>{title}</h3><p>{text}</p></article>;
}
function FoodCard({food,rank,favorites=[],toggleFavorite=()=>{},add=()=>{}}) {
  const id=foodId(food);
  const [added,setAdded]=useState(false);
  return <article className="food-card">
    <Link to={"/food/"+encodeURIComponent(id)} className="food-image">
      <img src={foodImage(food)} alt={food.name} loading="lazy" onError={e=>{e.currentTarget.src=demoFoods[0].image;}}/>
      {rank<=3 && <span className="rank-label"><Sparkles size={12}/> #{rank} favourite</span>}
      <button className={"favorite-button "+(favorites.includes(id)?"is-favorite":"")} aria-label="Toggle favourite" onClick={e=>{e.preventDefault();e.stopPropagation();toggleFavorite(id);}}><Heart size={18} fill={favorites.includes(id)?"currentColor":"none"}/></button>
    </Link>
    <div className="food-card-body">
      <span className="food-category">{foodCategory(food)}</span>
      <Link to={"/food/"+encodeURIComponent(id)}><h3>{food.name}</h3></Link>
      <p className="food-description">{food.description || "Freshly prepared with quality ingredients."}</p>
      <div className="food-rating"><Star size={15} fill="currentColor"/><b>{food.rating ?? food.score ?? "New"}</b><span>({food.reviews ?? 0} reviews)</span></div>
      <div className="food-card-bottom"><strong className="food-price">{money(foodPrice(food))}</strong><button className="add-button" onClick={()=>{add(food);setAdded(true);setTimeout(()=>setAdded(false),1000);}}>{added?<CheckCircle2 size={16}/>:<Plus size={16}/>} {added?"Added":"Add"}</button></div>
    </div>
  </article>;
}
function MenuPage({foods,loading,apiMessage,add,favorites,toggleFavorite}) {
  const [category,setCategory]=useState("All");
  const [search,setSearch]=useState("");
  const [sort,setSort]=useState("score");
  const list=useMemo(()=>foods.filter(f=>(category==="All"||foodCategory(f).toLowerCase()===category.toLowerCase()) && (f.name||"").toLowerCase().includes(search.toLowerCase())).sort((a,b)=>sort==="price"?foodPrice(a)-foodPrice(b):sort==="rating"?Number(b.rating||0)-Number(a.rating||0):foodScore(b)-foodScore(a)),[foods,category,search,sort]);
  return <main className="page-wrap">
    <div className="page-heading"><div><span className="eyebrow">MADE FRESH FOR YOU</span><h1>Our menu</h1><p>Find your favourite, or discover something new.</p></div><div className="live-pill"><span/> Menu collection</div></div>
    {apiMessage && <div className="notice"><RefreshCw size={15}/>{apiMessage}</div>}
    <div className="menu-toolbar"><label className="search-box"><Search size={19}/><input placeholder="Search dishes..." value={search} onChange={e=>setSearch(e.target.value)}/>{search&&<button onClick={()=>setSearch("")}><X size={16}/></button>}</label><select aria-label="Sort dishes" value={sort} onChange={e=>setSort(e.target.value)}><option value="score">AI recommended</option><option value="rating">Highest rated</option><option value="price">Price: low to high</option></select></div>
    <div className="category-pills">{categories.map(c=><button key={c} className={category===c?"selected":""} onClick={()=>setCategory(c)}>{c}</button>)}</div>
    <div className="results-row"><h2>{category==="All"?"Customer favourites":category}</h2><span>{loading?"Loading menu…":`${list.length} dishes`}</span></div>
    {list.length ? <div className="food-grid">{list.map((f,i)=><FoodCard key={foodId(f)} food={f} rank={i+1} add={add} favorites={favorites} toggleFavorite={toggleFavorite}/>)}</div> : <Empty title="No dishes found" text="Try a different search or category." action={<button className="btn btn-primary" onClick={()=>{setSearch("");setCategory("All");}}>Clear filters</button>}/>}
  </main>;
}
function FoodDetail({foods,add}) {
  const {id}=useLocation();
  const navigate=useNavigate();
  const food=foods.find(f=>foodId(f)===decodeURIComponent(window.location.pathname.split("/").pop()||"")) || foods[0];
  if(!food) return <Empty title="Dish not found" text="Return to the menu to explore available dishes." action={<Link to="/menu" className="btn btn-primary">Browse menu</Link>}/>;
  return <main className="page-wrap"><button className="back-button" onClick={()=>navigate(-1)}><ArrowLeft size={17}/> Back</button><div className="detail-layout"><img className="detail-image" src={foodImage(food)} alt={food.name}/><div className="detail-copy"><span className="eyebrow">{foodCategory(food)}</span><h1>{food.name}</h1><div className="food-rating"><Star size={17} fill="currentColor"/><b>{food.rating ?? food.score ?? "New"}</b><span>({food.reviews ?? 0} reviews)</span></div><strong className="detail-price">{money(foodPrice(food))}</strong><p>{food.description || "Prepared fresh using quality ingredients."}</p><div className="detail-tags">{(food.tags||["Made fresh","Customer favourite"]).map(t=><span key={t}>{t}</span>)}</div><button className="btn btn-primary" onClick={()=>add(food)}><Plus size={17}/> Add to cart</button><Link className="text-link" to="/cart">View cart <ArrowRight size={16}/></Link></div></div></main>;
}
function ScanPage({table,setTable}) {
  const [scanning,setScanning]=useState(false);
  const [error,setError]=useState("");
  const navigate=useNavigate();
  const handleScan=text=>{
    try { const result=parseTableQR(text); if(!result?.tableNumber) throw new Error("Invalid table QR"); setTable(String(result.tableNumber)); setError(""); setScanning(false); navigate("/menu"); }
    catch { setError("That QR code is not a recognised FoodSense table code. You can enter your table number below."); }
  };
  return <main className="center-page"><section className="form-card scan-card"><Link className="back-link" to="/"><ArrowLeft size={16}/> Back home</Link><div className="large-icon"><QrCode size={30}/></div><span className="eyebrow">WELCOME TO FOODSENSE</span><h1>Scan your table</h1><p>Scan the restaurant QR code to start your order, or enter your table number manually.</p>{scanning?<><QRScanner onScan={handleScan}/><button className="btn btn-light full-width" onClick={()=>setScanning(false)}>Cancel scanning</button></>:<button className="btn btn-primary full-width" onClick={()=>{setError("");setScanning(true);}}><QrCode size={18}/> Open camera scanner</button>}{error&&<div className="error-message">{error}</div>}<div className="separator"><span>OR ENTER MANUALLY</span></div><label className="field-label">Table number<input value={table} onChange={e=>setTable(e.target.value)} placeholder="e.g. 12"/></label><button className="btn btn-dark full-width" onClick={()=>table.trim()?navigate("/menu"):setError("Enter your table number to continue.")}>Continue to menu <ArrowRight size={17}/></button></section></main>;
}
function CartPage({cart,changeQty,remove,subtotal}) {
  return <main className="page-wrap"><div className="page-heading"><div><span className="eyebrow">YOUR SELECTION</span><h1>Your cart</h1><p>Everything looks better when it is made to order.</p></div></div>{!cart.length?<Empty title="Your cart is waiting" text="Explore the menu and add a dish you love." action={<Link to="/menu" className="btn btn-primary">Explore menu <ArrowRight size={16}/></Link>}/>:<div className="cart-layout"><div className="cart-items">{cart.map(item=><article className="cart-item" key={foodId(item)}><img src={foodImage(item)} alt={item.name}/><div className="cart-item-info"><span className="food-category">{foodCategory(item)}</span><h3>{item.name}</h3><strong>{money(foodPrice(item))}</strong><div className="quantity-control"><button onClick={()=>changeQty(foodId(item),-1)} aria-label="Decrease quantity"><Minus size={14}/></button><span>{item.quantity}</span><button onClick={()=>changeQty(foodId(item),1)} aria-label="Increase quantity"><Plus size={14}/></button></div></div><div className="cart-item-end"><b>{money(foodPrice(item)*item.quantity)}</b><button className="remove-button" onClick={()=>remove(foodId(item))}><Trash2 size={16}/> Remove</button></div></article>)}</div><OrderSummary subtotal={subtotal}><Link to="/checkout" className="btn btn-primary full-width">Continue to checkout <ArrowRight size={16}/></Link><Link to="/menu" className="text-link centered">Add more dishes</Link></OrderSummary></div>}</main>;
}
function OrderSummary({subtotal,children}) {
  return <aside className="summary-card"><h2>Order summary</h2><div className="summary-line"><span>Subtotal</span><b>{money(subtotal)}</b></div><div className="summary-line"><span>Service charge</span><span>₹0</span></div><div className="summary-line"><span>Taxes</span><span>As applicable</span></div><div className="summary-total"><span>Total</span><strong>{money(subtotal)}</strong></div><p className="summary-note">Final taxes or charges may be calculated by the restaurant.</p>{children}</aside>;
}
function CheckoutPage({cart,subtotal,placeOrder,table}) {
  const [method,setMethod]=useState("Pay at counter");
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const navigate=useNavigate();
  const submit=async()=>{
    if(!cart.length){setError("Your cart is empty.");return;}
    setBusy(true);setError("");
    try { await placeOrder(method); navigate("/order-confirmed"); }
    catch(e){setError(e?.response?.data?.message||e.message||"Unable to place order. Check your backend connection.");}
    finally{setBusy(false);}
  };
  return <main className="page-wrap"><div className="page-heading"><div><span className="eyebrow">ALMOST THERE</span><h1>Checkout</h1><p>Review your selection before placing the order.</p></div></div>{!cart.length?<Empty title="Nothing to check out" text="Add a dish to your cart first." action={<Link to="/menu" className="btn btn-primary">Browse menu</Link>}/>:<div className="cart-layout"><section className="form-card"><h2>Order details</h2><div className="table-info"><QrCode size={19}/><span>Table number</span><strong>{table||"Not set"}</strong></div><h3>Payment preference</h3><div className="payment-options">{["Pay at counter","Cash","UPI"].map(x=><button key={x} className={method===x?"payment-option chosen":"payment-option"} onClick={()=>setMethod(x)}><span className="radio-dot"/>{x}</button>)}</div><p className="muted-small">This selection records your preference. Actual payment processing must be configured separately.</p>{error&&<div className="error-message">{error}</div>}<button className="btn btn-primary full-width" disabled={busy} onClick={submit}>{busy?"Placing order…":<>Place order <ArrowRight size={16}/></>}</button></section><OrderSummary subtotal={subtotal}><p className="muted-small">Please confirm your items and table number before placing your order.</p></OrderSummary></div>}</main>;
}
function ConfirmedPage({orders}) {
  const order=orders[0];
  return <main className="center-page"><section className="form-card success-card"><div className="success-icon"><CheckCircle2 size={34}/></div><span className="eyebrow">THANK YOU</span><h1>Order received!</h1><p>Your order has been submitted. The restaurant must confirm and process it.</p>{order&&<div className="confirmation-details"><div><span>Table</span><b>{order.tableNumber||"—"}</b></div><div><span>Order total</span><b>{money(order.total)}</b></div><div><span>Status</span><b>{order.status||"Placed"}</b></div></div>}<Link className="btn btn-primary full-width" to="/orders">View my orders</Link><Link className="text-link centered" to="/menu">Order something else</Link></section></main>;
}
function OrdersPage({orders}) {
  return <main className="page-wrap"><div className="page-heading"><div><span className="eyebrow">YOUR FOOD JOURNEY</span><h1>My orders</h1><p>Keep track of orders placed during this session.</p></div></div>{!orders.length?<Empty title="No orders yet" text="Your placed orders will appear here during this session." action={<Link to="/menu" className="btn btn-primary">Explore menu</Link>}/>:<div className="order-list">{orders.map((o,i)=><article className="order-card" key={o._id||o.localId||i}><div className="order-icon"><ShoppingBag size={22}/></div><div className="order-main"><h3>Order #{o._id?.slice(-6)||o.localId||i+1}</h3><p>Table {o.tableNumber||"—"} · {new Date(o.createdAt||Date.now()).toLocaleString()}</p><span className="status-pill"><Clock size={13}/>{o.status||"Placed"}</span></div><strong>{money(o.total ?? o.totalAmount)}</strong></article>)}</div>}</main>;
}
function ReviewPage({foods}) {
  const [food,setFood]=useState("");
  const [rating,setRating]=useState(5);
  const [review,setReview]=useState("");
  const [sent,setSent]=useState(false);
  const submit=e=>{e.preventDefault();if(!food||!review.trim())return;setSent(true);};
  return <main className="center-page"><section className="form-card"><div className="large-icon"><MessageSquare size={27}/></div><span className="eyebrow">YOUR VOICE MATTERS</span><h1>Share your experience</h1><p>Tell us what you thought about your meal. Your feedback helps us improve.</p>{sent?<div className="success-inline"><CheckCircle2 size={22}/><div><b>Feedback captured in this session</b><p>Connect the review API to save it and run actual sentiment analysis.</p><button className="btn btn-light" onClick={()=>{setSent(false);setReview("");}}>Write another review</button></div></div>:<form onSubmit={submit} className="review-form"><label className="field-label">Which dish did you try?<select required value={food} onChange={e=>setFood(e.target.value)}><option value="">Choose a dish</option>{foods.map(f=><option key={foodId(f)} value={foodId(f)}>{f.name}</option>)}</select></label><label className="field-label">Your rating</label><div className="rating-picker">{[1,2,3,4,5].map(n=><button type="button" key={n} className={n<=rating?"star-active":""} onClick={()=>setRating(n)} aria-label={`${n} stars`}><Star fill="currentColor" size={28}/></button>)}</div><label className="field-label">Your review<textarea required value={review} onChange={e=>setReview(e.target.value)} rows={5} placeholder="What did you enjoy? What could be better?"/></label><button className="btn btn-primary full-width" type="submit">Submit feedback <ArrowRight size={16}/></button></form>}</section></main>;
}
function ProfilePage({user,logout}) {
  return <main className="page-wrap"><div className="page-heading"><div><span className="eyebrow">YOUR ACCOUNT</span><h1>Profile</h1></div></div><section className="form-card profile-card"><div className="large-icon"><UserRound size={28}/></div><h2>{user?.name||"Guest diner"}</h2><p>{user?.email||"Sign in to access your account."}</p>{user?<><div className="profile-row"><span>Account role</span><b>{user.role||"Customer"}</b></div><button className="btn btn-light full-width" onClick={logout}><LogOut size={16}/> Sign out</button></>:<Link to="/login" className="btn btn-primary full-width">Sign in / Register</Link>}</section></main>;
}
function AuthPage({mode,onAuth}) {
  const isLogin=mode==="login";
  const [name,setName]=useState("");
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [error,setError]=useState("");
  const [busy,setBusy]=useState(false);
  const navigate=useNavigate();
  const submit=async e=>{
    e.preventDefault();setError("");
    if(!email.trim()||!password){setError("Enter your email and password.");return;}
    if(!isLogin&&!name.trim()){setError("Enter your name.");return;}
    setBusy(true);
    try {const account=await onAuth({name,email,password});navigate(account?.role==="manager"?"/manager":"/menu");}
    catch(e){setError(e?.response?.data?.message||e.message||"Authentication failed.");}
    finally{setBusy(false);}
  };
  return <main className="center-page"><section className="form-card auth-card"><div className="large-icon"><ChefHat size={30}/></div><span className="eyebrow">FOODSENSE AI</span><h1>{isLogin?"Welcome back":"Join the table"}</h1><p>{isLogin?"Sign in to continue your food journey.":"Create your account to get started."}</p><form onSubmit={submit} className="review-form">{!isLogin&&<label className="field-label">Full name<input required value={name} onChange={e=>setName(e.target.value)} placeholder="Your name"/></label>}<label className="field-label">Email<input required type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></label><label className="field-label">Password<input required minLength={6} type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="At least 6 characters"/></label>{error&&<div className="error-message">{error}</div>}<button className="btn btn-primary full-width" disabled={busy}>{busy?"Please wait…":isLogin?"Sign in":"Create account"}</button></form><p className="auth-switch">{isLogin?"New to FoodSense?":"Already have an account?"} <Link to={isLogin?"/register":"/login"}>{isLogin?"Create account":"Sign in"}</Link></p></section></main>;
}
function ManagerPage({foods,orders}) {
  const location=useLocation();
  const section=location.pathname.split("/")[2]||"dashboard";
  const links=[["dashboard","Overview"],["foods","Food menu"],["orders","Orders"],["reviews","Reviews & insights"]];
  return <main className="page-wrap"><div className="page-heading"><div><span className="eyebrow">RESTAURANT WORKSPACE</span><h1>Manager dashboard</h1><p>Review your menu and the current session's order information.</p></div><span className="live-pill"><span/> Manager view</span></div><div className="manager-layout"><aside className="manager-sidebar">{links.map(([path,label])=><NavLink key={path} to={"/manager/"+path} className={({isActive})=>isActive?"manager-link active":"manager-link"}><LayoutDashboard size={17}/>{label}</NavLink>)}</aside><section className="manager-content">{section==="foods"?<><h2>Food menu</h2><p className="muted-small">Menu entries currently loaded in the frontend.</p><div className="manager-table-wrap"><table><thead><tr><th>Dish</th><th>Category</th><th>Price</th><th>Score</th></tr></thead><tbody>{foods.map(f=><tr key={foodId(f)}><td>{f.name}</td><td>{foodCategory(f)}</td><td>{money(foodPrice(f))}</td><td>{foodScore(f)}</td></tr>)}</tbody></table></div></>:section==="orders"?<><h2>Session orders</h2>{orders.length?orders.map((o,i)=><div className="manager-order" key={o.localId||o._id||i}><b>Order #{o._id?.slice(-6)||i+1}</b><span>{money(o.total)}</span><small>Table {o.tableNumber} · {o.status}</small></div>):<p>No orders in this browser session yet.</p>}</>:section==="reviews"?<><h2>Reviews & insights</h2><div className="insight-panel"><Sparkles size={23}/><div><b>Review analytics</b><p>Connect the existing review analytics API and sentiment model to show persisted insights here.</p></div></div></>:<><h2>Overview</h2><div className="manager-stats"><div><Utensils/><span>Menu items</span><strong>{foods.length}</strong></div><div><ShoppingBag/><span>Session orders</span><strong>{orders.length}</strong></div><div><TrendingUp/><span>Average food score</span><strong>{foods.length?(foods.reduce((s,f)=>s+foodScore(f),0)/foods.length).toFixed(1):"—"}</strong></div></div><div className="insight-panel"><Sparkles size={23}/><div><b>Welcome to FoodSense AI</b><p>This dashboard provides a clean view of menu and session data. Configure manager APIs for persistent order management and analytics.</p></div></div></>}</section></div></main>;
}
function Empty({title,text,action}) {
  return <div className="empty-state"><span className="empty-icon"><ShoppingBag size={26}/></span><h2>{title}</h2><p>{text}</p>{action}</div>;
}
function NotFound() {
  return <main className="center-page"><Empty title="Page not found" text="That page does not exist in FoodSense AI." action={<Link to="/" className="btn btn-primary">Return home</Link>}/></main>;
}
function Footer() {
  return <footer className="site-footer"><Link to="/" className="footer-brand"><ChefHat size={21}/> FoodSense <em>AI</em></Link><p>Good food. Better insights. Made for a better dining experience.</p><div><Link to="/menu">Menu</Link><Link to="/scan">Scan QR</Link><Link to="/review">Feedback</Link></div><small>© {new Date().getFullYear()} FoodSense AI</small></footer>;
}
export default App;


