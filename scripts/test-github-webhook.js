const crypto = require("crypto");
const http = require("http");

const secret = "ai-docs-local-secret-123";

const payload = JSON.stringify({
  ref: "refs/heads/main",
  after: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  head_commit: {
    id: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
  },
  repository: {
    id: 123456789,
    name: "ai-docs",
    full_name: "acme-corp/ai-docs",
  },
  sender: {
    login: "test-user"
  }
});
const signature =
  "sha256=" +
  crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");


const options = {
  hostname: "localhost",
  port: 3333,
  path: "/api/webhooks/github",
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-github-event": "push",
    "x-github-delivery": crypto.randomUUID(),
    "x-hub-signature-256": signature,
    "Content-Length": Buffer.byteLength(payload)
  }
};


const req = http.request(options, (res) => {

  console.log("Status:", res.statusCode);

  let data = "";

  res.on("data", chunk => {
    data += chunk;
  });

  res.on("end", () => {
    console.log("Response:", data);
  });

});


req.on("error", error => {
  console.error(error);
});


req.write(payload);
req.end();