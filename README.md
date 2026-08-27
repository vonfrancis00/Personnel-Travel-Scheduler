# React + Vite

## Google Calendar setup

The app reads schedules from Google Calendar using the read-only OAuth scope. Access tokens are kept in browser memory and no client secret is used in the frontend.

1. In [Google Cloud Console](https://console.cloud.google.com/), create or select a project and enable **Google Calendar API**.
2. Configure the Google Auth consent screen. For a Google Workspace-only app, choose **Internal**; otherwise add your Google account as a test user while the app is in testing.
3. Create an **OAuth 2.0 Client ID** with application type **Web application**.
4. Add `http://localhost:5173` under **Authorized JavaScript origins**. Add the production site origin before deployment.
5. Copy `.env.example` to `.env.local` and replace the example client ID:

```env
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
VITE_GOOGLE_CALENDAR_ID=primary
```

Use `primary` for the signed-in user's main calendar. For a shared office calendar, use its Calendar ID from Google Calendar's **Settings and sharing → Integrate calendar** page, and ensure the signed-in user can access it.

Restart `npm run dev` after changing environment variables, then select **Connect Google Calendar** in the dashboard or Settings page.

### Apps Script setup (no Google Cloud Console)

1. Copy the contents of `google-apps-script/Code.gs` into the Apps Script project's `Code.gs` file and save it.
2. Open **Project Settings → Script properties** and add:
   - `ACCESS_CODE`: a long random value.
   - `CALENDAR_ID`: `primary`, or the ID of one shared calendar.
3. Select **Deploy → New deployment → Web app**.
4. Set **Execute as** to **Me** and **Who has access** to **Anyone**. Authorize Calendar access when prompted.
5. Copy the deployed `/exec` Web App URL into `.env.local`:

```env
VITE_GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
VITE_GOOGLE_APPS_SCRIPT_ACCESS_CODE=the-same-random-value-as-ACCESS_CODE
```

Do not set `VITE_GOOGLE_CLIENT_ID` when using the Apps Script route. Restart the Vite development server after editing `.env.local`. For later Apps Script code changes, create a new deployment version through **Deploy → Manage deployments → Edit**.

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is enabled on this template. See [this documentation](https://react.dev/learn/react-compiler) for more information.

Note: This will impact Vite dev & build performances.
You can also try [the experimental native React Compiler support in plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md#rust-react-compiler) by using `compiler: true` in the plugin options instead of using the Babel plugin.

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
