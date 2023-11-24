const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");
const { stat } = require("fs");

// TODO: Implement the /orders handlers needed to make the tests pass

//validates that the order has the necessary properties
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

//validates that the order contains a valid "dishes" array, i.e. that they are actually ordering food.
function dishesPropertyIsValid(req, res, next) {
  const { data: { dishes } = {} } = req.body;

  // Check if 'dishes' property is missing or not an array
  if (!Array.isArray(dishes)) {
    return next({
      status: 400,
      message: "Order must include at least one dish",
    });
  }

  // Check if 'dishes' array is empty
  if (dishes.length === 0) {
    return next({
      status: 400,
      message: "Order must include at least one dish",
    });
  }

  // Check each dish in the 'dishes' array
  dishes.forEach((dish, index) => {
    // Check if a dish is missing quantity
    if (!dish.quantity) {
      return next({
        status: 400,
        message: `Dish ${index} must have a 'quantity' property.`,
      });
    }

    // Check if a dish quantity is not an integer or is zero
    if (!Number.isInteger(dish.quantity) || dish.quantity <= 0) {
      return next({
        status: 400,
        message: `Dish ${index} must have a quantity that is an integer greater than 0.`,
      });
    }
  });

  // If all checks pass, move to the next middleware
  next();
}

//lists the orders array
function list(req, res) {
  const filteredOrders = orders.filter(
    (order) =>
      !req.params.orderId || order.orderId == Number(req.params.orderId)
  );
  res.status(200).json({ data: filteredOrders });
}

//verifies that an order with the provided ID actually exists
function orderExists(req, res, next) {
  const { orderId } = req.params;
  const foundOrder = orders.find((order) => order.id === orderId);
  if (foundOrder) {
    res.locals.order = foundOrder;
    return next();
  }
  next({
    status: 404,
    message: `Order id not found: ${orderId}`,
  });
}

// verifies that the ID of body matches the order Id from the route
function orderMatch(req, res, next) {
  const orderId = req.params.orderId;
  const { data: { id } = {} } = req.body;
  if (id) {
    if (id === orderId) {
      return next();
    } else {
      return next({
        status: 400,
        message: `Order id does not match route id. Order: ${id}, Route: ${orderId}`,
      });
    }
  } else {
    next();
  }
}

// validate the status property before running the update
function verifyUpdate(req, res, next) {
  const { data: { status } = {} } = req.body;
  if (
    !status ||
    (status !== "pending" &&
      status !== "preparing" &&
      status !== "out-for-delivery")
  ) {
    return next({
      status: 400,
      message: `Order must have a status of pending, preparing, out-for-delivery, delivered`,
    });
  } else if (status === "delivered") {
    return next({
      status: 400,
      message: `A delivered order cannot be changed`,
    });
  }
  next();
}

// validates the status property (order was delivered) before deleting an order
function verifyDelete(req, res, next) {
  const order = res.locals.order;
  if (order.status === "pending") {
    return next();
  } else {
    return next({
      status: 400,
      message: `An order cannot be deleted unless it is pending`,
    });
  }
}

//creates a new order and assigns the provided data with the right structure, then pushes it into the array and sends the data
function create(req, res) {
  const { data: { deliverTo, mobileNumber, dishes } = {} } = req.body;
  const newOrder = {
    id: nextId(), // Increment last id then assign as the current ID
    deliverTo: deliverTo,
    mobileNumber: mobileNumber,
    dishes: dishes,
  };
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

//updates an existing order and sends the new data
function update(req, res) {
  const order = res.locals.order;
  const { data: { deliverTo, mobileNumber, dishes } = {} } = req.body;

  // Update the order

  order.deliverTo = deliverTo;
  order.mobileNumber = mobileNumber;
  order.dishes = dishes;
  res.json({ data: order });
}

//provides the data for a specific order
function read(req, res, next) {
  res.json({ data: res.locals.order });
}

//deletes and order from the array and sends confirmation
function destroy(req, res) {
  const { orderId } = req.params;
  const index = orders.findIndex((order) => order.id === orderId);
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
    bodyDataHas("dishes"),
    dishesPropertyIsValid,
    create,
  ],
  list,
  read: [orderExists, read],
  delete: [orderExists, verifyDelete, destroy],
  update: [
    bodyDataHas("deliverTo"),
    bodyDataHas("mobileNumber"),
    bodyDataHas("status"),
    bodyDataHas("dishes"),
    orderExists,
    dishesPropertyIsValid,
    orderMatch,
    verifyUpdate,
    update,
  ],
  orderExists,
};
