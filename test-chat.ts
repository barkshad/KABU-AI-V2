import fetch from "node-fetch";

async function run() {
  const res = await fetch("http://localhost:3000/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: "What is Kabarak University?", history: [] })
  });
  console.log("STATUS:", res.status);
  const text = await res.text();
  console.log("RESPONSE BODY:", text);
}
run();
