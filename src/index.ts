import { Hono } from "hono";
import { createBunWebSocket } from "hono/bun";
import { Car } from "./types";
import { WSContext } from "hono/ws";

const { upgradeWebSocket, websocket } = createBunWebSocket();

const carsArray: Array<Car> = [];

const calculateAcumulatedTime = (cars: Array<Car>) => {
  return cars.reduce((acc, car) => acc + car.time, 0);
};

const isValidCar = (car: Car) => {
  if (car.direction !== "right" && car.direction !== "left") {
    return false;
  }
  if (car.time < 0) {
    return false;
  }
  if (car.id === "") {
    return false;
  }
  return true;
};

const handleCarRequest = (event: MessageEvent, ws: WSContext) => {
  console.info("Car request received...");
  const newCar = JSON.parse(event.data.toString()) as Car;
  if (!isValidCar(newCar)) {
    ws.send("Invalid car request");
    console.error("Invalid car request");
    return;
  }
  carsArray.push(newCar);
  console.log("Cars in the array: ");
  console.table(carsArray);
  const acumulatedTime = calculateAcumulatedTime(carsArray);
  setTimeout(() => {
    const index = carsArray.findIndex((car) => car.id === newCar.id);
    carsArray.splice(index, 1);
    ws.send("Car with id " + newCar.id + " has passed the bridge");
    console.info("Car with id " + newCar.id + " has passed the bridge");
  }, acumulatedTime * 1000);
};

const app = new Hono();

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

app.get(
  "/ws",
  upgradeWebSocket((c) => {
    return {
      onMessage: (event, ws) => {
        handleCarRequest(event, ws);
      },
      onOpen: () => {
        console.log("Connection opened");
      },
      onClose: () => {
        console.log("Connection closed");
      },
    };
  })
);

Bun.serve({
  fetch: app.fetch,
  websocket,
});

export default app;
