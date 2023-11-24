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

//validates that the dish has all needed properties
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

//validates that the price property is a valid, positive integer
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

// validates that the ID in the request body matches the ID provided in the route
function matchDish(req, res, next) {
  const { dishId } = req.params;
  const { data: { id } = {} } = req.body;
  if (id) {
    if (id !== dishId) {
      next({
        status: 400,
        message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`,
      });
    }
    next();
  } else {
    next();
  }
}

//creates a new dish with the necessary structure, pushes it into the array and sends the data
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

//verifies that a dish with the provided ID exists
function dishExists(req, res, next) {
  const { dishId } = req.params;
  console.log(dishId);
  const foundDish = dishes.find((dish) => dish.id === dishId);
  if (foundDish) {
    res.locals.dish = foundDish;
    return next();
  }
  next({
    status: 404,
    message: `dish id not found: ${dishId}`,
  });
}

//updates an existing dish with new information and then sends the data
function update(req, res) {
  const dish = res.locals.dish;
  const { data: { name, description, price, image_url } = {} } = req.body;

  // Update the dish with the appropriate info
  dish.name = name;
  dish.description = description;
  dish.price = price;
  dish.image_url = image_url;

  res.json({ data: dish });
}

//shows the data for an individual dish
function read(req, res, next) {
  res.json({ data: res.locals.dish });
}

module.exports = {
  create: [
    bodyDataHas("name"),
    bodyDataHas("description"),
    //bodyDataHas("price"),
    bodyDataHas("image_url"),
    priceIsValidNumber,
    create,
  ],
  list,
  read: [dishExists, read],
  update: [
    dishExists,
    matchDish,
    bodyDataHas("name"),
    bodyDataHas("description"),
    //bodyDataHas("price"),
    bodyDataHas("image_url"),
    priceIsValidNumber,
    update,
  ],
  dishExists,
};
