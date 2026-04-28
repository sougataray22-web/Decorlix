// backend/controllers/cartController.js
const asyncHandler = require("express-async-handler");
const Cart    = require("../models/cartModel");
const Product = require("../models/productModel");

const getOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({ user: userId }).populate("items.product", "name images price discountPrice stock isActive");
  if (!cart) cart = await Cart.create({ user: userId, items: [] });
  return cart;
};

const getCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  const validItems = cart.items.filter((item) => item.product && item.product.isActive);
  if (validItems.length !== cart.items.length) { cart.items = validItems; await cart.save(); }
  res.status(200).json({ success: true, cart });
});

const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity = 1 } = req.body;
  if (!productId) { res.status(400); throw new Error("Product ID is required."); }
  const product = await Product.findById(productId);
  if (!product || !product.isActive) { res.status(404); throw new Error("Product not found."); }
  if (product.stock < 1) { res.status(400); throw new Error("Product is out of stock."); }
  const cart = await getOrCreateCart(req.user._id);
  const existingIndex = cart.items.findIndex((i) =>
    (i.product._id ? i.product._id.toString() : i.product.toString()) === productId
  );
  if (existingIndex !== -1) {
    const newQty = cart.items[existingIndex].quantity + Number(quantity);
    if (newQty > product.stock) { res.status(400); throw new Error(`Only ${product.stock} unit(s) available.`); }
    cart.items[existingIndex].quantity = newQty;
  } else {
    if (Number(quantity) > product.stock) { res.status(400); throw new Error(`Only ${product.stock} unit(s) available.`); }
    cart.items.push({ product: product._id, quantity: Number(quantity), price: product.price,
      discountPrice: product.discountPrice || 0, name: product.name, image: product.images?.[0]?.url || "", sku: product.sku || "" });
  }
  await cart.save();
  const updatedCart = await Cart.findById(cart._id).populate("items.product", "name images price discountPrice stock");
  res.status(200).json({ success: true, message: "Item added to cart.", cart: updatedCart });
});

const updateCartItem = asyncHandler(async (req, res) => {
  const { quantity } = req.body;
  const { productId } = req.params;
  if (!quantity || quantity < 1) { res.status(400); throw new Error("Quantity must be at least 1."); }
  const product = await Product.findById(productId);
  if (!product) { res.status(404); throw new Error("Product not found."); }
  if (Number(quantity) > product.stock) { res.status(400); throw new Error(`Only ${product.stock} unit(s) available.`); }
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) { res.status(404); throw new Error("Cart not found."); }
  const itemIndex = cart.items.findIndex((i) => i.product.toString() === productId);
  if (itemIndex === -1) { res.status(404); throw new Error("Item not in cart."); }
  cart.items[itemIndex].quantity = Number(quantity);
  await cart.save();
  const updatedCart = await Cart.findById(cart._id).populate("items.product", "name images price discountPrice stock");
  res.status(200).json({ success: true, message: "Cart updated.", cart: updatedCart });
});

const removeFromCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) { res.status(404); throw new Error("Cart not found."); }
  cart.items = cart.items.filter((i) => i.product.toString() !== req.params.productId);
  await cart.save();
  const updatedCart = await Cart.findById(cart._id).populate("items.product", "name images price discountPrice stock");
  res.status(200).json({ success: true, message: "Item removed.", cart: updatedCart });
});

const clearCart = asyncHandler(async (req, res) => {
  await Cart.findOneAndUpdate({ user: req.user._id }, { items: [], couponCode: "", couponDiscount: 0 });
  res.status(200).json({ success: true, message: "Cart cleared." });
});

module.exports = { getCart, addToCart, updateCartItem, removeFromCart, clearCart };
