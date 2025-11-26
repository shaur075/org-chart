# Simple Deployment Guide

Since you have already successfully built the application (the `dist` folder is ready), here is the absolute easiest way to put it online.

## Method 1: The "Drag & Drop" Method (Easiest)
**Best for:** Quick testing, no account setup required initially.

1.  **Locate the Folder**: Open your computer's file explorer and find the `dist` folder inside your project folder (`/Users/shakilkhan/Org chart/dist`).
2.  **Open Netlify Drop**: Go to [https://app.netlify.com/drop](https://app.netlify.com/drop) in your browser.
3.  **Drag and Drop**: Drag the entire `dist` folder from your file explorer and drop it onto the box on the webpage.
4.  **Wait**: It will upload in a few seconds.
5.  **Done**: Netlify will give you a live URL (e.g., `https://random-name.netlify.app`). You can share this link immediately.

---

## Method 2: The "Professional" Method (Vercel)
**Best for:** Permanent sites, automatic updates when you change code.

1.  **Create a GitHub Account**: If you don't have one, go to [github.com](https://github.com) and sign up.
2.  **Upload Code**: Push your code to a new repository on GitHub.
3.  **Go to Vercel**: Visit [vercel.com](https://vercel.com) and sign up (you can use your GitHub account).
4.  **Add New Project**:
    *   Click **"Add New..."** -> **"Project"**.
    *   Select **"Import"** next to your GitHub repository.
5.  **Deploy**:
    *   Vercel will detect everything automatically.
    *   Click **"Deploy"**.
    *   Wait about a minute, and you'll get a permanent URL.

## Which one should I choose?
*   Use **Method 1** right now if you just want to see it online in 30 seconds.
*   Use **Method 2** if you want to keep working on it and have it update automatically.

## Troubleshooting
If Netlify Drop gives you an "Unknown Error":
1.  **Refresh the page** and try again.
2.  Make sure you are dragging the **`dist`** folder, not the main project folder.
3.  **Try "Plan B" below** (it's more reliable).

## Plan B: The "Command Line" Method (Vercel)
If dragging and dropping fails, this will work 100% of the time.

1.  Open your terminal (or use the one in your code editor).
2.  Run this command:
    ```bash
    npx vercel
    ```
3.  It will ask you a few questions. Just press **Enter** for all of them (accept defaults).
    *   Set up and deploy? **Y**
    *   Which scope? **(Your Name)**
    *   Link to existing project? **N**
    *   Project name? **(Press Enter)**
    *   Directory? **(Press Enter)**
4.  Wait for it to finish. It will give you a link like `https://org-chart-xyz.vercel.app`.

