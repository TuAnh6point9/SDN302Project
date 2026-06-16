import app from "./app";
import { connectDB } from "./config/db";
import { env } from "./config/env";

const startServer = async () => {
  await connectDB();

  app.listen(env.port, () => {
    console.log(`GreenLeaf Books API running on port ${env.port}`);
  });
};

startServer().catch((error) => {
  console.error("Server startup failed", error);
  process.exit(1);
});
