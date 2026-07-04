# Windows Local Setup & Feature Testing Guide

This guide describes how to install dependencies, run the application, and test all features locally on Windows.

---

## 1. System Dependencies Setup

To use the server-side audio streaming pipeline (`yt-dlp` extractor), you need to install **Python**, **FFmpeg**, and **yt-dlp** on Windows.

### Step 1: Install Python
`yt-dlp` requires Python to run.
1. Open PowerShell or Command Prompt.
2. Install Python using Windows Package Manager (`winget`):
   ```powershell
   winget install Python.Python.3
   ```
3. Alternatively, install Python 3.x from the Microsoft Store or download it from [python.org](https://www.python.org/).

### Step 2: Install FFmpeg
FFmpeg is required to extract, mux, and transcode audio formats.
1. Install FFmpeg using `winget`:
   ```powershell
   winget install Gyan.FFmpeg
   ```
2. Restart your terminal to refresh the environment variables. Verify the installation:
   ```powershell
   ffmpeg -version
   ```

### Step 3: Install yt-dlp
1. Download the Windows executable `yt-dlp.exe` from the official [yt-dlp releases page](https://github.com/yt-dlp/yt-dlp/releases).
2. Save the executable in a directory of your choice, for example: `C:\bin\yt-dlp.exe`.
3. Add the containing directory (`C:\bin`) to your user's system environment `PATH` variable:
   - Search for **"Edit the system environment variables"** in the Windows Start menu/Press Win + R search for "sysdm.cpl under "advanced".
   - Click **Environment Variables...**.
   - Under **User variables**, select `Path` and click **Edit...**.
   - Click **New** and add `C:\bin`.
   - Click **OK** to save and apply.
4. Verify the command works in a fresh PowerShell window:
   ```powershell
   yt-dlp --version
   ```

---

## 2. Environment Configuration

1. Create a `.env` file in the root of the project by copying `.env.example`:
   ```powershell
   Copy-Item .env.example .env
   ```
2. Configure the variables:
   - `YT_DLP_PATH`: Set to the path of your `yt-dlp.exe` if it's not in your system `PATH` (e.g. `C:\bin\yt-dlp.exe` or `yt-dlp`).
   - `LOCATION_SECRET`: Set a secure secret key to test location updates.

---

## 3. Running the Application Locally

Install dependencies and boot up the Next.js development server:
```powershell
# Install Node modules & generate lockfile
bun install

# Run the dev server
bun run dev
```

The application will start at `http://localhost:3000`.

---

## 4. Testing All Features

### A. Unit Tests
Verify all automated logic is functioning by running the test runner:
```powershell
bun test
```

### B. Music Playback Pipeline
1. **Frontend Player**: Open your browser and navigate to `http://localhost:3000/music`. Click any track to start streaming and observe the visualizer react to the audio stream.
2. **Track Resolution API**: Test track metadata extraction by opening:
   ```
   http://localhost:3000/api/resolve-track?id=dQw4w9WgXcQ
   ```
3. **Audio Streaming API**: Test direct proxy-streaming in the browser (you should hear the audio track start playing):
   ```
   http://localhost:3000/api/stream?id=dQw4w9WgXcQ
   ```

### C. Local Database Caching (SQLite)
Once you make requests to Spotify, Last.fm, or weather APIs, the local SQLite database is created.
- Verify that a file named `kv.sqlite` has been created in your project root.
- To inspect cached entries, you can query the database using Bun:
  ```powershell
  bun eval "import { Database } from 'bun:sqlite'; const db = new Database('kv.sqlite'); console.log(db.query('SELECT * FROM kv').all());"
  ```

### D. Weather and Location Caching
1. **Location Resolution**: Navigate to `http://localhost:3000/api/location` to see the current location coordinates.
2. **Weather API**: Navigate to `http://localhost:3000/api/weather` to verify weather data queries open-meteo, fetches coordinates, and caches results locally.
