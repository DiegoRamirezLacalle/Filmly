import { Router } from "express";
import moviesRouter from "./movies.js";
import reviewsRouter from "./reviews.js";
import mylistRouter from "./mylist.js";

const router = Router();

// movies expone /search y /search-es (en raíz)
router.use("/", moviesRouter);

// reviews cuelga de /reviews
router.use("/reviews", reviewsRouter);

// mylist cuelga de /mylist
router.use("/mylist", mylistRouter);

export default router;
