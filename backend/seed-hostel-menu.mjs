import mongoose from "mongoose";
import dotenv from "dotenv";
import Food from "./models/Food.js";

dotenv.config();

const menu = [

/* ===================== SOUTH INDIAN ===================== */

["Idli Sambar","South Indian",45,"Soft steamed idli served with hot sambar and chutney"],
["Mini Idli Sambar","South Indian",55,"Mini idlis served with sambar and coconut chutney"],
["Thatte Idli","South Indian",55,"Large Karnataka style soft idli"],
["Rava Idli","South Indian",60,"Steamed semolina idli with vegetables"],
["Kanchipuram Idli","South Indian",65,"Traditional spiced South Indian idli"],
["Masala Dosa","South Indian",89,"Crispy dosa filled with seasoned potato masala"],
["Plain Dosa","South Indian",69,"Classic crispy South Indian dosa"],
["Set Dosa","South Indian",79,"Soft fluffy set of dosas with chutney and sambar"],
["Rava Dosa","South Indian",89,"Crispy semolina dosa"],
["Onion Rava Dosa","South Indian",99,"Crispy rava dosa topped with onions"],
["Mysore Masala Dosa","South Indian",109,"Spicy Mysore chutney dosa with potato filling"],
["Paper Dosa","South Indian",109,"Extra thin and crispy dosa"],
["Cheese Dosa","South Indian",119,"Crispy dosa with melted cheese"],
["Paneer Dosa","South Indian",129,"Dosa stuffed with spiced paneer"],
["Onion Dosa","South Indian",89,"Crispy dosa topped with fresh onions"],
["Podi Dosa","South Indian",85,"Dosa with aromatic South Indian podi"],
["Uttapam","South Indian",79,"Soft thick dosa topped with vegetables"],
["Onion Uttapam","South Indian",89,"Uttapam topped with onions"],
["Tomato Uttapam","South Indian",89,"Uttapam topped with tomatoes"],
["Vegetable Uttapam","South Indian",99,"Mixed vegetable uttapam"],
["Ven Pongal","South Indian",69,"Rice and lentil Pongal with pepper and ghee"],
["Khara Bath","South Indian",55,"Savory Karnataka style semolina breakfast"],
["Kesari Bath","South Indian",55,"Sweet saffron semolina dessert"],
["Bisibele Bath","South Indian",89,"Karnataka style rice and lentil dish"],
["Curd Rice","South Indian",65,"South Indian rice mixed with seasoned curd"],
["Lemon Rice","South Indian",69,"Tangy lemon flavored rice"],
["Tamarind Rice","South Indian",69,"Traditional puliyogare rice"],
["Vegetable Upma","South Indian",55,"Savory semolina breakfast with vegetables"],
["Medu Vada","South Indian",55,"Crispy lentil fritters with chutney and sambar"],
["Vada Sambar","South Indian",65,"Medu vada served with hot sambar"],

/* ===================== NORTH INDIAN ===================== */

["Aloo Paratha","North Indian",75,"Stuffed wheat paratha with spiced potato"],
["Paneer Paratha","North Indian",95,"Stuffed paneer paratha"],
["Gobi Paratha","North Indian",85,"Stuffed cauliflower paratha"],
["Methi Paratha","North Indian",75,"Fresh fenugreek flavored paratha"],
["Mix Veg Paratha","North Indian",85,"Mixed vegetable stuffed paratha"],
["Poori Bhaji","North Indian",79,"Puffy puris served with potato curry"],
["Chole Bhature","North Indian",119,"Spiced chickpeas with fluffy bhature"],
["Rajma Chawal","North Indian",109,"Rajma curry served with steamed rice"],
["Dal Makhani","North Indian",129,"Slow cooked black lentils"],
["Dal Tadka","North Indian",99,"Yellow dal tempered with Indian spices"],
["Dal Fry","North Indian",89,"Classic Indian yellow lentil curry"],
["Palak Paneer","North Indian",149,"Paneer cooked in creamy spinach gravy"],
["Kadai Paneer","North Indian",159,"Paneer with capsicum in kadai masala"],
["Shahi Paneer","North Indian",159,"Paneer in rich creamy tomato gravy"],
["Paneer Butter Masala","North Indian",169,"Paneer in buttery tomato gravy"],
["Matar Paneer","North Indian",149,"Paneer and peas curry"],
["Chana Masala","North Indian",99,"Spicy chickpea curry"],
["Aloo Gobi","North Indian",99,"Potato and cauliflower curry"],
["Mix Veg Curry","North Indian",119,"Seasonal mixed vegetable curry"],
["Jeera Aloo","North Indian",89,"Potatoes tempered with cumin"],
["Veg Kofta Curry","North Indian",139,"Vegetable dumplings in rich gravy"],
["Butter Naan","North Indian",45,"Soft naan brushed with butter"],
["Plain Naan","North Indian",35,"Classic tandoor naan"],
["Garlic Naan","North Indian",55,"Naan topped with garlic and coriander"],
["Tandoori Roti","North Indian",30,"Whole wheat tandoor roti"],
["Butter Roti","North Indian",35,"Whole wheat roti with butter"],
["Lachha Paratha","North Indian",55,"Layered flaky Indian bread"],
["Pulao","North Indian",99,"Fragrant vegetable rice"],
["Veg Thali","North Indian",169,"Complete North Indian vegetarian meal"],
["North Indian Special Thali","North Indian",199,"Premium complete North Indian thali"],

/* ===================== RICE & BIRYANI ===================== */

["Chicken Biryani","Rice & Biryani",199,"Aromatic basmati rice with spiced chicken"],
["Mutton Biryani","Rice & Biryani",249,"Fragrant biryani with tender mutton"],
["Egg Biryani","Rice & Biryani",159,"Basmati biryani with boiled eggs"],
["Veg Biryani","Rice & Biryani",149,"Aromatic vegetable dum biryani"],
["Paneer Biryani","Rice & Biryani",169,"Paneer and basmati rice biryani"],
["Hyderabadi Chicken Biryani","Rice & Biryani",219,"Hyderabadi style chicken dum biryani"],
["Chicken Fried Rice","Rice & Biryani",159,"Indo-Chinese fried rice with chicken"],
["Veg Fried Rice","Rice & Biryani",119,"Vegetable Indo-Chinese fried rice"],
["Egg Fried Rice","Rice & Biryani",139,"Fried rice with scrambled egg"],
["Paneer Fried Rice","Rice & Biryani",149,"Fried rice with paneer"],
["Jeera Rice","Rice & Biryani",89,"Basmati rice tempered with cumin"],
["Steamed Rice","Rice & Biryani",69,"Fresh steamed rice"],
["Ghee Rice","Rice & Biryani",109,"Aromatic rice cooked with ghee"],
["Chicken Rice Bowl","Rice & Biryani",179,"Chicken served over seasoned rice"],
["Veg Rice Bowl","Rice & Biryani",139,"Mixed vegetables served over rice"],

/* ===================== CHINESE ===================== */

["Veg Hakka Noodles","Chinese",119,"Stir fried noodles with fresh vegetables"],
["Chicken Hakka Noodles","Chinese",159,"Stir fried noodles with chicken"],
["Egg Hakka Noodles","Chinese",139,"Hakka noodles with egg"],
["Schezwan Noodles","Chinese",129,"Spicy Schezwan vegetable noodles"],
["Chicken Schezwan Noodles","Chinese",169,"Spicy noodles with chicken"],
["Veg Manchurian","Chinese",129,"Crispy vegetable balls in Manchurian sauce"],
["Chicken Manchurian","Chinese",169,"Chicken tossed in Manchurian sauce"],
["Gobi Manchurian","Chinese",119,"Crispy cauliflower in Indo-Chinese sauce"],
["Paneer Chilli","Chinese",149,"Paneer tossed with peppers and chilli sauce"],
["Chicken Chilli","Chinese",179,"Chicken with peppers and spicy sauce"],
["Chilli Gobi","Chinese",129,"Crispy cauliflower with chilli sauce"],
["Veg Spring Roll","Chinese",99,"Crispy vegetable spring rolls"],
["Chicken Spring Roll","Chinese",139,"Crispy chicken spring rolls"],
["Veg Momos","Chinese",109,"Steamed vegetable dumplings"],
["Chicken Momos","Chinese",149,"Steamed chicken dumplings"],
["Fried Veg Momos","Chinese",119,"Crispy fried vegetable momos"],
["Fried Chicken Momos","Chinese",159,"Crispy fried chicken momos"],
["Schezwan Fried Rice","Chinese",139,"Spicy Schezwan fried rice"],
["Chicken Schezwan Rice","Chinese",179,"Schezwan rice with chicken"],
["Dragon Chicken","Chinese",189,"Crispy chicken in spicy Indo-Chinese sauce"],

/* ===================== FAST FOOD ===================== */

["Chicken Burger","Fast Food",149,"Crispy chicken burger with fresh vegetables"],
["Veg Burger","Fast Food",109,"Vegetable patty burger with fresh salad"],
["Paneer Burger","Fast Food",129,"Spiced paneer patty burger"],
["Cheese Burger","Fast Food",139,"Classic burger with melted cheese"],
["Chicken Cheese Burger","Fast Food",169,"Chicken burger with cheese"],
["Veg Pizza","Fast Food",179,"Vegetable loaded pizza"],
["Paneer Pizza","Fast Food",229,"Paneer topped cheesy pizza"],
["Chicken Pizza","Fast Food",249,"Chicken loaded cheesy pizza"],
["Margherita Pizza","Fast Food",159,"Classic tomato and mozzarella pizza"],
["Farmhouse Pizza","Fast Food",219,"Vegetable loaded farmhouse pizza"],
["French Fries","Fast Food",99,"Crispy golden potato fries"],
["Peri Peri Fries","Fast Food",119,"French fries with peri peri seasoning"],
["Cheese Fries","Fast Food",139,"Fries topped with melted cheese"],
["Chicken Wrap","Fast Food",159,"Grilled chicken wrap with vegetables"],
["Paneer Wrap","Fast Food",139,"Spiced paneer vegetable wrap"],
["Veg Sandwich","Fast Food",89,"Fresh vegetable grilled sandwich"],
["Cheese Sandwich","Fast Food",109,"Grilled cheese sandwich"],
["Chicken Sandwich","Fast Food",139,"Chicken grilled sandwich"],
["Club Sandwich","Fast Food",159,"Loaded triple layer club sandwich"],
["Veg Grilled Sandwich","Fast Food",99,"Grilled vegetable sandwich"],

/* ===================== SNACKS ===================== */

["Samosa","Snacks",25,"Crispy pastry filled with spiced potato"],
["Paneer Samosa","Snacks",35,"Crispy samosa with paneer filling"],
["Aloo Bonda","Snacks",35,"Potato fritter with South Indian spices"],
["Mysore Bonda","Snacks",45,"Soft crispy Karnataka style bonda"],
["Onion Pakoda","Snacks",45,"Crispy onion fritters"],
["Bread Pakoda","Snacks",49,"Bread fritter with spiced potato filling"],
["Mirchi Bajji","Snacks",45,"Batter fried green chilli fritter"],
["Veg Cutlet","Snacks",49,"Crispy vegetable cutlet"],
["Paneer Cutlet","Snacks",69,"Crispy paneer vegetable cutlet"],
["Masala Vada","Snacks",45,"Crispy chana dal fritter"],
["Peanut Masala","Snacks",55,"Spiced roasted peanuts"],
["Sweet Corn","Snacks",59,"Steamed sweet corn with seasoning"],
["Masala Corn","Snacks",69,"Spicy butter masala corn"],
["French Fries Masala","Snacks",109,"Masala seasoned crispy fries"],
["Maggi","Snacks",59,"Classic instant noodles with spices"],
["Masala Maggi","Snacks",69,"Spicy masala noodles"],
["Veg Maggi","Snacks",79,"Noodles with mixed vegetables"],
["Cheese Maggi","Snacks",99,"Maggi noodles with cheese"],
["Egg Maggi","Snacks",89,"Maggi noodles with egg"],
["Pav Bhaji","Snacks",99,"Mumbai style spiced vegetable bhaji with pav"],

/* ===================== BEVERAGES ===================== */

["Tea","Beverages",20,"Hot Indian milk tea"],
["Masala Tea","Beverages",25,"Tea infused with aromatic spices"],
["Ginger Tea","Beverages",25,"Fresh ginger milk tea"],
["Green Tea","Beverages",30,"Light refreshing green tea"],
["Coffee","Beverages",30,"Fresh hot South Indian filter coffee"],
["Filter Coffee","Beverages",35,"Traditional South Indian filter coffee"],
["Cold Coffee","Beverages",69,"Chilled creamy coffee"],
["Cold Coffee With Ice Cream","Beverages",99,"Cold coffee topped with ice cream"],
["Hot Chocolate","Beverages",79,"Rich hot chocolate"],
["Badam Milk","Beverages",59,"Creamy almond flavored milk"],
["Rose Milk","Beverages",49,"Chilled rose flavored milk"],
["Lassi","Beverages",59,"Traditional chilled yogurt drink"],
["Sweet Lassi","Beverages",59,"Sweet creamy Punjabi lassi"],
["Salted Lassi","Beverages",59,"Refreshing salted lassi"],
["Buttermilk","Beverages",35,"Spiced chilled buttermilk"],
["Mango Lassi","Beverages",79,"Mango blended yogurt drink"],

/* ===================== JUICES ===================== */

["Fresh Lime Juice","Juices",45,"Fresh lime juice served chilled"],
["Sweet Lime Juice","Juices",59,"Fresh sweet lime juice"],
["Orange Juice","Juices",69,"Fresh orange juice"],
["Watermelon Juice","Juices",59,"Fresh watermelon juice"],
["Pineapple Juice","Juices",69,"Fresh pineapple juice"],
["Mango Juice","Juices",69,"Refreshing mango juice"],
["Apple Juice","Juices",79,"Refreshing apple juice"],
["Grape Juice","Juices",69,"Fresh grape juice"],
["Pomegranate Juice","Juices",99,"Fresh pomegranate juice"],
["Carrot Juice","Juices",69,"Fresh carrot juice"],
["ABC Juice","Juices",89,"Apple beetroot carrot juice"],
["Fruit Punch","Juices",89,"Mixed seasonal fruit punch"],
["Mango Shake","Juices",89,"Creamy fresh mango shake"],
["Banana Shake","Juices",79,"Fresh banana milkshake"],
["Strawberry Shake","Juices",99,"Creamy strawberry milkshake"],
["Chocolate Shake","Juices",129,"Rich chocolate milkshake"],
["Oreo Shake","Juices",119,"Creamy Oreo milkshake"],
["Dry Fruit Shake","Juices",139,"Premium mixed dry fruit shake"],

/* ===================== ICE CREAM ===================== */

["Vanilla Ice Cream","Ice Cream",59,"Classic vanilla ice cream"],
["Chocolate Ice Cream","Ice Cream",69,"Rich chocolate ice cream"],
["Strawberry Ice Cream","Ice Cream",69,"Creamy strawberry ice cream"],
["Butterscotch Ice Cream","Ice Cream",69,"Butterscotch ice cream with crunchy bits"],
["Mango Ice Cream","Ice Cream",69,"Mango flavored ice cream"],
["Pista Ice Cream","Ice Cream",69,"Creamy pistachio ice cream"],
["Black Currant Ice Cream","Ice Cream",79,"Rich black currant ice cream"],
["Kesar Pista Ice Cream","Ice Cream",89,"Saffron pistachio ice cream"],
["Chocolate Sundae","Ice Cream",99,"Chocolate ice cream sundae"],
["Fruit Sundae","Ice Cream",119,"Ice cream with fresh fruits"],

/* ===================== DESSERTS ===================== */

["Gulab Jamun","Desserts",45,"Soft gulab jamun served warm"],
["Gulab Jamun With Ice Cream","Desserts",89,"Warm gulab jamun with vanilla ice cream"],
["Rasmalai","Desserts",79,"Soft cottage cheese dumplings in saffron milk"],
["Kheer","Desserts",59,"Traditional rice pudding"],
["Rice Payasam","Desserts",59,"South Indian rice payasam"],
["Carrot Halwa","Desserts",69,"Slow cooked carrot dessert"],
["Moong Dal Halwa","Desserts",79,"Rich traditional lentil halwa"],
["Gajar Ka Halwa","Desserts",69,"Indian carrot pudding"],
["Jalebi","Desserts",49,"Crispy syrup soaked jalebi"],
["Jalebi With Rabdi","Desserts",89,"Jalebi served with creamy rabdi"],
["Brownie","Desserts",79,"Soft chocolate brownie"],
["Brownie With Ice Cream","Desserts",119,"Warm brownie with ice cream"],
["Chocolate Cake","Desserts",89,"Moist chocolate cake"],
["Black Forest Cake","Desserts",99,"Classic black forest cake"],
["Fruit Salad","Desserts",79,"Fresh seasonal fruit salad"],

/* ===================== NON VEG ===================== */

["Chicken Curry","Non-Veg",179,"Indian style chicken curry"],
["Butter Chicken","Non-Veg",199,"Creamy tomato butter chicken"],
["Kadai Chicken","Non-Veg",189,"Chicken cooked in kadai masala"],
["Chicken Tikka","Non-Veg",189,"Tandoori marinated chicken pieces"],
["Chicken 65","Non-Veg",169,"Crispy spicy South Indian chicken"],
["Chicken Lollipop","Non-Veg",199,"Crispy chicken lollipop"],
["Pepper Chicken","Non-Veg",189,"Spicy black pepper chicken"],
["Chicken Kebab","Non-Veg",179,"Grilled spiced chicken kebab"],
["Egg Curry","Non-Veg",119,"Boiled eggs in Indian curry"],
["Egg Bhurji","Non-Veg",99,"Spiced scrambled egg"],
["Omelette","Non-Veg",59,"Classic Indian omelette"],
["Masala Omelette","Non-Veg",69,"Omelette with onion chilli and spices"],
["Chicken Tandoori","Non-Veg",229,"Tandoori roasted chicken"],
["Mutton Curry","Non-Veg",229,"Slow cooked mutton curry"],
["Chicken Thali","Non-Veg",229,"Complete chicken meal with rice and sides"],
["Egg Fried Rice","Non-Veg",139,"Fried rice with egg"],
["Chicken Noodles","Non-Veg",159,"Stir fried noodles with chicken"],
["Chicken Roll","Non-Veg",149,"Spiced chicken roll"],
["Egg Roll","Non-Veg",99,"Indian egg kathi roll"],
["Chicken Kathi Roll","Non-Veg",169,"Chicken kathi roll with onions and sauces"]

];

