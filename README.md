# Puppy Logger

A lightweight, mobile-first web app for new puppy owners to track feedings, naps, play sessions, pees, and poops—entirely in the browser. No signup, no backend; all data stays on your device.

---

## 🚀 Latest Features

- **One-tap logging** of 🍴 Feed, 🛏 Nap, ⚽ Play, 💧 Pee, and 💩 Poop
- **Optional End Time**: In edit mode, add or remove an end time for any entry
- **Full Editing Workflow**: Change start times, activity type, add notes/end times, or delete entries
- **Smooth Fade-Slide Animations** when opening the edit panel
- **Jump Controls**
  - **Jump to Top/Bottom** buttons above, between days, and below your logs
  - **Jump to Date** picker to scroll directly to any day you’ve logged
- **Welcome Message** on first load or when no logs exist, with quick-start instructions
- **Blog Page** alongside the app, featuring Tailwind-styled cards with publication dates
- **Accessibility Improvements**: semantic HTML, ARIA labels, keyboard focus management, high-contrast color scheme

---

## ⚙️ Local Development & Build

This is a static site—no server or backend—hosted as plain HTML, CSS, and JavaScript. However, we use Node.js for:

- **Tailwind CSS generation** (scans your HTML/JS, compiles only the utilities you use)
- **Minifying** HTML, CSS, and JS for production

**Prerequisites**

- [Node.js](https://nodejs.org/) (v14+), npm
- [Git](https://git-scm.com/) (for cloning)

```bash

# Clone & install dependencies

git clone https://github.com/palmerjoshua/puppylogger.git
cd puppylogger
npm install

# Build (generates and minifies into dist/)

npm run build

# Preview locally

# Option A: open dist/index.html in your browser

# Option B: run a simple HTTP server:

npx serve dist

# or

cd dist && python3 -m http.server 8080
```

Your production-ready files will be in `dist/`:

```
dist/
├─ index.html ← minified, with app + blog nav
├─ blog.html ← minified blog page
├─ styles.css ← purged & minified Tailwind CSS
└─ index.js ← minified application JavaScript
```

---

## 🤖 GitHub Actions Deployment

Automate building and deploying to the `gh-pages` branch so GitHub Pages serves your `dist/` folder.

1.  **Add a workflow** at `.github/workflows/pages.yml`:

    ```YAML
    name: Deploy Puppy Logger site

    on:
    push:
    branches: - main

    jobs:
    deploy:
    runs-on: ubuntu-latest
    steps: - uses: actions/checkout@v3

          - name: Install & build
            run: |
              npm ci
              npm run build

          - name: Deploy to gh-pages
            uses: peaceiris/actions-gh-pages@v4
            with:
              github_token: \${{ secrets.GITHUB_TOKEN }}
              publish_dir: ./dist
              publish_branch: gh-pages



    ```

2.  **Workflow permissions**  
    In your repo **Settings → Actions → General**, select **Read and write** under Workflow permissions.

3.  **Set up Deploy key.**

- **Generate an SSH keypair**

```bash
ssh-keygen -t ed25519 -f gh-pages-deploy-key -C "gh-pages deploy key"
```

- **Save keypair to GitHub**
  - Save the public key to Settings > Security > Deploy keys
  - Save the private key to Settings > Security > Secrets and variables > Actions > New Repository Secret

4.  **Configure GitHub Pages**  
    After the first successful run (which creates `gh-pages`), go to **Settings → Pages** and set:
    - **Source**: `gh-pages` branch, `/ (root)`  
      Save.

Now, any push to `main` will auto-build and publish your site. 🎉

---

## 📝 `package.json` Scripts

```json
{
  "scripts": {
    "clean": "npx rimraf dist",
    "build:css": "npx @tailwindcss/cli -i styles.css -o dist/styles.css --minify",
    "copy:static": "npx cpx \"*.{html,js}\" dist && npx cpx CNAME dist/ && npx cpx ads.txt dist",
    "minify:html": "npx html-minifier-terser --collapse-whitespace --remove-comments --minify-js true --minify-css true --input-dir dist --output-dir dist --file-ext html",
    "minify:js": "npx terser dist/index.js -c -m -o dist/index.js",
    "build": "npm run clean && npm run build:css && npm run copy:static && npm run minify:html && npm run minify:js"
  }
}
```

## CNAME and ads.txt

These files are only required if you're using a custom domain name on Github Pages, and if you're using Google AdSense.

- CNAME - Required for custom domain in GH Pages. Replace this with your own CNAME.
- ads.txt - Required for AdSense. Replace this with your own AdSense account info.

If you aren't using either of these services/features...

1. Delete the files
2. Change the `copy:static` npm script in your package.json to make it stop copying these files into `dist/`.

---

Happy puppy tracking! 🐾
