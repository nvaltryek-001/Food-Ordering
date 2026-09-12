import React, { useEffect, useMemo, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useNavigate,
  useLocation
} from "react-router-dom";

import {
  Home,
  QrCode,
  Search,
  ShoppingCart,
  ClipboardList,
  User,
  Star,
  Clock3,
  CheckCircle2,
  ChefHat,
  CreditCard,
  Sparkles,
  TrendingUp,
  MessageSquareText,
  LayoutDashboard,
  Utensils,
  BarChart3,
  Settings,
  LogOut,
  Bell,
  Plus,
  Minus,
  Trash2,
  ArrowLeft,
  ArrowRight,
  Heart,
  Menu as MenuIcon,
  X,
  ScanLine,
  Bot,
  ThumbsUp,
  ThumbsDown,
  Meh,
  PackageCheck,
  IndianRupee,
  CircleUserRound
} from "lucide-react";

import QRScanner from "./components/QRScanner.jsx";
import { parseTableQR } from "./components/qrUtils.js";
import "./index.css";
import { loginUser, registerUser, getFoods, createOrder } from "./services/api.js";

/* ============================================================
   MOCK DATA
   ============================================================ */

const initialFoods = [
  {
    id: 1,
    name: "Chicken Burger",
    category: "Burgers",
    price: 149,
    rating: 4.8,
    reviews: 124,
    score: 4.7,
    image:
      "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=700&q=80",
    description:
      "Juicy grilled chicken with fresh lettuce, tomatoes and special house sauce.",
    tags: ["Popular", "Spicy"]
  },
  {
    id: 2,
    name: "Paneer Pizza",
    category: "Pizza",
    price: 229,
    rating: 4.6,
    reviews: 98,
    score: 4.5,
    image:
      "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=700&q=80",
    description:
      "Crispy pizza loaded with paneer, vegetables and melted cheese.",
    tags: ["Veg", "Popular"]
  },
  {
    id: 3,
    name: "Chicken Biryani",
    category: "Biryani",
    price: 199,
    rating: 4.4,
    reviews: 86,
    score: 4.3,
    image:
      "https://images.unsplash.com/photo-1563379091339-03246963d96c?auto=format&fit=crop&w=700&q=80",
    description:
      "Aromatic basmati rice cooked with tender chicken and traditional spices.",
    tags: ["Best Seller"]
  },
  {
    id: 4,
    name: "French Fries",
    category: "Snacks",
    price: 99,
    rating: 4.2,
    reviews: 74,
    score: 4.1,
    image:
      "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=700&q=80",
    description:
      "Golden crispy fries served hot with our signature seasoning.",
    tags: ["Crispy"]
  },
  {
    id: 5,
    name: "Masala Dosa",
    category: "South Indian",
    price: 89,
    rating: 4.7,
    reviews: 65,
    score: 4.6,
    image:
      "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=700&q=80",
    description:
      "Crispy dosa filled with flavorful potato masala, served with chutney.",
    tags: ["Veg"]
  },
  {
    id: 6,
    name: "Chocolate Shake",
    category: "Drinks",
    price: 129,
    rating: 4.5,
    reviews: 51,
    score: 4.4,
    image:
      "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=700&q=80",
    description:
      "Creamy chocolate shake topped with whipped cream.",
    tags: ["Sweet"]
  }
];

/* ============================================================
   APP
   ============================================================ */

