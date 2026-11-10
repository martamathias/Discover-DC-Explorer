import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

app.use((error: { status?: number; type?: string }, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (error.type === "entity.too.large") {
    res.status(413).json({ error: "This upload is too large. Choose a JPEG, PNG, or WebP photo under 3 MB." });
    return;
  }
  if (error.status === 400) {
    res.status(400).json({ error: "The request contains invalid JSON." });
    return;
  }
  res.status(500).json({ error: "The request could not be completed. Please try again." });
});

export default app;
