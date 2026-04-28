// backend/scripts/seedCategories.js
const mongoose = require("mongoose");
const dotenv   = require("dotenv");
dotenv.config({ path: "./.env" });
const Category = require("../models/categoryModel");
const slugify  = require("slugify");

const rawCategories = [
  { name:"Wall Decor",           description:"Paintings, mirrors, wall art, clocks" },
  { name:"Lighting",             description:"Table lamps, floor lamps, pendant lights" },
  { name:"Furniture",            description:"Sofas, tables, chairs, shelves" },
  { name:"Bed & Bath",           description:"Bedsheets, pillows, towels, bath mats" },
  { name:"Kitchen & Dining",     description:"Cutlery, cookware, dining sets" },
  { name:"Outdoor & Garden",     description:"Planters, garden furniture, outdoor lights" },
  { name:"Storage & Organizers", description:"Baskets, boxes, racks" },
  { name:"Curtains & Blinds",    description:"Window curtains, roller blinds" },
  { name:"Rugs & Carpets",       description:"Area rugs, door mats, runners" },
  { name:"Festive Decor",        description:"Diwali, Christmas, seasonal decorations" },
];

const categories = rawCategories.map(cart => ({
  name: cart.name,
  description: cart.description,
  slug: slugify(cart.name, { lower: true }),
}));

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    await Category.deleteMany({});
    const created = await Category.insertMany(categories);
    console.log(`✅ Seeded ${created.length} categories:`);
    created.forEach((c) => console.log(`   - ${c.name} (${c._id})`));
    process.exit(0);
  } catch (err) { console.error("❌ Seed error:", err.message); process.exit(1); }
};
seed();
