import { Buffer } from "node:buffer"
import { defineConfig, loadEnv } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

function appsScriptMiddleware(endpoint) {
  return {
    name: "apps-script-calendar-api",
    configureServer(server) {
      server.middlewares.use("/calendar-api", async (request, response) => {
        try {
          const localUrl = new URL(request.url || "", "http://localhost")
          const targetUrl = new URL(endpoint)
          localUrl.searchParams.forEach((value, key) => targetUrl.searchParams.append(key, value))

          const method = request.method || "GET"
          const options = {
            method,
            redirect: "follow",
            signal: AbortSignal.timeout(85000),
          }

          if (method !== "GET" && method !== "HEAD") {
            const chunks = []
            for await (const chunk of request) chunks.push(chunk)
            options.body = Buffer.concat(chunks)
            const contentType = request.headers["content-type"]
            if (contentType) options.headers = { "content-type": contentType }
          }

          let upstream
          let body
          const attempts = method === "GET" ? 3 : 1
          for (let attempt = 0; attempt < attempts; attempt += 1) {
            upstream = await fetch(targetUrl, options)
            body = await upstream.text()
            try {
              JSON.parse(body)
              break
            } catch {
              if (attempt + 1 < attempts) {
                targetUrl.searchParams.set("_retry", Date.now().toString())
                await new Promise((resolve) => setTimeout(resolve, 700 * (attempt + 1)))
                continue
              }
              response.statusCode = 502
              response.setHeader("content-type", "application/json; charset=utf-8")
              const contentType = upstream.headers.get("content-type") || "unknown content type"
              const bodyPreview = body.replace(/\s+/g, " ").trim().slice(0, 240)
              response.end(
                JSON.stringify({
                  ok: false,
                  error:
                    body.trimStart().startsWith("<")
                      ? "Google Calendar returned a webpage instead of event data. Redeploy the Apps Script web app as a new version, authorize it if prompted, and keep access set to Anyone."
                      : "Google Calendar returned an invalid response.",
                  upstreamStatus: upstream.status,
                  upstreamContentType: contentType,
                  upstreamPreview: bodyPreview,
                }),
              )
              return
            }
          }
          response.statusCode = upstream.status
          response.setHeader(
            "content-type",
            upstream.headers.get("content-type") || "application/json; charset=utf-8",
          )
          response.setHeader("cache-control", "no-store")
          response.end(body)
        } catch (error) {
          const timedOut = error?.name === "TimeoutError"
          response.statusCode = timedOut ? 504 : 502
          response.setHeader("content-type", "application/json; charset=utf-8")
          response.end(
            JSON.stringify({
              ok: false,
              error: timedOut
                ? "Google Calendar took too long to respond."
                : "Could not reach the Google Calendar service.",
              detail: error?.message || String(error),
              cause: error?.cause?.message || error?.cause?.code || "",
            }),
          )
        }
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "")
  const appsScriptUrl = env.VITE_GOOGLE_APPS_SCRIPT_URL

  return {
    plugins: [react(), tailwindcss(), appsScriptUrl && appsScriptMiddleware(appsScriptUrl)].filter(
      Boolean,
    ),
  }
})
