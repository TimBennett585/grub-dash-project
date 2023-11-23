const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");
const { stat } = require("fs");

// TODO: Implement the /orders handlers needed to make the tests pass
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

function dishesPropertyIsValid(req, res, next) {
  const { data: { dishes } = {} } = req.body;

  // Check if 'dishes' property is missing or not an array
  if (!Array.isArray(dishes)) {
    return next({
      status: 400,
      message: "The 'dishes' property must be an array.",
    });
  }

  // Check each dish in the 'dishes' array
  for (const dish of dishes) {
    // Check if a dish is missing quantity
    if (!dish.quantity) {
      return next({
        status: 400,
        message: "Each dish must have a 'quantity' property.",
      });
    }

    // Check if a dish quantity is not an integer or is zero
    if (!Number.isInteger(dish.quantity) || dish.quantity <= 0) {
      return next({
        status: 400,
        message:
          "The 'quantity' property of each dish must be a positive integer.",
      });
    }
  }

  // If all checks pass, move to the next middleware
  next();
}

function list(req, res) {
  const filteredOrders = orders.filter(
    (order) =>
      !req.params.orderId || order.orderId == Number(req.params.orderId)
  );
  res.status(200).json({ data: filteredOrders });
}

function orderExists(req, res, next) {
  const { orderId } = req.params;
  const foundOrder = orders.find((order) => order.id === Number(orderId));
  if (foundOrder) {
    res.locals.order = foundOrder;
    return next();
  }
  next({
    status: 404,
    message: `Order id not found: ${orderId}`,
  });
}

function create(req, res) {
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
  const newOrder = {
    id: nextId(), // Increment last id then assign as the current ID
    deliverTo: deliverTo,
    mobileNumber: mobileNumber,
    status: status,
    dishes: dishes,
  };
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

/* function orderExists(req, res, next) {
    const { orderId } = req.params;
    const foundOrder = orders.find((order) => order.id === Number(orderId));
    if (foundOrder) {
      res.locals.order = foundOrder;
      return next();
    }
    next({
      status: 404,
      message: `Order id not found: ${orderId}`,
    });
  } */

function update(req, res) {
  const order = res.locals.order;
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;

  // Update the order

  deliverTo = deliverTo;
  mobileNumber = mobileNumber;
  status = status;
  dishes = dishes;
  res.json({ data: order });
}

function read(req, res, next) {
  res.json({ data: res.locals.order });
}

function destroy(req, res) {
  const { orderId } = req.params;
  const index = orders.findIndex((order) => order.id === Number(orderId));
  // `splice()` returns an array of the deleted elements, even if it is one element
  if (index > -1) {
    orders.splice(index, 1);
  }
  res.sendStatus(204);
}

module.exports = {
  create: [
    bodyDataHas("deliverTo"),
    bodyDataHas("mobileNumber"),
    bodyDataHas("status"),
    bodyDataHas("dishes"),
    dishesPropertyIsValid,
    create,
  ],
  list,
  read: [orderExists, read],
  delete: [orderExists, destroy],
  update: [
    bodyDataHas("deliverTo"),
    bodyDataHas("mobileNumber"),
    bodyDataHas("status"),
    bodyDataHas("dishes"),
    dishesPropertyIsValid,
    update,
  ],
  orderExists,
};
