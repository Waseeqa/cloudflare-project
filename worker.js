export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Get Durable Object instance
    const id = env.MyDatabase.idFromName("main");
    const obj = env.MyDatabase.get(id);

    // Serve HTML page
    if (url.pathname === "/") {
      return new Response(HTML_PAGE, {
        headers: {
          "content-type": "text/html"
        }
      });
    }

    // Forward API requests to Durable Object
    return obj.fetch(request);
  }
};

export class MyDatabase {
  constructor(state, env) {
    this.storage = state.storage;
  }

  async fetch(request) {
    const url = new URL(request.url);

    // ADD RECORD
    if (url.pathname === "/add" && request.method === "POST") {
      const { name, email } = await request.json();

      // Save into database
      await this.storage.put(name, { name, email });

      return new Response(
        JSON.stringify({
          success: true,
          message: "Record saved"
        }),
        {
          headers: {
            "content-type": "application/json"
          }
        }
      );
    }

    // LIST RECORDS
    if (url.pathname === "/list") {
      const entries = await this.storage.list();

      const records = [];

      for (const [key, value] of entries) {
        records.push({
          key,
          ...value
        });
      }

      return new Response(JSON.stringify(records), {
        headers: {
          "content-type": "application/json"
        }
      });
    }

    return new Response("Not Found", {
      status: 404
    });
  }
}

const HTML_PAGE = `
<!DOCTYPE html>
<html>
<head>
  <title>Cloudflare Database</title>
</head>
<body>

<h1>Add Record</h1>

<input id="name" placeholder="Name" />
<input id="email" placeholder="Email" />

<button onclick="addRecord()">Add</button>

<h2>Records</h2>

<ul id="records"></ul>

<script>

async function addRecord() {

  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;

  await fetch("/add", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      name,
      email
    })
  });

  loadRecords();
}

async function loadRecords() {

  const res = await fetch("/list");

  const data = await res.json();

  document.getElementById("records").innerHTML =
    data.map(r =>
      \`<li>\${r.name} - \${r.email}</li>\`
    ).join("");
}

loadRecords();

</script>

</body>
</html>
`;
