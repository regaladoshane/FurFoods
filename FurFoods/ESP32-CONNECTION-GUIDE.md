# Step-by-Step: Connect ESP32 (4 Ultrasonic) to FurFoods Website

This guide explains how to connect your ESP32 with 4 ultrasonic sensors to the FurFoods dashboard so the **Product Monitoring** tab shows **real-time status** (FULL / RUNNING LOW / EMPTY) and jar images for each container.

You can connect in two ways:

- **WiFi (recommended)** – ESP32 joins your Wi‑Fi and the website fetches data over the network. No USB needed after upload. Works from any device on the same Wi‑Fi (phone, tablet, PC).
- **USB (Serial)** – ESP32 connected by USB; browser talks to it via Web Serial. Use this if you prefer not to use Wi‑Fi or for testing.

---

## What You Need

- **ESP32** board (e.g. ESP32 Dev Module, 38 pins)
- **4× HC-SR04** (or similar) ultrasonic sensors
- **USB cable** (for uploading the sketch and, if you use USB connection, for connecting to the website)
- **Wi‑Fi network** (same one your computer/phone uses) – for WiFi connection method
- **Chrome** or **Edge** browser (required for USB/Web Serial; WiFi works in any modern browser)
- **Arduino IDE** (or PlatformIO) to upload the sketch
- **FurFoods project** with the `4ULTRASONIC-ESP32.ino` sketch and the dashboard files

---

## Part 1: Hardware Wiring

Wire each sensor to the ESP32 as follows. **Sensor 1 = Container 1**, **Sensor 2 = Container 2**, and so on.

| Sensor | TRIG pin (ESP32) | ECHO pin (ESP32) | VCC   | GND   |
|--------|------------------|-------------------|-------|-------|
| 1      | GPIO 13          | GPIO 12           | 5V/3.3V | GND   |
| 2      | GPIO 14          | GPIO 27           | 5V/3.3V | GND   |
| 3      | GPIO 26          | GPIO 25           | 5V/3.3V | GND   |
| 4      | GPIO 33          | GPIO 32           | 5V/3.3V | GND   |

- **TRIG** and **ECHO** must match the table.
- Connect **VCC** and **GND** of each sensor to the ESP32’s 5 V (or 3.3 V) and GND.

---

## Part 2: Set WiFi and Upload the Sketch (for WiFi connection)

1. **Open the sketch**
   - In Arduino IDE: **File → Open** and select  
     `FurFoods/4ULTRASONIC-ESP32.ino`

2. **Set your WiFi name and password**
   - Near the top of the file you will see:
     ```cpp
     #define WIFI_SSID      "YOUR_WIFI_NAME"      // Your WiFi network name
     #define WIFI_PASSWORD  "YOUR_WIFI_PASSWORD"  // Your WiFi password
     ```
   - Replace `YOUR_WIFI_NAME` with your actual Wi‑Fi network name (SSID).
   - Replace `YOUR_WIFI_PASSWORD` with your Wi‑Fi password.
   - Save the file (Ctrl+S).

3. **Select board and port**
   - **Tools → Board** → choose **ESP32 Dev Module** (or your exact ESP32 board).
   - **Tools → Port** → select the COM port of your ESP32 (e.g. `COM3`, `COM4` on Windows).

4. **Upload**
   - Click **Upload** (right-arrow button).
   - Wait until you see “Done uploading”.

5. **Get the ESP32 IP address (needed for WiFi connection)**
   - Open **Tools → Serial Monitor**.
   - Set baud rate to **115200**.
   - Press the **RESET** button on the ESP32 if needed.
   - You should see something like:
     ```
     WiFi connected.
     IP address: 192.168.1.105
     ```
   - **Write down this IP address** (yours may be different, e.g. `192.168.1.100`). You will type it in the FurFoods website.
   - Optional: you can also open `http://<IP>` in a browser (e.g. `http://192.168.1.105`) to see a small page that shows the IP and current status.
   - You can leave the Serial Monitor open or close it; it does not affect the **WiFi** connection to the website.

---

## Part 3: Run the FurFoods Website

The Product Monitoring section is loaded from a file, so the site must be served over **HTTP**, not opened as a file.

**Use a local web server.** Do **not** double-click `dashboard.html`.

### Option A: VS Code / Cursor with Live Server

1. Install the **Live Server** extension if you don’t have it.
2. Right-click `dashboard.html` (or `index.html`) in the project.
3. Click **“Open with Live Server”**.
4. The site will open at a URL like `http://127.0.0.1:5500/dashboard.html` or `http://localhost:5500/dashboard.html`.

### Option B: Python

1. Open **Command Prompt** or **PowerShell**.
2. Go to the project folder:
   ```text
   cd "C:\Users\Shane Joy Regalado\Desktop\FurFoods"
   ```
3. Run:
   ```text
   python -m http.server 8000
   ```
4. In the browser go to: **http://localhost:8000/dashboard.html**

### Option C: Node.js

```text
npx serve -l 3000
```

Then open **http://localhost:3000/dashboard.html**.

