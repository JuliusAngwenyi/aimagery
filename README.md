# AI-powered image generator
This is an AI-powered image generator that uses real-time Sitecore page context to create dynamic visuals via Stable Diffusion and Hugging Face.

This is based on the `hackerspace-workshop` run by [Sitecore that you can find on this page](https://developers.sitecore.com/learn/getting-started/marketplace/hackerspace-workshop/usecase-image-generator-ai)

The link above provides a step-by-step guide on `Vibe Coding with AI`

I have followed the steps, and this repository is the final output of a fully functional AI image generator based on Next.js and [Sitecore Marketplace SDK](https://doc.sitecore.com/mp/en/developers/sdk/0/sitecore-marketplace-sdk/sitecore-marketplace-sdk-for-javascript.html)

# Sample Screenshots

- Installing Marketplace app ![Installing Marketplace app](/docs/01-install-marketplace-app.png)

- Scaffold Marketplace app in local dev ![Scaffold Marketplace app in local dev](/docs/02-scaffold-marektplace-app-local-dev.png)

- Vanilla Marketplace app running in Page Editor ![Vanilla Marketplace app running in Page Editor](/docs/03-vanilla-marketplace-app-in-pageeditor.png)

- Vibe Coding in VS Code ![Vibe Coding in VS Code](/docs/04-vibecoding-image-generator-in-vscode.png)

- Final result -Image generator in Page Editor ![Final result -Image generator in Page Editor](/docs/05-final-image-generator-in-action.png)


## Prerequisites: 
I installed [all prerequisite are listed below](https://developers.sitecore.com/learn/getting-started/marketplace/hackerspace-workshop/setup):

✅ Node.js 16+ and npm 10+ installed
✅ VS Code or Cursor with GitHub Copilot
✅ Registered app in Developer Studio (choose Page context panel extension point)
✅ App installed in your assigned environment
✅ Blok and Docs MCP configured in your IDE

# Configure MCPs
MCPs give your AI assistant direct access to the Blok component registry and the Sitecore documentation, making subsequent prompts significantly more accurate.

## Blok MCP
In VS Code, the command below will create `.vscode/mcp.json` with the Blok MCP configuration

`npx shadcn@latest mcp init --client vscode`

## Docs MCP
1. Go to [doc.sitecore.com](https://doc.sitecore.com/)
2.  Click Ask AI next to the search bar
3.  In the chat popup, open the Use MCP dropdown
4.  Select your IDE and follow the instructions


# Configure HuggingFace
The Image generator levarages HuggingFace Inference API — free tier works without a token (anonymous, stricter rate limits)
Create .env.local in your project root to hold the HuggingFace. 
There is a [sample provided here](.env.local.example)

# Next.js template

This is a Next.js template with shadcn/ui.
## Adding components

To add components to your app, run the following command:

```bash
npx shadcn@latest add button
```

This will place the ui components in the `components` directory.

## Using components

To use the components in your app, import them as follows:

```tsx
import { Button } from "@/components/ui/button";
```

## Start the App and Verify
Navigate into the generated project folder (the one containing `package.json`) and start the dev server:

`npm run dev`

### Test: 
Open `http://localhost:3000` and confirm the app renders. Then go back to your Sitecore environment, open the Standalone extension point where your app is registered, and reload — it should now show the scaffolded content instead of an error.

# Troubleshooting
You may encounter the following error when Generating Images
`Generation failed: The requested model is deprecated and no longer supported by provider hf-inference`

## Cause
`stabilityai/stable-diffusion-xl-base-1.0` has been removed from the `hf-inference` provider. 
HuggingFace deprecated several older Stable Diffusion models from their hosted inference, so the router rejects the request before it even runs.

## Fix
switch to `black-forest-labs/FLUX.1-schnell`, which is explicitly supported by the HF Inference API provider, is Apache-2.0 licensed, and produces significantly better images in fewer steps.
This is within the code file [`route.ts`](/app/api/generate-image/route.ts)

