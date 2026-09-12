const mongoose = require("mongoose");
const Food = require("./models/Food");

const MONGO_URI =
  process.env.MONGO_URI ||
  "mongodb://127.0.0.1:27017/foodsense_ai";

const images = {
  SouthIndian:
    "https://images.unsplash.com/photo-1630383249896-424e482df921?auto=format&fit=crop&w=900&q=85",

  Biryani:
    "https://images.unsplash.com/photo-1563379091339-03246963d96c?auto=format&fit=crop&w=900&q=85",

  Pizza:
    "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=900&q=85",

  Burger:
    "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=85",

  Chinese:
    "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=900&q=85",

  Snacks:
    "https://images.unsplash.com/photo-1628294895950-9805252327bc?auto=format&fit=crop&w=900&q=85",

  Curry:
    "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=900&q=85",

  Drinks:
    "https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=900&q=85",

  Dessert:
    "https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&w=900&q=85",

  Rice:
    "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=900&q=85"
};

const groups = [

  {
    category: "South Indian",
    image: images.SouthIndian,
    items: [
      ["Idli",40,"Soft steamed rice cakes"],
      ["Masala Dosa",89,"Crispy dosa with spiced potato filling"],
      ["Plain Dosa",59,"Traditional crisp South Indian dosa"],
      ["Set Dosa",69,"Soft fluffy dosa served with chutney"],
      ["Rava Dosa",79,"Thin crispy semolina dosa"],
      ["Onion Dosa",75,"Crispy dosa topped with onions"],
      ["Mysore Masala Dosa",99,"Spicy Mysore style dosa"],
      ["Cheese Dosa",109,"Crispy dosa with melted cheese"],
      ["Paneer Dosa",119,"Dosa filled with seasoned paneer"],
      ["Idli Vada",55,"Classic idli and crispy vada"],
      ["Medu Vada",50,"Crispy lentil fritters"],
      ["Sambar Vada",65,"Vada soaked in flavorful sambar"],
      ["Curd Vada",70,"Soft vada with seasoned curd"],
      ["Ven Pongal",75,"Comforting rice and lentil pongal"],
      ["Bisibele Bath",80,"Spiced rice and lentil Karnataka classic"],
      ["Puliyogare",70,"Tangy tamarind rice"],
      ["Lemon Rice",65,"Fresh lemon flavored rice"],
      ["Coconut Rice",65,"Fragrant coconut rice"],
      ["Tomato Bath",70,"Spiced tomato rice"],
      ["Poori Sagu",85,"Fluffy pooris with vegetable sagu"]
    ]
  },

  {
    category: "Biryani",
    image: images.Biryani,
    items: [
      ["Chicken Biryani",199,"Aromatic basmati rice with tender chicken"],
      ["Mutton Biryani",279,"Rich biryani with tender mutton"],
      ["Egg Biryani",149,"Fragrant rice with seasoned eggs"],
      ["Paneer Biryani",179,"Aromatic rice with spiced paneer"],
      ["Veg Biryani",139,"Classic vegetable dum biryani"],
      ["Mushroom Biryani",159,"Fragrant mushroom biryani"],
      ["Hyderabadi Chicken Biryani",219,"Authentic spicy Hyderabadi biryani"],
      ["Donne Chicken Biryani",189,"Karnataka style donne biryani"],
      ["Andhra Chicken Biryani",209,"Spicy Andhra inspired chicken biryani"],
      ["Chicken Tikka Biryani",229,"Biryani with smoky chicken tikka"],
      ["Kolkata Chicken Biryani",209,"Light aromatic Kolkata style biryani"],
      ["Jeera Rice",89,"Fragrant cumin flavored rice"],
      ["Chicken Rice",169,"Indo-Chinese chicken rice"],
      ["Egg Rice",129,"Fried rice with egg"],
      ["Veg Fried Rice",119,"Wok tossed vegetable fried rice"]
    ]
  },

  {
    category: "Pizza",
    image: images.Pizza,
    items: [
      ["Paneer Pizza",229,"Cheesy pizza topped with paneer"],
      ["Margherita Pizza",199,"Classic tomato, basil and mozzarella"],
      ["Farmhouse Pizza",249,"Fresh vegetables and melted cheese"],
      ["Veg Loaded Pizza",259,"Loaded with fresh vegetables"],
      ["Corn Cheese Pizza",219,"Sweet corn and cheese topping"],
      ["Mushroom Pizza",239,"Mushroom and mozzarella pizza"],
      ["Paneer Tikka Pizza",269,"Paneer tikka with Indian spices"],
      ["Chicken Pizza",279,"Chicken topped cheesy pizza"],
      ["Chicken Tikka Pizza",299,"Smoky chicken tikka pizza"],
      ["Peri Peri Chicken Pizza",309,"Spicy peri peri chicken pizza"],
      ["Cheese Burst Pizza",289,"Extra cheesy cheese burst pizza"],
      ["Double Cheese Pizza",249,"Double layer cheese pizza"]
    ]
  },

  {
    category: "Burgers",
    image: images.Burger,
    items: [
      ["Chicken Burger",149,"Juicy grilled chicken with fresh vegetables"],
      ["Veg Burger",109,"Classic vegetable patty burger"],
      ["Cheese Burger",139,"Crispy patty with melted cheese"],
      ["Paneer Burger",149,"Spiced paneer patty burger"],
      ["Chicken Cheese Burger",179,"Chicken patty with creamy cheese"],
      ["Crispy Chicken Burger",169,"Crispy chicken with fresh lettuce"],
      ["Peri Peri Chicken Burger",179,"Spicy peri peri chicken burger"],
      ["Double Chicken Burger",219,"Double chicken patty burger"],
      ["Mushroom Burger",139,"Savory mushroom vegetable burger"],
      ["Aloo Tikki Burger",99,"Crispy Indian potato patty burger"]
    ]
  },

  {
    category: "Chinese",
    image: images.Chinese,
    items: [
      ["Veg Hakka Noodles",119,"Wok tossed noodles with vegetables"],
      ["Chicken Hakka Noodles",159,"Chicken noodles with Chinese spices"],
      ["Schezwan Noodles",139,"Spicy Schezwan style noodles"],
      ["Egg Noodles",139,"Wok tossed noodles with egg"],
      ["Veg Manchurian",129,"Crispy vegetable balls in Manchurian sauce"],
      ["Chicken Manchurian",169,"Chicken pieces in Manchurian sauce"],
      ["Gobi Manchurian",119,"Crispy cauliflower in spicy sauce"],
      ["Paneer Manchurian",149,"Paneer tossed in Indo-Chinese sauce"],
      ["Chilli Paneer",159,"Paneer with peppers and chilli sauce"],
      ["Chilli Chicken",179,"Spicy chicken with peppers"],
      ["Veg Fried Rice",119,"Classic Chinese vegetable fried rice"],
      ["Chicken Fried Rice",159,"Wok tossed chicken fried rice"],
      ["Schezwan Fried Rice",139,"Spicy Schezwan fried rice"],
      ["Egg Fried Rice",129,"Fried rice with scrambled egg"],
      ["American Chopsuey",159,"Crispy noodles with sweet spicy sauce"]
    ]
  },

  {
    category: "Snacks",
    image: images.Snacks,
    items: [
      ["French Fries",99,"Crispy golden potato fries"],
      ["Peri Peri Fries",119,"Fries tossed in peri peri seasoning"],
      ["Cheese Fries",139,"Crispy fries with cheese"],
      ["Samosa",25,"Crispy pastry filled with spiced potato"],
      ["Paneer Samosa",35,"Crispy samosa with paneer filling"],
      ["Bread Pakoda",45,"Crispy bread fritter"],
      ["Onion Pakoda",50,"Crispy onion fritters"],
      ["Paneer Pakoda",80,"Golden fried paneer fritters"],
      ["Aloo Bonda",45,"South Indian potato fritter"],
      ["Cutlet",50,"Crispy vegetable cutlet"],
      ["Veg Sandwich",89,"Fresh vegetable grilled sandwich"],
      ["Cheese Sandwich",109,"Grilled sandwich with cheese"],
      ["Paneer Sandwich",119,"Grilled paneer sandwich"],
      ["Chicken Sandwich",139,"Chicken and vegetable sandwich"],
      ["Garlic Bread",99,"Toasted garlic bread"],
      ["Cheese Garlic Bread",139,"Garlic bread topped with cheese"],
      ["Spring Roll",109,"Crispy vegetable spring rolls"],
      ["Chicken Spring Roll",139,"Crispy chicken spring rolls"],
      ["Momos",109,"Steamed dumplings with vegetable filling"],
      ["Chicken Momos",139,"Steamed chicken dumplings"]
    ]
  },

  {
    category: "Curries",
    image: images.Curry,
    items: [
      ["Paneer Butter Masala",179,"Creamy tomato curry with paneer"],
      ["Kadai Paneer",169,"Paneer cooked with capsicum and spices"],
      ["Palak Paneer",169,"Paneer in creamy spinach gravy"],
      ["Shahi Paneer",179,"Rich creamy Mughlai paneer curry"],
      ["Chana Masala",129,"Spiced chickpea curry"],
      ["Dal Tadka",109,"Yellow dal tempered with spices"],
      ["Dal Makhani",139,"Slow cooked creamy black lentils"],
      ["Rajma Masala",129,"Kidney beans cooked in Indian gravy"],
      ["Mix Veg Curry",139,"Mixed vegetables in aromatic gravy"],
      ["Veg Korma",159,"Creamy mixed vegetable curry"],
      ["Chicken Curry",189,"Traditional Indian chicken curry"],
      ["Butter Chicken",219,"Creamy tomato chicken curry"],
      ["Kadai Chicken",209,"Spicy chicken cooked with capsicum"],
      ["Chicken Tikka Masala",229,"Grilled chicken in tomato gravy"],
      ["Mutton Curry",259,"Slow cooked mutton curry"]
    ]
  },

  {
    category: "Rice",
    image: images.Rice,
    items: [
      ["Steamed Rice",59,"Simple steamed rice"],
      ["Jeera Rice",89,"Fragrant cumin rice"],
      ["Ghee Rice",99,"Aromatic rice cooked with ghee"],
      ["Veg Pulao",109,"Fragrant rice with mixed vegetables"],
      ["Paneer Pulao",139,"Aromatic rice with paneer"],
      ["Peas Pulao",99,"Fragrant basmati rice with green peas"],
      ["Curd Rice",69,"Cooling rice mixed with seasoned curd"],
      ["Tamarind Rice",70,"Tangy South Indian rice"],
      ["Lemon Rice",65,"Fresh lemon flavored rice"],
      ["Coconut Rice",65,"Fragrant coconut rice"]
    ]
  },

  {
    category: "Drinks",
    image: images.Drinks,
    items: [
      ["Masala Chai",30,"Indian spiced tea"],
      ["Filter Coffee",40,"South Indian filter coffee"],
      ["Cold Coffee",89,"Chilled creamy coffee"],
      ["Chocolate Shake",129,"Rich chocolate milkshake"],
      ["Vanilla Shake",119,"Creamy vanilla milkshake"],
      ["Strawberry Shake",129,"Fresh strawberry milkshake"],
      ["Mango Shake",129,"Creamy mango shake"],
      ["Banana Shake",99,"Fresh banana milkshake"],
      ["Fresh Lime Soda",59,"Refreshing lime soda"],
      ["Sweet Lassi",69,"Traditional sweet yogurt drink"],
      ["Salt Lassi",59,"Refreshing salted lassi"],
      ["Mango Lassi",89,"Creamy mango yogurt drink"],
      ["Buttermilk",39,"Spiced traditional buttermilk"],
      ["Watermelon Juice",79,"Fresh watermelon juice"],
      ["Orange Juice",89,"Fresh orange juice"]
    ]
  },

  {
    category: "Desserts",
    image: images.Dessert,
    items: [
      ["Gulab Jamun",59,"Soft milk dumplings in sugar syrup"],
      ["Rasmalai",79,"Soft cheese dumplings in creamy milk"],
      ["Gajar Halwa",79,"Indian carrot dessert"],
      ["Rice Kheer",69,"Creamy rice pudding"],
      ["Chocolate Brownie",99,"Warm chocolate brownie"],
      ["Brownie with Ice Cream",149,"Brownie served with vanilla ice cream"],
      ["Vanilla Ice Cream",69,"Classic creamy vanilla ice cream"],
      ["Chocolate Ice Cream",79,"Rich chocolate ice cream"],
      ["Butterscotch Ice Cream",79,"Crunchy butterscotch ice cream"],
      ["Mango Ice Cream",79,"Creamy mango ice cream"],
      ["Fruit Salad",89,"Fresh seasonal fruit bowl"],
      ["Fruit Cream",109,"Fresh fruits with creamy dressing"]
    ]
  }

];

