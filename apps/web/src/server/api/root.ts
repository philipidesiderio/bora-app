import { createTRPCRouter, createCallerFactory } from "./trpc";
import { dashboardRouter   } from "./routers/dashboard";
import { productsRouter    } from "./routers/products";
import { ordersRouter      } from "./routers/orders";
import { inventoryRouter   } from "./routers/inventory";
import { customersRouter   } from "./routers/customers";
import { financialRouter   } from "./routers/financial";
import { registersRouter   } from "./routers/registers";
import { providersRouter   } from "./routers/providers";
import { procurementsRouter } from "./routers/procurements";
import { couponsRouter     } from "./routers/coupons";
import { reportsRouter     } from "./routers/reports";

export const appRouter = createTRPCRouter({
  dashboard:    dashboardRouter,
  products:     productsRouter,
  orders:       ordersRouter,
  inventory:    inventoryRouter,
  customers:    customersRouter,
  financial:    financialRouter,
  registers:    registersRouter,
  providers:    providersRouter,
  procurements: procurementsRouter,
  coupons:      couponsRouter,
  reports:      reportsRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