await mongoose.connect(process.env.MONGO_URI);

console.log("\n🔥 FoodSense AI — 10X MENU SYNC");
console.log("====================================");
console.log(`📦 Dataset items prepared: ${menu.length}`);

let added = 0;
let updated = 0;
let skipped = 0;

for (const [name, category, price, description] of menu) {

  const existing = await Food.findOne({
    name: { $regex: `^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" }
  });

  if (existing) {
    existing.category = existing.category || category;
    existing.price = existing.price || price;
    existing.description = existing.description || description;
    existing.image = existing.image || `https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=900&q=80`;
    existing.rating = existing.rating ?? 4.2;
    existing.score = existing.score ?? existing.rating;
    existing.reviews = existing.reviews ?? 0;
    existing.totalPositive = existing.totalPositive ?? 0;
    existing.totalNeutral = existing.totalNeutral ?? 0;
    existing.totalNegative = existing.totalNegative ?? 0;
    existing.isAvailable = true;

    await existing.save();
    updated++;
    continue;
  }

  await Food.create({
    name,
    category,
    price,
    description,
    image: `https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=900&q=80`,
    rating: 4.2,
    score: 4.2,
    reviews: 0,
    totalPositive: 0,
    totalNeutral: 0,
    totalNegative: 0,
    isAvailable: true
  });

  added++;
}

const total = await Food.countDocuments();

console.log("\n====================================");
console.log(`🆕 Added     : ${added}`);
console.log(`🔄 Updated   : ${updated}`);
console.log(`⏭️ Existing  : ${skipped}`);
console.log(`🍽️ DB TOTAL  : ${total}`);
console.log("====================================");

const categories = await Food.aggregate([
  { $match: { isAvailable: true } },
  { $group: { _id: "$category", count: { $sum: 1 } } },
  { $sort: { _id: 1 } }
]);

console.table(categories);

await mongoose.disconnect();

console.log("\n🎉 DATASET SYNC COMPLETE");