function App() {
  const [foods, setFoods] = useState(initialFoods);
const [foodsLoading, setFoodsLoading] = useState(false);
const [foodsError, setFoodsError] = useState("");

useEffect(() => {
  let active = true;

  const loadFoods = async () => {
    try {
      setFoodsLoading(true);
      setFoodsError("");

      const result = await getFoods();

      if (active && result?.success && Array.isArray(result.foods)) {
        setFoods(result.foods);
      }
    } catch (error) {
      console.error("Food API error:", error);

      if (active) {
        setFoodsError(
          error?.response?.data?.message ||
          "Unable to load live menu."
        );
      }
    } finally {
      if (active) {
        setFoodsLoading(false);
      }
    }
  };

  loadFoods();

  return () => {
    active = false;
  };
}, []);
  const [cart, setCart] = useState([]);
  const [tableNumber, setTableNumber] = useState("12");
  const [orderStatus, setOrderStatus] = useState("placed");
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  const addToCart = (food) => {
    setCart((current) => {
      const existing = current.find((item) => item.id === food.id);

      if (existing) {
        return current.map((item) =>
          item.id === food.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [...current, { ...food, quantity: 1 }];
    });
  };

  const increaseQuantity = (id) => {
    setCart((current) =>
      current.map((item) =>
        item.id === id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    );
  };

  const decreaseQuantity = (id) => {
    setCart((current) =>
      current
        .map((item) =>
          item.id === id
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (id) => {
    setCart((current) => current.filter((item) => item.id !== id));
  };

  const updateFoodScore = (foodId, sentiment) => {
    setFoods((current) =>
      current.map((food) => {
        if (food.id !== foodId) return food;

        const change =
          sentiment === "positive"
            ? 0.2
            : sentiment === "negative"
              ? -0.2
              : 0;

        const newScore = Math.max(
          1,
          Math.min(5, Number((food.score + change).toFixed(1)))
        );

        return {
          ...food,
          score: newScore,
          rating: newScore,
          reviews: food.reviews + 1
        };
      })
    );
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="*"
          element={
            <MainApplication
              foods={foods}
              cart={cart}
              tableNumber={tableNumber}
              setTableNumber={setTableNumber}
              addToCart={addToCart}
              increaseQuantity={increaseQuantity}
              decreaseQuantity={decreaseQuantity}
              removeFromCart={removeFromCart}
              orderStatus={orderStatus}
              setOrderStatus={setOrderStatus}
              updateFoodScore={updateFoodScore}
              reviewSubmitted={reviewSubmitted}
              setReviewSubmitted={setReviewSubmitted}
            />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

/* ============================================================
   MAIN APPLICATION
   ============================================================ */

function MainApplication(props) {
  const location = useLocation();

  const isManager = location.pathname.startsWith("/manager");

  if (isManager) {
    return <ManagerApp {...props} />;
  }

  return <CustomerApp {...props} />;
}

/* ============================================================
   CUSTOMER APP
   ============================================================ */

function CustomerApp(props) {
  return (
    <div className="app-shell">
      <CustomerNavbar cart={props.cart} />

      <main className="main-content">
        <Routes>
          <Route path="/" element={<HomePage />} />

          <Route
            path="/login"
            element={<LoginPage />}
          />

          <Route
            path="/register"
            element={<RegisterPage />}
          />

          <Route
            path="/scan"
            element={
              <ScanQRPage
                tableNumber={props.tableNumber}
                setTableNumber={props.setTableNumber}
              />
            }
          />

          <Route
            path="/menu"
            element={
              <MenuPage
                foods={props.foods}
                addToCart={props.addToCart}
              />
            }
          />

          <Route
            path="/food/:id"
            element={
              <FoodDetailsPage
                foods={props.foods}
                addToCart={props.addToCart}
              />
            }
          />

          <Route
            path="/cart"
            element={
              <CartPage
                cart={props.cart}
                increaseQuantity={props.increaseQuantity}
                decreaseQuantity={props.decreaseQuantity}
                removeFromCart={props.removeFromCart}
              />
            }
          />

          <Route
            path="/checkout"
            element={
              <CheckoutPage
                cart={props.cart}
                setOrderStatus={props.setOrderStatus}
              />
            }
          />

          <Route
            path="/order-confirmed"
            element={
              <OrderConfirmedPage
                tableNumber={props.tableNumber}
              />
            }
          />

          <Route
            path="/orders"
            element={
              <OrdersPage
                orderStatus={props.orderStatus}
              />
            }
          />

          <Route
            path="/review"
            element={
              <ReviewPage
                foods={props.foods}
                updateFoodScore={props.updateFoodScore}
                reviewSubmitted={props.reviewSubmitted}
                setReviewSubmitted={props.setReviewSubmitted}
              />
            }
          />

          <Route
            path="/profile"
            element={<ProfilePage />}
          />
        </Routes>
      </main>

      <CustomerBottomNav cart={props.cart} />
    </div>
  );
}

/* ============================================================
   CUSTOMER NAVBAR
   ============================================================ */

function CustomerNavbar({ cart }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <header className="topbar">
        <Link to="/" className="brand">
          <div className="brand-icon">
            <ChefHat size={27} />
          </div>

          <div>
            <div className="brand-name">
              FoodSense <span>AI</span>
            </div>
            <div className="brand-tagline">
              Good Food. Better Insights.
            </div>
          </div>
        </Link>

        <nav className="desktop-nav">
          <Link to="/">Home</Link>
          <Link to="/scan">
            <QrCode size={16} /> Scan QR
          </Link>
          <Link to="/menu">
            <Utensils size={16} /> Menu
          </Link>
          <Link to="/orders">
            <ClipboardList size={16} /> Orders
          </Link>
        </nav>

        <div className="top-actions">
          <Link to="/cart" className="icon-button cart-button">
            <ShoppingCart size={21} />
            {cart.length > 0 && (
              <span className="notification-badge">
                {cart.reduce((a, b) => a + b.quantity, 0)}
              </span>
            )}
          </Link>

          <Link to="/profile" className="avatar-button">
            <CircleUserRound size={21} />
          </Link>

          <button
            className="mobile-menu-button"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X /> : <MenuIcon />}
          </button>
        </div>
      </header>

      {mobileOpen && (
        <div className="mobile-menu">
          <Link to="/" onClick={() => setMobileOpen(false)}>
            Home
          </Link>
          <Link to="/scan" onClick={() => setMobileOpen(false)}>
            Scan QR
          </Link>
          <Link to="/menu" onClick={() => setMobileOpen(false)}>
            Menu
          </Link>
          <Link to="/orders" onClick={() => setMobileOpen(false)}>
            Orders
          </Link>
          <Link to="/profile" onClick={() => setMobileOpen(false)}>
            Profile
          </Link>
        </div>
      )}
    </>
  );
}

/* ============================================================
   HOME
   ============================================================ */

function HomePage() {
  return (
    <div>
      <section className="hero">
        <div className="hero-content">
          <div className="hero-pill">
            <Sparkles size={15} />
            AI-Powered Food Experience
          </div>

          <h1>
            Taste the Food.
            <br />
            <span>Shape the Menu.</span>
          </h1>

          <p>
            Order from your table, share your experience, and let AI
            help restaurants serve better food.
          </p>

          <div className="hero-buttons">
            <Link to="/scan" className="primary-button">
              <ScanLine size={19} />
              Scan Table QR
            </Link>

            <Link to="/menu" className="secondary-button">
              Explore Menu
              <ArrowRight size={18} />
            </Link>
          </div>

          <div className="hero-stats">
            <div>
              <strong>4.8â˜…</strong>
              <span>Top Food Rating</span>
            </div>

            <div>
              <strong>AI</strong>
              <span>Review Analysis</span>
            </div>

            <div>
              <strong>100%</strong>
              <span>Digital Ordering</span>
            </div>
          </div>
        </div>

        <div className="hero-food">
          <div className="hero-glow"></div>
          <img
            src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1000&q=85"
            alt="Chicken Burger"
          />

          <div className="floating-score-card">
            <div className="score-icon">
              <TrendingUp size={19} />
            </div>

            <div>
              <small>AI Food Score</small>
              <strong>4.7 / 5.0</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="section-container">
        <div className="section-heading">
          <div>
            <span className="section-eyebrow">HOW IT WORKS</span>
            <h2>From QR Code to AI Insights</h2>
          </div>

          <p>
            A simple restaurant experience powered by customer
            feedback.
          </p>
        </div>

        <div className="process-grid">
          <ProcessCard
            number="01"
            icon={<QrCode />}
            title="Scan QR"
            text="Scan the QR code on your restaurant table."
          />

          <ProcessCard
            number="02"
            icon={<ShoppingCart />}
            title="Order Food"
            text="Browse the AI-ranked menu and place your order."
          />

          <ProcessCard
            number="03"
            icon={<ChefHat />}
            title="Get Served"
            text="Restaurant manager confirms when your order is served."
          />

          <ProcessCard
            number="04"
            icon={<Sparkles />}
            title="AI Review"
            text="Your review is analyzed and improves the menu ranking."
          />
        </div>
      </section>

      <section className="ai-banner">
        <div className="ai-banner-icon">
          <Bot size={32} />
        </div>

        <div>
          <span>FOODSENSE AI</span>
          <h2>Your Feedback Makes the Menu Smarter.</h2>
          <p>
            RNN-based sentiment analysis converts customer reviews
            into meaningful food scores.
          </p>
        </div>

        <Link to="/menu" className="white-button">
          See AI Ranked Menu
          <ArrowRight size={18} />
        </Link>
      </section>
    </div>
  );
}

function ProcessCard({ number, icon, title, text }) {
  return (
    <div className="process-card">
      <span className="process-number">{number}</span>
      <div className="process-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}

/* ============================================================
   LOGIN
   ============================================================ */

function LoginPage() {
  const navigate = useNavigate();
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [error,setError]=useState("");
  const [loading,setLoading]=useState(false);

  const handleLogin=async(e)=>{
    e.preventDefault();
    setError("");
    if(!email||!password){setError("Enter email and password.");return;}
    try{
      setLoading(true);
      const result=await loginUser({email,password});
      if(!result?.success) throw new Error(result?.message||"Login failed");
      navigate(result.user?.role==="manager"?"/manager":"/menu");
    }catch(err){
      setError(err?.response?.data?.message||err?.message||"Login failed");
    }finally{setLoading(false);}
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">🍽️</div>
          <h1>Welcome Back</h1>
          <p>Login to your FoodSense AI account</p>
        </div>

        {error&&<div className="auth-error">{error}</div>}

        <form onSubmit={handleLogin}>
          <label>Email</label>
          <input type="email" value={email}
            onChange={e=>setEmail(e.target.value)}
            placeholder="Enter your email" />

          <label>Password</label>
          <input type="password" value={password}
            onChange={e=>setPassword(e.target.value)}
            placeholder="Enter your password" />

          <button type="submit" disabled={loading}>
            {loading?"Logging in...":"Login"}
          </button>
        </form>

        <p className="auth-switch">
          Don't have an account? <Link to="/register">Create Account</Link>
        </p>
      </div>
    </div>
  );
}
function RegisterPage() {
  const navigate = useNavigate();
  const [name,setName]=useState("");
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [error,setError]=useState("");
  const [loading,setLoading]=useState(false);

  const handleRegister=async(e)=>{
    e.preventDefault();
    setError("");
    if(!name||!email||!password){setError("Fill all fields.");return;}
    if(password.length<6){setError("Password must be at least 6 characters.");return;}

    try{
      setLoading(true);
      const result=await registerUser({name,email,password});
      if(!result?.success) throw new Error(result?.message||"Registration failed");
      navigate("/menu");
    }catch(err){
      setError(err?.response?.data?.message||err?.message||"Registration failed");
    }finally{setLoading(false);}
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">🍽️</div>
          <h1>Create Account</h1>
          <p>Join FoodSense AI today</p>
        </div>

        {error&&<div className="auth-error">{error}</div>}

        <form onSubmit={handleRegister}>
          <label>Full Name</label>
          <input type="text" value={name}
            onChange={e=>setName(e.target.value)}
            placeholder="Enter your name" />

          <label>Email</label>
          <input type="email" value={email}
            onChange={e=>setEmail(e.target.value)}
            placeholder="Enter your email" />

          <label>Password</label>
          <input type="password" value={password}
            onChange={e=>setPassword(e.target.value)}
            placeholder="Create a password" />

          <button type="submit" disabled={loading}>
            {loading?"Creating Account...":"Create Account"}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}
function ScanQRPage({ tableNumber, setTableNumber }) {
  const navigate = useNavigate();
  const [scanError, setScanError] = useState("");
  const [scanning, setScanning] = useState(false);

  const handleScan = (decodedText) => {
    try {
      const result = parseTableQR(decodedText);

      if (!result?.tableNumber) {
        throw new Error("Invalid table QR code");
      }

      setTableNumber(String(result.tableNumber));
      setScanError("");
      setScanning(false);

      navigate("/menu");
    } catch (error) {
      console.error("QR scan error:", error);
      setScanError(
        "Invalid QR code. Please scan a FoodSense table QR code."
      );
    }
  };

  return (
    <div className="center-page">
      <div className="scan-card">
        <Link to="/" className="back-link">
          <ArrowLeft size={17} />
          Back
        </Link>

        <div className="scan-icon">
          <QrCode size={34} />
        </div>

        <h1>Scan Table QR</h1>

        <p>
          Scan the QR code placed on your restaurant table
          to automatically open the menu.
        </p>

        {scanning ? (
          <div>
            <QRScanner onScan={handleScan} />

            <button
              className="outline-button full-button"
              onClick={() => {
                setScanning(false);
                setScanError("");
              }}
              style={{ marginTop: "14px" }}
            >
              Cancel Scanner
            </button>
          </div>
        ) : (
          <>
            <div className="qr-box">
              <div className="qr-pattern">
                <div className="qr-square one"></div>
                <div className="qr-square two"></div>
                <div className="qr-square three"></div>
                <span>QR</span>
              </div>

              <ScanLine className="scan-line" size={210} />
            </div>

            <button
              className="primary-button full-button"
              onClick={() => {
                setScanError("");
                setScanning(true);
              }}
            >
              <ScanLine size={18} />
              Scan Real QR Code
            </button>
          </>
        )}

        {scanError && (
          <div
            style={{
              marginTop: "14px",
              padding: "12px",
              borderRadius: "12px",
              background: "#fff1f2",
              color: "#be123c",
              fontSize: "14px"
            }}
          >
            {scanError}
          </div>
        )}

        <div className="manual-table">
          <span>Table Number</span>

          <div className="table-input">
            <input
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              placeholder="Enter table number"
            />

            <button onClick={() => navigate("/menu")}>
              Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
/* ============================================================
   MENU
   ============================================================ */

function MenuPage({ foods, addToCart }) {
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");

  const categories = [
    "All",
    "Burgers",
    "Pizza",
    "Biryani",
    "Snacks",
    "South Indian",
    "Drinks"
  ];

  const rankedFoods = useMemo(() => {
    return [...foods]
      .filter((food) =>
        category === "All" ? true : food.category === category
      )
      .filter((food) =>
        food.name.toLowerCase().includes(search.toLowerCase())
      )
      .sort((a, b) => b.score - a.score);
  }, [foods, category, search]);

  return (
    <div className="page-container">
      <div className="menu-header">
        <div>
          <span className="section-eyebrow">TABLE 12</span>
          <h1>AI Ranked Menu</h1>
          <p>
            Foods are ranked using customer feedback and AI
            food scores.
          </p>
        </div>

        <div className="ai-status">
          <Sparkles size={17} />
          AI Ranking Active
        </div>
      </div>

      <div className="search-bar">
        <Search size={20} />
        <input
          placeholder="Search for dishes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="category-row">
        {categories.map((item) => (
          <button
            key={item}
            className={category === item ? "active" : ""}
            onClick={() => setCategory(item)}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="ranking-heading">
        <div>
          <Sparkles size={19} />
          <h2>Top Rated by AI</h2>
        </div>

        <span>{rankedFoods.length} dishes</span>
      </div>

      <div className="food-grid">
        {rankedFoods.map((food, index) => (
          <FoodCard
            key={food._id || food.id}
            food={food}
            rank={index + 1}
            addToCart={addToCart}
          />
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   FOOD CARD
   ============================================================ */

function FoodCard({ food, rank, addToCart }) {
  return (
    <div className="food-card">
      <div className="food-image-wrapper">
        <img src={food.image} alt={food.name} />

        {rank <= 3 && (
          <div className="rank-badge">
            <TrendingUp size={14} />
            #{rank}
          </div>
        )}

        <button className="heart-button">
          <Heart size={18} />
        </button>
      </div>

      <div className="food-info">
        <div className="food-category">{food.category}</div>

        <Link to={`/food/${food.id}`}>
          <h3>{food.name}</h3>
        </Link>

        <div className="rating-row">
          <Star size={15} fill="currentColor" />
          <strong>{food.rating}</strong>
          <span>({food.reviews})</span>
        </div>

        <div className="food-bottom">
          <strong className="food-price">
            â‚¹{food.price}
          </strong>

          <button
            className="add-button"
            onClick={() => addToCart(food)}
          >
            <Plus size={17} />
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   FOOD DETAILS
   ============================================================ */

function FoodDetailsPage({ foods, addToCart }) {
  const { pathname } = useLocation();
  const id = pathname.split("/").pop();

  const food = foods.find(
    (item) => String(item._id || item.id) === String(id)
  );

  if (!food) {
    return (
      <div className="empty-state">
        <h2>Food not found</h2>
        <Link to="/menu" className="primary-button">
          Back to Menu
        </Link>
      </div>
    );
  }

  const tags = food.tags || [
    food.category,
    food.score >= 4.5 ? "Highly Rated" : "Popular"
  ];

  return (
    <div className="detail-container">
      <Link to="/menu" className="back-link">
        <ArrowLeft size={17} />
        Back to Menu
      </Link>

      <div className="food-detail">
        <div className="detail-image">
          <img
            src={food.image}
            alt={food.name}
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />

          <button className="heart-button large">
            <Heart size={22} />
          </button>
        </div>

        <div className="detail-info">
          <span className="food-category">
            {food.category}
          </span>

          <h1>{food.name}</h1>

          <div className="large-rating">
            <Star size={22} fill="currentColor" />
            <strong>{food.rating}</strong>
            <span>({food.reviews} reviews)</span>
          </div>

          <div className="loved-badge">
            <ThumbsUp size={15} />
            {food.score >= 4.5 ? "Most Loved" : "Popular Choice"}
          </div>

          <p className="detail-description">
            {food.description}
          </p>

          <div className="tag-list">
            {tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>

          <div className="detail-price">
            ₹{food.price}
          </div>

          <button
            className="primary-button"
            onClick={() => addToCart(food)}
          >
            <ShoppingCart size={19} />
            Add to Cart
          </button>

          <div className="review-preview">
            <div className="review-header">
              <strong>Reviews ({food.reviews})</strong>
              <span>See All</span>
            </div>

            <div className="review-item">
              <div className="review-avatar">AI</div>

              <div>
                <strong>FoodSense Customer</strong>

                <div className="stars">
                  ★★★★★
                </div>

                <p>
                  Customer feedback is continuously analyzed
                  by FoodSense AI to improve food rankings.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   CART
   ============================================================ */
function CartPage({
  cart,
  increaseQuantity,
  decreaseQuantity,
  removeFromCart
}) {
  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const delivery = cart.length > 0 ? 20 : 0;
  const total = subtotal + delivery;

  return (
    <div className="page-container">
      <div className="page-title-row">
        <div>
          <span className="section-eyebrow">YOUR ORDER</span>
          <h1>Your Cart</h1>
        </div>

        <Link to="/menu" className="outline-button">
          Continue Ordering
        </Link>
      </div>

      {cart.length === 0 ? (
        <div className="empty-state">
          <ShoppingCart size={55} />
          <h2>Your cart is empty</h2>
          <p>Add delicious food from the menu.</p>
          <Link to="/menu" className="primary-button">
            Explore Menu
          </Link>
        </div>
      ) : (
        <div className="cart-layout">
          <div className="cart-items">
            {cart.map((item) => (
              <div className="cart-item" key={item.id}>
                <img src={item.image} alt={item.name} />

                <div className="cart-item-info">
                  <span>{item.category}</span>
                  <h3>{item.name}</h3>
                  <strong>â‚¹{item.price}</strong>
                </div>

                <div className="quantity-control">
                  <button
                    onClick={() => decreaseQuantity(item.id)}
                  >
                    <Minus size={15} />
                  </button>

                  <span>{item.quantity}</span>

                  <button
                    onClick={() => increaseQuantity(item.id)}
                  >
                    <Plus size={15} />
                  </button>
                </div>

                <button
                  className="delete-button"
                  onClick={() => removeFromCart(item.id)}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>

          <div className="summary-card">
            <h2>Order Summary</h2>

            <div className="summary-line">
              <span>Items ({cart.length})</span>
              <strong>â‚¹{subtotal}</strong>
            </div>

            <div className="summary-line">
              <span>Delivery Charge</span>
              <strong>â‚¹{delivery}</strong>
            </div>

            <div className="summary-divider"></div>

            <div className="summary-total">
              <span>Total</span>
              <strong>â‚¹{total}</strong>
            </div>

            <Link
              to="/checkout"
              className="primary-button full-button"
            >
              Proceed to Payment
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   CHECKOUT
   ============================================================ */

function CheckoutPage({ cart, tableNumber, setOrderStatus }) {
  const navigate = useNavigate();

  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const subtotal = cart.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity,
    0
  );

  const delivery = cart.length > 0 ? 20 : 0;
  const total = subtotal + delivery;

  const placeOrder = async () => {
    if (!cart.length) {
      setError("Your cart is empty.");
      return;
    }

    const token = localStorage.getItem("foodsense_token");

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const result = await createOrder({
        tableNumber: tableNumber || "12",
        paymentMethod,
        paymentStatus: "paid",
        items: cart.map((item) => ({
          foodId: item._id || item.foodId || item.id,
          quantity: item.quantity
        }))
      });

      if (!result?.success) {
        throw new Error(
          result?.message || "Unable to place order."
        );
      }

      // Save real order for confirmation page
      localStorage.setItem(
        "foodsense_last_order",
        JSON.stringify(result.order)
      );

      setOrderStatus(result.order?.status || "placed");

      navigate("/order-confirmed");
    } catch (err) {
      console.error("Order placement error:", err);

      setError(
        err?.response?.data?.message ||
        err?.message ||
        "Unable to place order."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container narrow">
      <Link to="/cart" className="back-link">
        <ArrowLeft size={17} />
        Back to Cart
      </Link>

      <div className="checkout-header">
        <span className="section-eyebrow">
          SECURE CHECKOUT
        </span>
        <h1>Payment</h1>
      </div>

      {error && (
        <div className="auth-error">
          {error}
        </div>
      )}

      <div className="payment-card">
        <h2>Choose Payment Method</h2>

        <label className="payment-option selected">
          <input
            type="radio"
            name="payment"
            checked={paymentMethod === "upi"}
            onChange={() => setPaymentMethod("upi")}
          />
          <div>
            <strong>UPI</strong>
            <span>Google Pay / PhonePe / Paytm</span>
          </div>
          <CreditCard size={22} />
        </label>

        <label className="payment-option">
          <input
            type="radio"
            name="payment"
            checked={paymentMethod === "card"}
            onChange={() => setPaymentMethod("card")}
          />
          <div>
            <strong>Debit / Credit Card</strong>
            <span>Secure card payment</span>
          </div>
          <CreditCard size={22} />
        </label>

        <label className="payment-option">
          <input
            type="radio"
            name="payment"
            checked={paymentMethod === "cash"}
            onChange={() => setPaymentMethod("cash")}
          />
          <div>
            <strong>Cash on Delivery</strong>
            <span>Pay when served</span>
          </div>
          <IndianRupee size={22} />
        </label>

        <div className="checkout-total">
          <span>Total Amount</span>
          <strong>₹{total}</strong>
        </div>

        <button
          className="primary-button full-button"
          onClick={placeOrder}
          disabled={loading}
        >
          <CreditCard size={19} />
          {loading
            ? "Placing Order..."
            : `Pay ₹${total} & Place Order`}
        </button>

        <div className="secure-note">
          <CheckCircle2 size={16} />
          Demo payment — no real money is charged.
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   ORDER CONFIRMED
   ============================================================ */
function OrderConfirmedPage({ tableNumber }) {
  return (
    <div className="success-page">
      <div className="success-card">
        <div className="success-icon">
          <CheckCircle2 size={55} />
        </div>

        <span className="section-eyebrow">TABLE {tableNumber}</span>

        <h1>Order Placed!</h1>

        <p>
          Your order has been placed successfully.
          The restaurant has been notified.
        </p>

        <div className="order-id">
          <span>Order ID</span>
          <strong>#FS123456</strong>
        </div>

        <div className="estimate">
          <Clock3 size={19} />
          <div>
            <span>Estimated Time</span>
            <strong>20 - 30 mins</strong>
          </div>
        </div>

        <Link
          to="/orders"
          className="primary-button full-button"
        >
          Track Order
        </Link>

        <Link
          to="/menu"
          className="outline-button full-button"
        >
          Back to Menu
        </Link>
      </div>
    </div>
  );
}

/* ============================================================
   ORDERS
   ============================================================ */

function OrdersPage({ orderStatus }) {
  const steps = [
    {
      title: "Order Placed",
      text: "Your order has been placed.",
      done: true
    },
    {
      title: "Accepted by Restaurant",
      text: "Restaurant has accepted your order.",
      done: true
    },
    {
      title: "Preparing",
      text: "Your food is being prepared.",
      done: true
    },
    {
      title: "Served",
      text: "Your order has been served. You can now review it.",
      done: true,
      current: true
    }
  ];

  return (
    <div className="page-container narrow">
      <div className="page-title-row">
        <div>
          <span className="section-eyebrow">ORDER #FS123456</span>
          <h1>Order Status</h1>
        </div>

        <span className="status-pill success">
          Served
        </span>
      </div>

      <div className="timeline-card">
        {steps.map((step, index) => (
          <div
            className={`timeline-step ${
              step.current ? "current" : ""
            }`}
            key={step.title}
          >
            <div className="timeline-dot">
              {step.done ? (
                <CheckCircle2 size={21} />
              ) : (
                index + 1
              )}
            </div>

            <div>
              <strong>{step.title}</strong>
              <span>
                {index === 0
                  ? "10:15 AM"
                  : index === 1
                    ? "10:18 AM"
                    : index === 2
                      ? "10:20 AM"
                      : "10:35 AM"}
              </span>
              <p>{step.text}</p>
            </div>
          </div>
        ))}
      </div>

      <Link
        to="/review"
        className="primary-button full-button"
      >
        <Star size={18} />
        Give Food Review
      </Link>
    </div>
  );
}

/* ============================================================
   REVIEW
   ============================================================ */

function ReviewPage({
  foods,
  updateFoodScore,
  reviewSubmitted,
  setReviewSubmitted
}) {
  const [rating, setRating] = useState(5);
  const [text, setText] = useState(
    "The burger was very tasty and fresh. Really enjoyed it!"
  );

  const food = foods[0];

  const submitReview = () => {
    setReviewSubmitted(true);

    const sentiment =
      rating >= 4
        ? "positive"
        : rating <= 2
          ? "negative"
          : "neutral";

    updateFoodScore(food.id, sentiment);
  };

  if (reviewSubmitted) {
    return (
      <AIAnalysisResult
        rating={rating}
        text={text}
      />
    );
  }

  return (
    <div className="review-page">
      <div className="review-card">
        <span className="section-eyebrow">
          ORDER #FS123456
        </span>

        <h1>Rate Your Food</h1>

        <div className="review-food">
          <img src={food.image} alt={food.name} />

          <div>
            <strong>{food.name}</strong>
            <span>How was your experience?</span>
          </div>
        </div>

        <div className="star-selector">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setRating(star)}
              className={star <= rating ? "selected" : ""}
            >
              <Star size={32} fill="currentColor" />
            </button>
          ))}
        </div>

        <div className="rating-label">
          {rating === 5
            ? "Excellent!"
            : rating === 4
              ? "Very Good"
              : rating === 3
                ? "Good"
                : rating === 2
                  ? "Needs Improvement"
                  : "Poor"}
        </div>

        <label>Tell us about your experience</label>

        <textarea
          rows="5"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write your review..."
        />

        <label>Add Photos (Optional)</label>

        <div className="photo-upload">
          <div className="photo-preview">
            <img src={food.image} alt="" />
          </div>

          <button>
            <Plus size={23} />
          </button>
        </div>

        <button
          className="primary-button full-button"
          onClick={submitReview}
        >
          <Sparkles size={18} />
          Submit Review & Analyze
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   AI RESULT
   ============================================================ */

function AIAnalysisResult({ rating, text }) {
  const sentiment =
    rating >= 4
      ? "positive"
      : rating <= 2
        ? "negative"
        : "neutral";

  const config = {
    positive: {
      title: "Positive",
      icon: <ThumbsUp size={44} />,
      description:
        "Customers love this food. Your feedback helps keep it on top."
    },
    neutral: {
      title: "Neutral",
      icon: <Meh size={44} />,
      description:
        "Your feedback is balanced and will help improve the dish."
    },
    negative: {
      title: "Negative",
      icon: <ThumbsDown size={44} />,
      description:
        "Your feedback has been recorded and will help improve this dish."
    }
  };

  const result = config[sentiment];

  return (
    <div className="analysis-page">
      <div className="analysis-card">
        <div className="ai-robot">
          <Bot size={60} />
        </div>

        <span className="section-eyebrow">
          RNN SENTIMENT ANALYSIS
        </span>

        <h1>Review Analysis Result</h1>

        <div className={`sentiment-result ${sentiment}`}>
          {result.icon}
          <strong>{result.title}</strong>
          <span>AI Confidence: 94%</span>
        </div>

        <div className="analysis-breakdown">
          <div>
            <span>Food / Taste</span>
            <strong>{result.title}</strong>
          </div>

          <div>
            <span>Delivery</span>
            <strong>Neutral</strong>
          </div>

          <div>
            <span>Overall</span>
            <strong>{result.title}</strong>
          </div>
        </div>

        <div className="review-quote">
          "{text}"
        </div>

        <div className="score-update">
          <div>
            <span>Previous Food Score</span>
            <strong>4.5 â˜…</strong>
          </div>

          <ArrowRight size={27} />

          <div>
            <span>New Food Score</span>
            <strong>4.7 â˜…</strong>
          </div>
        </div>

        <div className="success-message">
          <TrendingUp size={20} />
          Food score updated and menu ranking refreshed.
        </div>

        <Link
          to="/menu"
          className="primary-button full-button"
        >
          View Updated Menu
          <ArrowRight size={18} />
        </Link>
      </div>
    </div>
  );
}

/* ============================================================
   PROFILE
   ============================================================ */

function ProfilePage() {
  return (
    <div className="page-container narrow">
      <div className="profile-card">
        <div className="profile-avatar">
          <CircleUserRound size={52} />
        </div>

        <h1>Rahul Kumar</h1>
        <p>rahul@example.com</p>

        <div className="profile-stats">
          <div>
            <strong>12</strong>
            <span>Orders</span>
          </div>

          <div>
            <strong>9</strong>
            <span>Reviews</span>
          </div>

          <div>
            <strong>4.8</strong>
            <span>Avg Rating</span>
          </div>
        </div>

        <button className="outline-button full-button">
          <Settings size={18} />
          Account Settings
        </button>

        <Link
          to="/login"
          className="danger-button full-button"
        >
          <LogOut size={18} />
          Logout
        </Link>
      </div>
    </div>
  );
}

/* ============================================================
   CUSTOMER BOTTOM NAV
   ============================================================ */

function CustomerBottomNav({ cart }) {
  return (
    <nav className="bottom-nav">
      <Link to="/">
        <Home size={19} />
        <span>Home</span>
      </Link>

      <Link to="/scan">
        <QrCode size={19} />
        <span>Scan</span>
      </Link>

      <Link to="/menu">
        <Utensils size={19} />
        <span>Menu</span>
      </Link>

      <Link to="/cart" className="bottom-cart">
        <ShoppingCart size={19} />
        {cart.length > 0 && (
          <small>
            {cart.reduce((a, b) => a + b.quantity, 0)}
          </small>
        )}
        <span>Cart</span>
      </Link>

      <Link to="/orders">
        <ClipboardList size={19} />
        <span>Orders</span>
      </Link>

      <Link to="/profile">
        <User size={19} />
        <span>Profile</span>
      </Link>
    </nav>
  );
}

/* ============================================================
   MANAGER APP
   ============================================================ */

function ManagerApp(props) {
  return (
    <div className="manager-shell">
      <ManagerSidebar />

      <div className="manager-main">
        <ManagerTopbar />

        <Routes>
          <Route
            path="/manager"
            element={<ManagerDashboard foods={props.foods} />}
          />

          <Route
            path="/manager/orders"
            element={
              <ManagerOrders
                setOrderStatus={props.setOrderStatus}
              />
            }
          />

          <Route
            path="/manager/menu"
            element={<ManagerMenu foods={props.foods} />}
          />

          <Route
            path="/manager/reviews"
            element={<ManagerReviews />}
          />

          <Route
            path="/manager/analytics"
            element={<ManagerAnalytics />}
          />
        </Routes>
      </div>
    </div>
  );
}

/* ============================================================
   MANAGER SIDEBAR
   ============================================================ */

function ManagerSidebar() {
  return (
    <aside className="manager-sidebar">
      <Link to="/manager" className="manager-brand">
        <div className="brand-icon">
          <ChefHat size={24} />
        </div>

        <div>
          <strong>
            FoodSense <span>AI</span>
          </strong>
          <small>Manager Portal</small>
        </div>
      </Link>

      <div className="manager-nav-label">
        MAIN MENU
      </div>

      <nav>
        <Link to="/manager">
          <LayoutDashboard size={18} />
          Dashboard
        </Link>

        <Link to="/manager/orders">
          <ClipboardList size={18} />
          Orders
        </Link>

        <Link to="/manager/menu">
          <Utensils size={18} />
          Menu Management
        </Link>

        <Link to="/manager/reviews">
          <MessageSquareText size={18} />
          Reviews
        </Link>

        <Link to="/manager/analytics">
          <BarChart3 size={18} />
          Analytics
        </Link>
      </nav>

      <div className="manager-bottom">
        <Link to="/">
          <LogOut size={18} />
          Customer View
        </Link>
      </div>
    </aside>
  );
}

/* ============================================================
   MANAGER TOPBAR
   ============================================================ */

function ManagerTopbar() {
  return (
    <header className="manager-topbar">
      <div>
        <span className="section-eyebrow">
          RESTAURANT MANAGEMENT
        </span>
        <h1>Manager Dashboard</h1>
      </div>

      <div className="manager-actions">
        <button className="icon-button">
          <Bell size={20} />
        </button>

        <div className="manager-user">
          <div className="small-avatar">M</div>
          <div>
            <strong>Manager</strong>
            <span>Restaurant Admin</span>
          </div>
        </div>
      </div>
    </header>
  );
}

/* ============================================================
   MANAGER DASHBOARD
   ============================================================ */

function ManagerDashboard({ foods }) {
  return (
    <div className="manager-content">
      <div className="metric-grid">
        <MetricCard
          icon={<ClipboardList />}
          title="Today's Orders"
          value="28"
          change="+12%"
        />

        <MetricCard
          icon={<IndianRupee />}
          title="Total Revenue"
          value="â‚¹12,450"
          change="+8%"
        />

        <MetricCard
          icon={<MessageSquareText />}
          title="Total Reviews"
          value="542"
          change="+24%"
        />

        <MetricCard
          icon={<Star />}
          title="Average Rating"
          value="4.3"
          change="+0.2"
        />
      </div>

      <div className="manager-grid">
        <div className="manager-panel large">
          <div className="panel-header">
            <div>
              <h2>Recent Orders</h2>
              <span>Latest customer orders</span>
            </div>

            <Link to="/manager/orders">
              View All
            </Link>
          </div>

          <OrderTable />
        </div>

        <div className="manager-panel">
          <div className="panel-header">
            <div>
              <h2>AI Review Analytics</h2>
              <span>Customer sentiment</span>
            </div>
          </div>

          <div className="sentiment-chart">
            <div className="donut">
              <div>
                <strong>72%</strong>
                <span>Positive</span>
              </div>
            </div>

            <div className="legend">
              <div>
                <span className="dot positive-dot"></span>
                Positive
                <strong>72%</strong>
              </div>

              <div>
                <span className="dot neutral-dot"></span>
                Neutral
                <strong>18%</strong>
              </div>

              <div>
                <span className="dot negative-dot"></span>
                Negative
                <strong>10%</strong>
              </div>
            </div>
          </div>

          <div className="insight-box">
            <Sparkles size={19} />
            Customers are generally satisfied with food quality.
          </div>
        </div>
      </div>

      <div className="manager-grid">
        <div className="manager-panel">
          <div className="panel-header">
            <div>
              <h2>Top Performing Foods</h2>
              <span>AI ranked dishes</span>
            </div>
          </div>

          <div className="top-food-list">
            {[...foods]
              .sort((a, b) => b.score - a.score)
              .slice(0, 4)
              .map((food, index) => (
                <div className="top-food" key={food._id || food.id}>
                  <span className="food-rank">
                    #{index + 1}
                  </span>

                  <img src={food.image} alt={food.name} />

                  <div>
                    <strong>{food.name}</strong>
                    <span>
                      {food.reviews} reviews
                    </span>
                  </div>

                  <strong className="food-score">
                    â˜… {food.score}
                  </strong>
                </div>
              ))}
          </div>
        </div>

        <div className="manager-panel">
          <div className="panel-header">
            <div>
              <h2>Customer Feedback</h2>
              <span>Latest reviews</span>
            </div>

            <Link to="/manager/reviews">
              View All
            </Link>
          </div>

          <div className="feedback-list">
            <Feedback
              name="Priya M"
              text="Amazing taste! Will order again."
              rating="5"
            />

            <Feedback
              name="Karan S"
              text="Food was good but delivery was slow."
              rating="4"
            />

            <Feedback
              name="Megha R"
              text="Loved the packaging and taste!"
              rating="5"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon, title, value, change }) {
  return (
    <div className="metric-card">
      <div className="metric-icon">
        {icon}
      </div>

      <div>
        <span>{title}</span>
        <strong>{value}</strong>
        <small>{change}</small>
      </div>
    </div>
  );
}

function OrderTable() {
  const orders = [
    ["#1234", "Rahul K", "Chicken Burger x1", "â‚¹149", "Served"],
    ["#1235", "Sneha P", "Pizza x1, Coke x1", "â‚¹289", "Preparing"],
    ["#1236", "Aditya S", "Biryani x1", "â‚¹199", "Accepted"],
    ["#1237", "Priya M", "Burger x2", "â‚¹298", "Placed"]
  ];

  return (
    <div className="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Order</th>
            <th>Customer</th>
            <th>Items</th>
            <th>Amount</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          {orders.map((order) => (
            <tr key={order[0]}>
              <td>{order[0]}</td>
              <td>{order[1]}</td>
              <td>{order[2]}</td>
              <td>{order[3]}</td>
              <td>
                <span
                  className={`status-pill ${order[4]
                    .toLowerCase()
                    .replace(" ", "-")}`}
                >
                  {order[4]}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Feedback({ name, text, rating }) {
  return (
    <div className="feedback">
      <div className="feedback-avatar">
        {name.charAt(0)}
      </div>

      <div>
        <strong>{name}</strong>

        <div className="stars">
          {"â˜…".repeat(Number(rating))}
        </div>

        <p>{text}</p>
      </div>
    </div>
  );
}

/* ============================================================
   MANAGER ORDERS
   ============================================================ */

function ManagerOrders({ setOrderStatus }) {
  const [orders, setOrders] = useState([
    {
      id: "#1234",
      customer: "Rahul K",
      items: "Chicken Burger x1",
      amount: 149,
      status: "Placed"
    },
    {
      id: "#1235",
      customer: "Sneha P",
      items: "Pizza x1, Coke x1",
      amount: 289,
      status: "Preparing"
    },
    {
      id: "#1236",
      customer: "Aditya S",
      items: "Chicken Biryani x1",
      amount: 199,
      status: "Accepted"
    }
  ]);

  const updateOrder = (id) => {
    setOrders((current) =>
      current.map((order) =>
        order.id === id
          ? { ...order, status: "Served" }
          : order
      )
    );

    setOrderStatus("served");
  };

  return (
    <div className="manager-content">
      <div className="content-heading">
        <div>
          <span className="section-eyebrow">
            ORDER MANAGEMENT
          </span>
          <h1>Pending Orders</h1>
        </div>

        <div className="live-indicator">
          <span></span>
          Live
        </div>
      </div>

      <div className="order-manager-list">
        {orders.map((order) => (
          <div className="manager-order-card" key={order.id}>
            <div className="order-main">
              <span className="order-number">
                {order.id}
              </span>

              <div>
                <strong>{order.customer}</strong>
                <p>{order.items}</p>
              </div>
            </div>

            <strong>â‚¹{order.amount}</strong>

            <span className="status-pill">
              {order.status}
            </span>

            <button
              className="primary-small-button"
              onClick={() => updateOrder(order.id)}
            >
              <PackageCheck size={16} />
              Mark Served
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   MANAGER MENU
   ============================================================ */

function ManagerMenu({ foods }) {
  return (
    <div className="manager-content">
      <div className="content-heading">
        <div>
          <span className="section-eyebrow">
            MENU MANAGEMENT
          </span>
          <h1>AI Food Ranking</h1>
        </div>

        <button className="primary-button">
          <Plus size={18} />
          Add Food
        </button>
      </div>

      <div className="manager-food-grid">
        {[...foods]
          .sort((a, b) => b.score - a.score)
          .map((food, index) => (
            <div className="manager-food-card" key={food._id || food.id}>
              <div className="manager-food-image">
                <img src={food.image} alt={food.name} />

                <span>
                  #{index + 1}
                </span>
              </div>

              <div>
                <span>{food.category}</span>
                <h3>{food.name}</h3>

                <div className="food-score-row">
                  <strong>
                    â˜… {food.score}
                  </strong>

                  <span>
                    {food.reviews} reviews
                  </span>
                </div>

                <div className="manager-food-actions">
                  <button>Edit</button>
                  <button>Manage</button>
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

/* ============================================================
   MANAGER REVIEWS
   ============================================================ */

function ManagerReviews() {
  return (
    <div className="manager-content">
      <div className="content-heading">
        <div>
          <span className="section-eyebrow">
            CUSTOMER FEEDBACK
          </span>
          <h1>Reviews & AI Analysis</h1>
        </div>
      </div>

      <div className="review-dashboard">
        <div className="review-summary-card">
          <span>Overall Rating</span>
          <strong>4.3</strong>

          <div className="stars large-stars">
            â˜…â˜…â˜…â˜…â˜…
          </div>

          <small>542 customer reviews</small>
        </div>

        <div className="review-summary-card">
          <span>Positive Reviews</span>
          <strong>72%</strong>
          <div className="progress">
            <span style={{ width: "72%" }}></span>
          </div>
          <small>AI sentiment result</small>
        </div>

        <div className="review-summary-card">
          <span>Negative Reviews</span>
          <strong>10%</strong>
          <div className="progress negative">
            <span style={{ width: "10%" }}></span>
          </div>
          <small>Needs attention</small>
        </div>
      </div>

      <div className="manager-panel">
        <div className="panel-header">
          <div>
            <h2>Recent AI Analyzed Reviews</h2>
          </div>
        </div>

        <div className="full-feedback-list">
          <Feedback
            name="Priya M"
            text="Amazing taste! Fresh and delicious."
            rating="5"
          />

          <Feedback
            name="Karan S"
            text="Food was good but delivery was slow."
            rating="4"
          />

          <Feedback
            name="Megha R"
            text="Loved the packaging and taste!"
            rating="5"
          />

          <Feedback
            name="Arjun P"
            text="Food was a little cold when served."
            rating="2"
          />
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   MANAGER ANALYTICS
   ============================================================ */

function ManagerAnalytics() {
  return (
    <div className="manager-content">
      <div className="content-heading">
        <div>
          <span className="section-eyebrow">
            AI ANALYTICS
          </span>
          <h1>Food Performance Analytics</h1>
        </div>
      </div>

      <div className="analytics-grid">
        <div className="analytics-card">
          <span>Total Reviews</span>
          <strong>542</strong>
          <small>+24% this month</small>
        </div>

        <div className="analytics-card">
          <span>Positive Sentiment</span>
          <strong>72%</strong>
          <small>AI analyzed</small>
        </div>

        <div className="analytics-card">
          <span>Average Food Score</span>
          <strong>4.3 â˜…</strong>
          <small>+0.2 improvement</small>
        </div>

        <div className="analytics-card">
          <span>Top Food</span>
          <strong>Chicken Burger</strong>
          <small>4.7 score</small>
        </div>
      </div>

      <div className="manager-panel">
        <div className="panel-header">
          <div>
            <h2>Food Score Performance</h2>
            <span>AI-generated ranking trend</span>
          </div>
        </div>

        <div className="fake-chart">
          <div style={{ height: "35%" }}>
            <span>Mon</span>
          </div>

          <div style={{ height: "48%" }}>
            <span>Tue</span>
          </div>

          <div style={{ height: "44%" }}>
            <span>Wed</span>
          </div>

          <div style={{ height: "62%" }}>
            <span>Thu</span>
          </div>

          <div style={{ height: "70%" }}>
            <span>Fri</span>
          </div>

          <div style={{ height: "82%" }}>
            <span>Sat</span>
          </div>

          <div style={{ height: "92%" }}>
            <span>Sun</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;