function buildFoods() {
  const foods = [];

  for (const group of groups) {
    for (const item of group.items) {

      const [name, price, description] = item;

      const baseRating =
        4.1 +
        ((name.length + price) % 9) / 10;

      const rating =
        Math.min(4.9, Number(baseRating.toFixed(1)));

      foods.push({
        name,
        category: group.category,
        price,
        description,
        image: group.image,
        rating,
        score: rating,
        reviews:
          35 + ((name.length * 17 + price) % 260),
        totalPositive: 0,
        totalNeutral: 0,
        totalNegative: 0,
        isAvailable: true
      });
    }
  }

  return foods;
}

async function seed() {

  await mongoose.connect(MONGO_URI);

  console.log("✅ MongoDB connected");

  const foods = buildFoods();

  console.log(`🍽️ Preparing ${foods.length} food items...`);

  let inserted = 0;
  let updated = 0;

  for (const food of foods) {

    const existing =
      await Food.findOne({
        name: food.name
      });

    if (existing) {

      await Food.updateOne(
        { _id: existing._id },
        {
          $set: {
            category: food.category,
            price: food.price,
            description: food.description,
            image: food.image,
            isAvailable: true
          }
        }
      );

      updated++;

    } else {

      await Food.create(food);

      inserted++;
    }
  }

  console.log("");
  console.log("======================================");
  console.log("🔥 FOODSENSE MASTER MENU READY");
  console.log("======================================");
  console.log(`🍽️ Total catalog: ${foods.length}`);
  console.log(`➕ New foods: ${inserted}`);
  console.log(`♻️ Existing updated: ${updated}`);
  console.log("======================================");

  const count =
    await Food.countDocuments({
      isAvailable: true
    });

  console.log(
    `✅ Available foods in MongoDB: ${count}`
  );

  await mongoose.disconnect();
}

seed().catch(async (error) => {

  console.error("❌ SEED ERROR");
  console.error(error);

  try {
    await mongoose.disconnect();
  } catch {}

  process.exit(1);
});

