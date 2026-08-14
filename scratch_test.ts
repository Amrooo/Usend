console.log("1. Starting scratch_test.ts");
process.on("uncaughtException", (err) => console.error("Uncaught exception:", err));
process.on("unhandledRejection", (reason) => console.error("Unhandled rejection:", reason));

console.log("2. About to import ./server.ts");
import("./server.ts").then(() => {
  console.log("3. Import of ./server.ts finished successfully!");
}).catch((err) => {
  console.error("4. Import of ./server.ts failed:", err);
});
