// backend/controllers/adminController.js
const asyncHandler  = require("express-async-handler");
const Order         = require("../models/orderModel");
const Product       = require("../models/productModel");
const User          = require("../models/userModel");

const getDashboardStats = asyncHandler(async (req, res) => {
  const now = new Date(); const today = new Date(now.setHours(0,0,0,0));
  const thisMonth  = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonth  = new Date(now.getFullYear(), now.getMonth()-1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
  const [totalUsers,newUsersToday,newUsersThisMonth,totalProducts,activeProducts,lowStockProducts,
    totalOrders,ordersToday,ordersThisMonth,ordersLastMonth,revenueThisMonth,revenueLastMonth,
    revenueTotalResult,pendingOrders,processingOrders,shippedOrders,deliveredOrders,cancelledOrders,
    recentOrders,topProducts,revenueByDay] = await Promise.all([
    User.countDocuments({ role:"user" }),
    User.countDocuments({ role:"user", createdAt:{$gte:today} }),
    User.countDocuments({ role:"user", createdAt:{$gte:thisMonth} }),
    Product.countDocuments(),
    Product.countDocuments({ isActive:true }),
    Product.countDocuments({ isActive:true, stock:{$lte:5} }),
    Order.countDocuments(),
    Order.countDocuments({ createdAt:{$gte:today} }),
    Order.countDocuments({ createdAt:{$gte:thisMonth} }),
    Order.countDocuments({ createdAt:{$gte:lastMonth,$lte:lastMonthEnd} }),
    Order.aggregate([{$match:{paymentStatus:"paid",createdAt:{$gte:thisMonth}}},{$group:{_id:null,total:{$sum:"$totalPrice"}}}]),
    Order.aggregate([{$match:{paymentStatus:"paid",createdAt:{$gte:lastMonth,$lte:lastMonthEnd}}},{$group:{_id:null,total:{$sum:"$totalPrice"}}}]),
    Order.aggregate([{$match:{paymentStatus:"paid"}},{$group:{_id:null,total:{$sum:"$totalPrice"}}}]),
    Order.countDocuments({ orderStatus:"placed" }),
    Order.countDocuments({ orderStatus:"processing" }),
    Order.countDocuments({ orderStatus:"shipped" }),
    Order.countDocuments({ orderStatus:"delivered" }),
    Order.countDocuments({ orderStatus:"cancelled" }),
    Order.find().populate("user","name email phone").sort({createdAt:-1}).limit(10).select("orderNumber user totalPrice orderStatus paymentStatus createdAt"),
    Product.find({isActive:true}).sort({sold:-1}).limit(5).select("name sold price images"),
    Order.aggregate([
      {$match:{paymentStatus:"paid",createdAt:{$gte:new Date(Date.now()-30*24*60*60*1000)}}},
      {$group:{_id:{$dateToString:{format:"%Y-%m-%d",date:"$createdAt"}},revenue:{$sum:"$totalPrice"},count:{$sum:1}}},
      {$sort:{_id:1}},
    ]),
  ]);
  const revenueThisMonthVal = revenueThisMonth[0]?.total || 0;
  const revenueLastMonthVal = revenueLastMonth[0]?.total || 0;
  const revenueTotalVal     = revenueTotalResult[0]?.total || 0;
  const revenueGrowth = revenueLastMonthVal > 0 ? (((revenueThisMonthVal-revenueLastMonthVal)/revenueLastMonthVal)*100).toFixed(1) : 100;
  const orderGrowth   = ordersLastMonth > 0 ? (((ordersThisMonth-ordersLastMonth)/ordersLastMonth)*100).toFixed(1) : 100;
  const lowStockItems = await Product.find({isActive:true,stock:{$lte:5}}).select("name stock sku images").sort({stock:1}).limit(10);
  res.status(200).json({
    success: true,
    stats: {
      users:    { total:totalUsers, newToday:newUsersToday, newThisMonth:newUsersThisMonth },
      products: { total:totalProducts, active:activeProducts, lowStock:lowStockProducts },
      orders:   { total:totalOrders, today:ordersToday, thisMonth:ordersThisMonth, growthPercent:Number(orderGrowth),
                  byStatus:{placed:pendingOrders,processing:processingOrders,shipped:shippedOrders,delivered:deliveredOrders,cancelled:cancelledOrders} },
      revenue:  { total:Math.round(revenueTotalVal*100)/100, thisMonth:Math.round(revenueThisMonthVal*100)/100,
                  lastMonth:Math.round(revenueLastMonthVal*100)/100, growthPercent:Number(revenueGrowth) },
    },
    recentOrders, topProducts, revenueByDay, lowStockAlerts: lowStockItems,
  });
});

const getAllUsers = asyncHandler(async (req, res) => {
  const { page=1, limit=20, keyword, role, sort="newest" } = req.query;
  const filter = {};
  if (role) filter.role = role;
  if (keyword) filter.$or = [
    {name:{$regex:keyword.trim(),$options:"i"}},{email:{$regex:keyword.trim(),$options:"i"}},{phone:{$regex:keyword.trim(),$options:"i"}}
  ];
  const sortObj = sort==="oldest"?{createdAt:1}:sort==="name_asc"?{name:1}:{createdAt:-1};
  const pageNum=Math.max(1,parseInt(page)), limitNum=Math.min(100,parseInt(limit)), skip=(pageNum-1)*limitNum;
  const [users,totalCount]=await Promise.all([
    User.find(filter).sort(sortObj).skip(skip).limit(limitNum).select("-password -resetPasswordToken -resetPasswordExpire -__v"),
    User.countDocuments(filter),
  ]);
  res.status(200).json({success:true,totalCount,totalPages:Math.ceil(totalCount/limitNum),currentPage:pageNum,users});
});

const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select("-password -resetPasswordToken");
  if (!user) { res.status(404); throw new Error("User not found."); }
  const [orders,totalSpent]=await Promise.all([
    Order.find({user:req.params.id}).sort({createdAt:-1}).limit(10).select("orderNumber totalPrice orderStatus createdAt"),
    Order.aggregate([{$match:{user:user._id,paymentStatus:"paid"}},{$group:{_id:null,total:{$sum:"$totalPrice"}}}]),
  ]);
  res.status(200).json({success:true,user,recentOrders:orders,totalSpent:totalSpent[0]?.total||0,totalOrders:await Order.countDocuments({user:req.params.id})});
});

