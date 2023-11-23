const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass
function list(req, res) {
  const { dishId } = req.params;
  res.json({
    data: dishes.filter(dishId ? (dish) => dish.id == dishId : () => true),
  });
}

// let lastdishId = dishes.reduce((maxId, dish) => Math.max(maxId, dish.id), 0);

function bodyDataHas(propertyName) {
  return function (req, res, next) {
    const { data = ({ propertyName } = {}) } = req.body;
    console.log(req.body);
    if (data[propertyName]) {
      return next();
    }
    next({
      status: 400,
      message: `An ${propertyName} is required`,
    });
  };
}

function priceIsValidNumber(req, res, next) {
  const { data: { price } = {} } = req.body;
  if (price <= 0 || !Number.isInteger(price)) {
    return next({
      status: 400,
      message: `price requires a valid number`,
    });
  }
  next();
}

function create(req, res) {
  const { data: { name, description, price, image_url } = {} } = req.body;
  const newdish = {
    id: nextId(), // Increment last id then assign as the current ID
    name: name,
    description: description,
    price: price,
    image_url: image_url,
  };
  dishes.push(newdish);
  res.status(201).json({ data: newdish });
}

function dishExists(req, res, next) {
  const { dishId } = req.params;
  const foundDish = dishes.find((dish) => dish.id === Number(dishId));
  if (foundDish) {
    res.locals.dish = foundDish;
    return next();
  }
  next({
    status: 404,
    message: `dish id not found: ${dishId}`,
  });
}

function update(req, res) {
  const dish = res.locals.dish;
  const { data: { name, description, price, image_url } = {} } = req.body;

  // Update the dish
  dish.name = name;
  dish.description = description;
  dish.price = price;
  dish.image_url = image_url;

  res.json({ data: dish });
}

function read(req, res, next) {
  res.json({ data: res.locals.dish });
  next();
}

function addOrder(req, res) {
  const newOrder = {
    id: orders.length + 1,
    dishId: Number(req.params.dishId),
    time: Date.now(),
  };

  orders.push(newOrder);

  res.status(201).json({ data: newOrder });
}

module.exports = {
  create: [
    bodyDataHas("name"),
    bodyDataHas("description"),
    bodyDataHas("price"),
    bodyDataHas("image_url"),
    priceIsValidNumber,
    create,
  ],
  list,
  read: [dishExists, read],
  update: [
    dishExists,
    bodyDataHas("name"),
    bodyDataHas("description"),
    bodyDataHas("price"),
    bodyDataHas("image_url"),
    priceIsValidNumber,
    update,
  ],
  dishExists,
};
