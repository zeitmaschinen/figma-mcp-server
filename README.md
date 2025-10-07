# figma-mcp-server
Connect Figma to Claude via MCP

---

This method is about **governance** (auditing and maintaining quality), not **implementation**. Use cases below:

### Use Figma's native MCP when:
- You want to generate code from designs
- You're implementing new UI from Figma mockups
- You need Code Connect integration

### Use this custom server when:
- You need to audit naming conventions across your design system
- You want to analyze component consistency
- You need bulk queries across hundreds of components
- You want Claude to help maintain design system quality

# Start here ↓

No coding needed, just configuration. Feel free to audit the files yourself, or run them through an LLM for a quick review.

## Download the project files

Before starting, [download the project files here](/documents/figma-mcp-server.zip) and extract the ZIP to your computer.

This ZIP file contains:
- Pre-compiled server code (ready to use!)
- All configuration files
- Empty `.env` file for your Figma token

---

## Step by Step

### Step 1: Install Node.js

**What is it?** A program that allows you to run JavaScript code on your computer.

**How to install:**

1. Go to: [https://nodejs.org/](https://nodejs.org/)
2. Click the big button labeled **"Download Node.js (LTS)"**
3. Wait for the download to finish
4. Click the downloaded file and follow the installer
5. When finished, click "Finish"

**You can test if it worked:**

- **Windows:** Press `Windows + R`, type `cmd` and press Enter
- **Mac:** Press `Command + Space`, type `terminal` and press Enter

In the window that opened, type:

```bash
node --version
```

Press Enter. If something like `v23.10.0` appears, it worked!

---

### Step 2: Extract project files

1. Locate the downloaded ZIP file: `figma-mcp-server.zip`
2. **Right-click** on the ZIP file
3. Choose **"Extract All..."** (Windows) or **"Unzip"** (Mac)
4. Choose a location (for example, /Documents/ folder)
5. Click **"Extract"**

You should now have a folder called `figma-mcp-server` with these files inside:

```
/figma-mcp-server/
├── src/                (source code for reference)
│   └── server.ts
├── .env                (you'll add your Figma token here)
├── .env.example
├── .gitignore
├── package.json
└── tsconfig.json
```

---

### Step 3: Open terminal in project folder

**Windows:**
1. Open the `figma-mcp-server` folder
2. Hold **Shift** and **right-click** in an empty area
3. Select **"Open PowerShell window here"** or **"Open Command Prompt here"**

**Mac:**
1. Open **Terminal** (Command + Space, type "terminal")
2. Type `cd ` (with a space after)
3. Drag the `figma-mcp-server` folder into the terminal window
4. Press Enter

---

### Step 4: Install dependencies (usually 3 min)

In the terminal (**inside the project folder**), type:

```bash
npm install
```

Press Enter and wait (may take 1-3 minutes). This will install all dependencies required to run the server.

When finished, all the necessary libraries will be downloaded into a `node_modules` folder.

---

### Step 5: Get your Figma token

#### 5.1: Generate token

1. Open your browser
2. Go to: [https://www.figma.com/](https://www.figma.com/)
3. Log in if necessary
4. Click on **your name** (top left corner) and select **Settings**
5. Click on the **Security** tab
6. **Scroll down** until you find the **"Personal access tokens"** section
7. Click the **"Generate new token"** button
8. Give the token a name (example: "Claude MCP")
9. Click **"Generate token"**
10. **COPY THE TOKEN** that appeared (it's a long sequence like `figd_ABC123...`)
11. **IMPORTANT:** Save this token somewhere safe, you won't be able to see it again once you close Figma's window.

---

#### 5.2: Add token to .env file

1. In the `figma-mcp-server` folder, open the `.env` file in a text editor (Notepad on Windows or TextEdit on Mac)
2. You'll see just: `FIGMA_ACCESS_TOKEN=`
3. **Paste your copied token after the equals sign**
4. Should look like: `FIGMA_ACCESS_TOKEN=figd_XYZ123ABC...`
5. **Save the file**

**Example:**
```
FIGMA_ACCESS_TOKEN=figd_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

---

### Step 6: Build the server

Now we need to compile the TypeScript code into JavaScript that Node.js can run.

In the terminal (inside the project folder), type:
```bash
npm run build
```

Press Enter and wait. You'll see some output, and a new build/ folder will be created inside your main folder.

---

### Step 7: Configure Claude desktop (circa 10 min)

#### 7.1: Find your project's complete path

In the terminal (inside the project folder), type:

**Windows:**

```bash
cd
```

**Mac/Linux:**

```bash
pwd
```

Something like this will appear:

- **Windows:** `C:\Users\YourName\Documents\figma-mcp-server`
- **Mac:** `/Users/yourname/Documents/figma-mcp-server`

**Copy this complete path**! Write it down, you'll need it in the next step.

---

#### 7.2: Find Claude's configuration file

**On Mac:**

1. Open Finder
2. Press `Command + Shift + G`
3. Paste: `~/Library/Application Support/Claude`
4. Press Enter
5. Look for the file: `claude_desktop_config.json`

**On Windows:**

1. Press `Windows + R`
2. Paste: `%APPDATA%\Claude`
3. Press Enter
4. Look for the file: `claude_desktop_config.json`

**If the file DOESN'T EXIST:**

- Create a new file named `claude_desktop_config.json` in that folder
- You can create it in Notepad or TextEdit

---

#### 7.3: Edit the configuration file

1. Open the `claude_desktop_config.json` file in Notepad or TextEdit
2. **DELETE EVERYTHING** that's in there (if anything exists, make a backup first)
3. Paste this content:

```json
{
  "mcpServers": {
    "figma-design-system": {
      "command": "node",
      "args": [
        "PASTE_PATH_HERE/build/server.js"
      ],
      "env": {
        "FIGMA_ACCESS_TOKEN": "PASTE_YOUR_TOKEN_HERE"
      }
    }
  }
}
```

4. **Replace:**
    - `PASTE_PATH_HERE` with the path you copied in Step 7.1
    - `PASTE_YOUR_TOKEN_HERE` with your Figma token

**Final example (Mac):**

```json
{
  "mcpServers": {
    "figma-design-system": {
      "command": "node",
      "args": [
        "/Users/maria/Documents/figma-mcp-server/build/server.js"
      ],
      "env": {
        "FIGMA_ACCESS_TOKEN": "figd_ABC123XYZ..."
      }
    }
  }
}
```

**Final example (Windows):**

```json
{
  "mcpServers": {
    "figma-design-system": {
      "command": "node",
      "args": [
        "C:\\Users\\Maria\\Documents\\figma-mcp-server\\build\\server.js"
      ],
      "env": {
        "FIGMA_ACCESS_TOKEN": "figd_ABC123XYZ..."
      }
    }
  }
}
```

5. Save the file

---

### Step 8: Activate in Claude desktop

1. **Completely CLOSE** Claude Desktop (on Mac: Command + Q, on Windows: right-click taskbar icon and choose "Quit")
2. Open Claude Desktop again

---

### Step 9: Test with Claude

Now go to Claude Desktop and ask:

```
Claude, show me all the components from my Figma file!
File key: ABC123XYZ
```

**How to get your file key:**
1. Open your Figma file in the browser
2. Look at the URL: 
   - `https://www.figma.com/file/ABC123XYZ/File-Name` OR
   - `https://www.figma.com/design/ABC123XYZ/File-Name`
3. Copy the `ABC123XYZ` part (between `/file/` or `/design/` and the next `/`)

Claude will access your Figma and show you the results!

---

## Verification checklist

1. Node.js is installed (check if `node --version` works)
2. Project files are extracted
3. `npm install` completed successfully
4. `.env` file has your Figma token
5. `claude_desktop_config.json` has the correct path with proper slashes
6. `claude_desktop_config.json` has your Figma token
7. Claude Desktop was completely closed and reopened

---

## What you can do

If everything is working, you can now ask Claude to:

- List all components from your Figma file
- Search for specific components (example: "find all button components")
- Analyze naming conventions
- Get detailed component information
- Extract design tokens and styles
- Check for inconsistencies in your design system

## Example commands to try
1. Claude, show me all components from my Figma file - File key: ABC123XYZ
2. Claude, search for button components in my design system - File key: ABC123XYZ
3. Claude, analyze the naming conventions in my Figma file - File key: ABC123XYZ