const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  if (!["user","admin"].includes(role)) { res.status(400); throw new Error("Role must be 'user' or 'admin'."); }
  if (req.params.id === req.user._id.toString()) { res.status(400); throw new Error("You cannot change your own role."); }
  const user = await User.findById(req.params.id);
  if (!user) { res.status(404); throw new Error("User not found."); }
  user.role = role; await user.save();
  res.status(200).json({success:true,message:`User role updated to "${role}".`,user:{_id:user._id,name:user.name,email:user.email,role:user.role}});
});

const deleteUser = asyncHandler(async (req, res) => {
  if (req.params.id === req.user._id.toString()) { res.status(400); throw new Error("You cannot delete your own account."); }
  const user = await User.findById(req.params.id);
  if (!user) { res.status(404); throw new Error("User not found."); }
  const activeOrders = await Order.countDocuments({user:req.params.id,orderStatus:{$in:["placed","confirmed","processing","shipped","out_for_delivery"]}});
  if (activeOrders>0) { res.status(400); throw new Error(`Cannot delete. User has ${activeOrders} active order(s).`); }
  await user.deleteOne();
  res.status(200).json({success:true,message:"User account deleted."});
});

const getInventory = asyncHandler(async (req, res) => {
  const { stockFilter, category, page=1, limit=30 } = req.query;
  const filter = {};
  if (category) filter.category = category;
  if (stockFilter==="out") filter.stock=0;
  if (stockFilter==="low") filter.stock={$gt:0,$lte:10};
  if (stockFilter==="ok")  filter.stock={$gt:10};
  const pageNum=Math.max(1,parseInt(page)), limitNum=Math.min(100,parseInt(limit)), skip=(pageNum-1)*limitNum;
  const [products,totalCount,outOfStock,lowStock,inStock]=await Promise.all([
    Product.find(filter).populate("category","name").sort({stock:1}).skip(skip).limit(limitNum).select("name sku stock sold price isActive category images"),
    Product.countDocuments(filter),
    Product.countDocuments({stock:0}),
    Product.countDocuments({stock:{$gt:0,$lte:10}}),
    Product.countDocuments({stock:{$gt:10}}),
  ]);
  res.status(200).json({success:true,summary:{outOfStock,lowStock,inStock},totalCount,totalPages:Math.ceil(totalCount/limitNum),currentPage:pageNum,products});
});

const updateStock = asyncHandler(async (req, res) => {
  const { stock } = req.body;
  if (stock===undefined||stock<0) { res.status(400); throw new Error("Valid stock quantity is required (>= 0)."); }
  const product = await Product.findById(req.params.id);
  if (!product) { res.status(404); throw new Error("Product not found."); }
  product.stock = Number(stock); await product.save();
  res.status(200).json({success:true,message:`Stock updated to ${stock} units.`,product:{_id:product._id,name:product.name,sku:product.sku,stock:product.stock}});
});

const getRevenueAnalytics = asyncHandler(async (req, res) => {
  const { period="monthly", year, month } = req.query;
  const currentYear = new Date().getFullYear();
  const selectedYear = Number(year) || currentYear;
  let groupBy, matchStage;
  if (period==="daily" && month) {
    const selectedMonth = Number(month)-1;
    matchStage={createdAt:{$gte:new Date(selectedYear,selectedMonth,1),$lte:new Date(selectedYear,selectedMonth+1,0,23,59,59)},paymentStatus:"paid"};
    groupBy={$dateToString:{format:"%Y-%m-%d",date:"$createdAt"}};
  } else {
    matchStage={createdAt:{$gte:new Date(selectedYear,0,1),$lte:new Date(selectedYear,11,31,23,59,59)},paymentStatus:"paid"};
    groupBy={$dateToString:{format:"%Y-%m",date:"$createdAt"}};
  }
  const revenueData = await Order.aggregate([
    {$match:matchStage},{$group:{_id:groupBy,revenue:{$sum:"$totalPrice"},orders:{$sum:1},avgOrder:{$avg:"$totalPrice"}}},{$sort:{_id:1}}
  ]);
  const categoryRevenue = await Order.aggregate([
    {$match:{paymentStatus:"paid"}},{$unwind:"$items"},
    {$lookup:{from:"products",localField:"items.product",foreignField:"_id",as:"productData"}},{$unwind:"$productData"},
    {$lookup:{from:"categories",localField:"productData.category",foreignField:"_id",as:"categoryData"}},{$unwind:"$categoryData"},
    {$group:{_id:"$categoryData.name",revenue:{$sum:{$multiply:["$items.price","$items.quantity"]}},unitsSold:{$sum:"$items.quantity"}}},
    {$sort:{revenue:-1}},{$limit:10},
  ]);
  res.status(200).json({success:true,period,year:selectedYear,revenueData,categoryRevenue});
});

module.exports = { getDashboardStats, getAllUsers, getUserById, updateUserRole, deleteUser, getInventory, updateStock, getRevenueAnalytics };
