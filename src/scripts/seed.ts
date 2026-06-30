/**
 * Seed script for SeatSpot
 * Run with: npx ts-node --project tsconfig.json src/scripts/seed.ts
 * Or via: npm run seed (after adding to package.json scripts)
 */

import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const MONGODB_URI = process.env.MONGODB_URI ?? "mongodb://localhost:27017/SeatSpotDB";

// ── Inline schemas (avoids next.js module resolution issues in ts-node) ───────

const userSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true },
    password: String,
    role: { type: String, enum: ["CUSTOMER", "OWNER", "ADMIN"], default: "CUSTOMER" },
    image: String,
  },
  { timestamps: true }
);
const User = mongoose.models.User ?? mongoose.model("User", userSchema);

const restaurantSchema = new mongoose.Schema(
  {
    name: String,
    description: String,
    cuisine: String,
    address: String,
    city: String,
    phone: String,
    logo: String,
    coverImage: String,
    status: { type: String, enum: ["PENDING", "APPROVED", "REJECTED"], default: "PENDING" },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);
const Restaurant = mongoose.models.Restaurant ?? mongoose.model("Restaurant", restaurantSchema);

const tableSchema = new mongoose.Schema(
  {
    number: Number,
    capacity: Number,
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant" },
  },
  { timestamps: true }
);
const Table = mongoose.models.Table ?? mongoose.model("Table", tableSchema);

const menuItemSchema = new mongoose.Schema(
  {
    name: String,
    description: String,
    price: Number,
    category: String,
    image: String,
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant" },
  },
  { timestamps: true }
);
const MenuItem = mongoose.models.MenuItem ?? mongoose.model("MenuItem", menuItemSchema);

const reservationSchema = new mongoose.Schema(
  {
    date: String,
    startTime: String,
    endTime: String,
    partySize: Number,
    status: { type: String, enum: ["PENDING", "CONFIRMED", "CANCELLED"], default: "PENDING" },
    notes: String,
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    table: { type: mongoose.Schema.Types.ObjectId, ref: "Table" },
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant" },
  },
  { timestamps: true }
);
const Reservation = mongoose.models.Reservation ?? mongoose.model("Reservation", reservationSchema);

// ── Seed data ─────────────────────────────────────────────────────────────────

async function seed() {
  console.log("🌱 Connecting to MongoDB…");
  await mongoose.connect(MONGODB_URI);
  console.log("✅ Connected");

  // Clear existing data
  await Promise.all([
    User.deleteMany({}),
    Restaurant.deleteMany({}),
    Table.deleteMany({}),
    MenuItem.deleteMany({}),
    Reservation.deleteMany({}),
  ]);
  console.log("🗑️  Cleared existing data");

  const password = await bcrypt.hash("password123", 12);

  // ── Users ───────────────────────────────────────────────────────────────────
  const [admin, owner1, owner2, owner3, cust1, cust2, cust3, cust4, cust5] =
    await User.insertMany([
      { name: "Admin User", email: "admin@seatspot.com", password, role: "ADMIN" },
      { name: "Raj Sharma", email: "raj@owners.com", password, role: "OWNER" },
      { name: "Priya Patel", email: "priya@owners.com", password, role: "OWNER" },
      { name: "Aarav Mehta", email: "aarav@owners.com", password, role: "OWNER" },
      { name: "Ananya Gupta", email: "ananya@customers.com", password, role: "CUSTOMER" },
      { name: "Vikram Singh", email: "vikram@customers.com", password, role: "CUSTOMER" },
      { name: "Sneha Reddy", email: "sneha@customers.com", password, role: "CUSTOMER" },
      { name: "Arjun Nair", email: "arjun@customers.com", password, role: "CUSTOMER" },
      { name: "Kavya Menon", email: "kavya@customers.com", password, role: "CUSTOMER" },
    ]);
  console.log("👥 Created 9 users");

  // ── Restaurants ─────────────────────────────────────────────────────────────
  const [spiceGarden, italiaViva, sushiTokyo, thaiBistro, streetDhaba] =
    await Restaurant.insertMany([
      {
        name: "Spice Garden",
        description:
          "An authentic North Indian restaurant serving rich curries, tandoor specialties, and freshly baked naan. The aroma of our spices has been welcoming guests since 2010.",
        cuisine: "North Indian",
        address: "12 MG Road",
        city: "Mumbai",
        phone: "+91 98765 43210",
        status: "APPROVED",
        owner: owner1._id,
      },
      {
        name: "Italia Viva",
        description:
          "Bringing a slice of Italy to India — handmade pasta, wood-fired pizzas, and an extensive wine list in a cozy, European-inspired setting.",
        cuisine: "Italian",
        address: "45 Koregaon Park",
        city: "Pune",
        phone: "+91 91234 56789",
        status: "APPROVED",
        owner: owner1._id,
      },
      {
        name: "Sushi Tokyo",
        description:
          "Premium Japanese dining featuring nigiri, sashimi, and omakase menus. Fresh fish flown in weekly, crafted by our Tokyo-trained chef.",
        cuisine: "Japanese",
        address: "8 Indiranagar",
        city: "Bangalore",
        phone: "+91 80000 12345",
        status: "APPROVED",
        owner: owner2._id,
      },
      {
        name: "Thai Bistro",
        description:
          "A vibrant Thai restaurant with authentic flavours from Bangkok. From green curries to pad Thai, every dish is a journey to Southeast Asia.",
        cuisine: "Thai",
        address: "23 Jubilee Hills",
        city: "Hyderabad",
        phone: "+91 40000 67890",
        status: "PENDING",
        owner: owner2._id,
      },
      {
        name: "Street Dhaba",
        description:
          "Experience the rustic flavours of Punjab in a modern setting. Butter chicken, dal makhani, and lassi so thick you'll need a spoon.",
        cuisine: "Punjabi",
        address: "7 Connaught Place",
        city: "Delhi",
        phone: "+91 11000 99999",
        status: "REJECTED",
        owner: owner3._id,
      },
    ]);
  console.log("🏪 Created 5 restaurants");

  // ── Tables ──────────────────────────────────────────────────────────────────
  const tablesToInsert = [];

  // Spice Garden — 5 tables
  for (let i = 1; i <= 5; i++) {
    tablesToInsert.push({ number: i, capacity: i <= 2 ? 2 : i <= 4 ? 4 : 6, restaurant: spiceGarden._id });
  }
  // Italia Viva — 4 tables
  for (let i = 1; i <= 4; i++) {
    tablesToInsert.push({ number: i, capacity: i <= 2 ? 2 : i <= 3 ? 4 : 8, restaurant: italiaViva._id });
  }
  // Sushi Tokyo — 4 tables
  for (let i = 1; i <= 4; i++) {
    tablesToInsert.push({ number: i, capacity: i <= 2 ? 2 : 4, restaurant: sushiTokyo._id });
  }

  const allTables = await Table.insertMany(tablesToInsert);
  const sgTables = allTables.slice(0, 5);
  const ivTables = allTables.slice(5, 9);
  const stTables = allTables.slice(9, 13);
  console.log("🪑 Created tables");

  // ── Menu Items ──────────────────────────────────────────────────────────────
  await MenuItem.insertMany([
    // Spice Garden
    { name: "Butter Chicken", description: "Tender chicken in rich tomato-cream gravy", price: 420, category: "Mains", restaurant: spiceGarden._id },
    { name: "Dal Makhani", description: "Slow-cooked black lentils with butter and cream", price: 280, category: "Mains", restaurant: spiceGarden._id },
    { name: "Garlic Naan", description: "Leavened flatbread baked in tandoor with garlic and butter", price: 80, category: "Breads", restaurant: spiceGarden._id },
    { name: "Samosa Platter", description: "Crispy pastry filled with spiced potatoes and peas", price: 120, category: "Starters", restaurant: spiceGarden._id },
    { name: "Gulab Jamun", description: "Soft milk dumplings soaked in rose-flavored sugar syrup", price: 110, category: "Desserts", restaurant: spiceGarden._id },
    // Italia Viva
    { name: "Margherita Pizza", description: "Classic tomato, fresh mozzarella, and basil — wood-fired", price: 520, category: "Pizzas", restaurant: italiaViva._id },
    { name: "Spaghetti Carbonara", description: "Egg, pecorino, guanciale, and black pepper", price: 480, category: "Pasta", restaurant: italiaViva._id },
    { name: "Tiramisu", description: "Classic Italian dessert with mascarpone, espresso, and cocoa", price: 280, category: "Desserts", restaurant: italiaViva._id },
    { name: "Bruschetta", description: "Grilled bread with tomato, garlic, and fresh basil", price: 200, category: "Starters", restaurant: italiaViva._id },
    // Sushi Tokyo
    { name: "Salmon Sashimi (8 pcs)", description: "Fresh Atlantic salmon, hand-sliced", price: 680, category: "Sashimi", restaurant: sushiTokyo._id },
    { name: "Dragon Roll", description: "Shrimp tempura topped with avocado and eel sauce", price: 520, category: "Rolls", restaurant: sushiTokyo._id },
    { name: "Miso Soup", description: "Traditional dashi broth with tofu and wakame", price: 120, category: "Soups", restaurant: sushiTokyo._id },
    { name: "Edamame", description: "Salted steamed soybeans", price: 160, category: "Starters", restaurant: sushiTokyo._id },
  ]);
  console.log("🍽️  Created menu items");

  // ── Reservations ────────────────────────────────────────────────────────────
  const today = new Date();
  const fmtDate = (d: Date) => d.toISOString().split("T")[0];
  const addDays = (d: Date, n: number) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };

  await Reservation.insertMany([
    // Upcoming
    { date: fmtDate(addDays(today, 1)), startTime: "19:00", endTime: "21:00", partySize: 2, status: "CONFIRMED", user: cust1._id, table: sgTables[0]._id, restaurant: spiceGarden._id },
    { date: fmtDate(addDays(today, 3)), startTime: "20:00", endTime: "22:00", partySize: 4, status: "PENDING", user: cust2._id, table: sgTables[2]._id, restaurant: spiceGarden._id },
    { date: fmtDate(addDays(today, 5)), startTime: "12:30", endTime: "14:00", partySize: 2, status: "CONFIRMED", user: cust3._id, table: ivTables[0]._id, restaurant: italiaViva._id },
    { date: fmtDate(addDays(today, 7)), startTime: "19:30", endTime: "21:30", partySize: 2, status: "PENDING", user: cust4._id, table: stTables[0]._id, restaurant: sushiTokyo._id },
    // Past
    { date: fmtDate(addDays(today, -5)), startTime: "18:00", endTime: "20:00", partySize: 3, status: "CONFIRMED", user: cust1._id, table: ivTables[1]._id, restaurant: italiaViva._id },
    { date: fmtDate(addDays(today, -10)), startTime: "13:00", endTime: "14:30", partySize: 2, status: "CONFIRMED", user: cust5._id, table: sgTables[1]._id, restaurant: spiceGarden._id },
    { date: fmtDate(addDays(today, -2)), startTime: "20:00", endTime: "22:00", partySize: 4, status: "CANCELLED", user: cust2._id, table: stTables[2]._id, restaurant: sushiTokyo._id },
  ]);
  console.log("📅 Created reservations");

  console.log("\n✅ Seeding complete!");
  console.log("\n🔐 Test accounts (password: password123):");
  console.log("   Admin:    admin@seatspot.com");
  console.log("   Owner 1:  raj@owners.com");
  console.log("   Owner 2:  priya@owners.com");
  console.log("   Customer: ananya@customers.com");

  await mongoose.disconnect();
  console.log("\n🔌 Disconnected from MongoDB");
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