**Note for WiFi:** Your computer (or phone) must be on the **same Wi‑Fi network** as the ESP32. Open the dashboard from that device (e.g. `http://localhost:5500/dashboard.html` on your PC, or `http://<YOUR_PC_IP>:5500/dashboard.html` from your phone if you use Live Server and allow external access).

---

## Part 4a: Connect via WiFi (recommended – real-time over network)

1. **Open the dashboard**
   - Use the URL from Part 3 (e.g. `http://localhost:5500/dashboard.html`).

2. **Open Product Monitoring**
   - In the **sidebar**, click **“Product Monitoring”**.

3. **Enter the ESP32 IP and connect**
   - In the **“ESP32 IP address”** box, type the IP you wrote down in Part 2 (e.g. `192.168.1.105`).
   - Click **“Connect via WiFi”**.
   - The status should say **“Connected – updating from sensors…”** and the button should change to **“Disconnect WiFi”**.
   - The four containers should **update in real time** (FULL / RUNNING LOW / EMPTY and jar images). The page polls the ESP32 about every second.

4. **To disconnect**
   - Click **“Disconnect WiFi”**.

5. **Using the site from another device (e.g. phone)**
   - Run the FurFoods site on a server that is reachable from your phone (e.g. your PC’s IP and port, or a server on the same Wi‑Fi).
   - Open Product Monitoring, enter the **same ESP32 IP**, and click **“Connect via WiFi”**. The data is sent over Wi‑Fi from the ESP32 to the website.

---

## Part 4b: Connect via USB (Serial) – optional

Use this if you prefer not to use Wi‑Fi or for quick testing with the ESP32 plugged into the same computer.

1. **ESP32** must be **plugged in via USB** and the sketch must be **uploaded and running**.
2. **Close** the Arduino Serial Monitor (or any other app using the same COM port).
3. Open the dashboard and go to **Product Monitoring**.
4. Click **“Connect via USB (Serial)”**.
5. In the browser dialog, **select the ESP32’s COM port** and click **Connect**.
6. The containers will update in real time from serial data. Click **“Disconnect”** (or the button label that indicates disconnect) to stop.

---

## Part 5: Status Rules (same as in the .ino file)

| Distance (cm)   | Status on website | Jar image   |
|-----------------|--------------------|-------------|
| **60 or more** | EMPTY              | Empty jar   |
| **10 to 59**   | RUNNING LOW        | Low jar     |
| **Less than 10** | FULL             | Full jar    |

- **Sensor 1** → **Container 1**  
- **Sensor 2** → **Container 2**  
- **Sensor 3** → **Container 3**  
- **Sensor 4** → **Container 4**  

Only the **status text** and **jar images** are shown on the website; **distance values are not displayed**.

---

## Troubleshooting

| Problem | What to do |
|--------|------------|
| **“Connect via WiFi” / “Connect via USB” or IP box missing** | Open the site via a **local server** (e.g. `http://localhost:5500/dashboard.html`), not by double-clicking the HTML file. |
| **WiFi: “Connection error” or containers don’t update** | Check: (1) ESP32 is powered and connected to the same Wi‑Fi as your device. (2) IP is correct (from Serial Monitor or `http://<IP>` in browser). (3) No firewall blocking the device. Try opening `http://<ESP32_IP>/api/levels` in the browser – you should see JSON like `{"1":"FULL","2":"RUNNING LOW",...}`. |
| **WiFi: ESP32 never connects (Serial shows “WiFi failed”)** | Check `WIFI_SSID` and `WIFI_PASSWORD` in the sketch. Use 2.4 GHz Wi‑Fi (ESP32 does not support 5 GHz). |
| **USB: “Use Chrome (or Edge)…”** | Web Serial only works in **Chrome** or **Edge**. For WiFi, any modern browser is fine. |
| **USB: No port in dialog or “Could not connect”** | Install the **CP210x** or **CH340** USB driver for your ESP32. Close Serial Monitor and any other app using the COM port. |
| **Wrong status for a container** | Check wiring (TRIG/ECHO pins) and the thresholds in the sketch: 60+ = EMPTY, 10–59 = RUNNING LOW, &lt;10 = FULL. |

---

## Quick Checklist (WiFi)

- [ ] Wiring: 4 sensors to ESP32 (pins as in the table).
- [ ] In `4ULTRASONIC-ESP32.ino`: `WIFI_SSID` and `WIFI_PASSWORD` set to your Wi‑Fi.
- [ ] Sketch uploaded; Serial Monitor (115200) shows “WiFi connected” and the **IP address**.
- [ ] FurFoods opened via **local server** (e.g. `http://localhost:5500/dashboard.html`).
- [ ] Device (PC/phone) is on the **same Wi‑Fi** as the ESP32.
- [ ] Product Monitoring → enter **ESP32 IP** → **“Connect via WiFi”**.

When everything is done, the Product Monitoring tab will show real-time FULL / RUNNING LOW / EMPTY and the correct jar images for all four containers over Wi‑Fi.
