// =====================================
// ESP32 4x Ultrasonic Sensor Monitor
// Board: ESP32 Dev Module (38 pins)
// Sends data over WiFi so FurFoods website can show real-time status
// =====================================

#include <WiFi.h>
#include <WebServer.h>

// -------- WIFI: CHANGE THESE TO YOUR NETWORK --------
#define WIFI_SSID      "HUAWEI-2.4G-6Mg3"      // Your WiFi network name
#define WIFI_PASSWORD  "gZGGB44Y"  // Your WiFi password

// -------- PIN DEFINITIONS --------
#define TRIG1 13
#define ECHO1 12

#define TRIG2 14
#define ECHO2 27

#define TRIG3 26
#define ECHO3 25

#define TRIG4 33
#define ECHO4 32

// -------- WEB SERVER --------
WebServer server(80);

// Latest status for each container (updated in loop, read by server)
String status1 = "FULL";
String status2 = "FULL";
String status3 = "FULL";
String status4 = "FULL";

// -------- FUNCTION TO READ DISTANCE --------
long readUltrasonic(int trigPin, int echoPin) {
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);

  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);

  long duration = pulseIn(echoPin, HIGH, 30000); // timeout 30ms
  if (duration == 0) return -1; // no echo

  long distance = duration * 0.034 / 2;
  return distance;
}

// -------- FUNCTION TO CHECK STATUS --------
// 60+ cm = EMPTY, 10-59 cm = RUNNING LOW, <10 cm = FULL
String getStatus(long distance) {
  if (distance >= 60) {
    return "EMPTY";
  }
  else if (distance >= 10 && distance <= 59) {
    return "RUNNING LOW";
  }
  else {
    return "FULL";
  }
}

// -------- API: JSON for FurFoods website (with CORS for browser) --------
void handleApiLevels() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
#if defined(HTTP_OPTIONS)
  if (server.method() == HTTP_OPTIONS) {
    server.send(204);
    return;
  }
#endif
  server.send(200, "application/json",
    "{\"1\":\"" + status1 + "\",\"2\":\"" + status2 + "\",\"3\":\"" + status3 + "\",\"4\":\"" + status4 + "\"}");
}

// -------- SIMPLE INFO PAGE (shows IP so you can type it in the website) --------
void handleRoot() {
  String html = "<!DOCTYPE html><html><head><meta charset=\"UTF-8\"><title>FurFoods ESP32</title></head><body style=\"font-family:sans-serif;padding:2rem;\">";
  html += "<h1>FurFoods – Product Monitoring</h1>";
  html += "<p>ESP32 is connected. Use this IP address in the FurFoods website:</p>";
  html += "<p style=\"font-size:1.5rem;font-weight:bold;color:#166534;\">" + WiFi.localIP().toString() + "</p>";
  html += "<p>API: <a href=\"/api/levels\">/api/levels</a> (JSON)</p>";
  html += "<p>Current status: 1=" + status1 + ", 2=" + status2 + ", 3=" + status3 + ", 4=" + status4 + "</p>";
  html += "</body></html>";
  server.send(200, "text/html; charset=utf-8", html);
}

void setup() {
  Serial.begin(115200);

  pinMode(TRIG1, OUTPUT);
  pinMode(ECHO1, INPUT);
  pinMode(TRIG2, OUTPUT);
  pinMode(ECHO2, INPUT);
  pinMode(TRIG3, OUTPUT);
  pinMode(ECHO3, INPUT);
  pinMode(TRIG4, OUTPUT);
  pinMode(ECHO4, INPUT);

  Serial.println("");
  Serial.println("FurFoods ESP32 – 4 Ultrasonic Sensors");
  Serial.println("Connecting to WiFi: " + String(WIFI_SSID));

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  Serial.println("");

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi failed. Check SSID and password. Retrying in loop...");
  } else {
    Serial.println("WiFi connected.");
    Serial.println("IP address: " + WiFi.localIP().toString());
    Serial.println("Open this in a browser to see the IP, or use it in FurFoods Product Monitoring.");
  }

  server.on("/", handleRoot);
  server.on("/api/levels", handleApiLevels);
  server.onNotFound([]() {
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.send(404, "text/plain", "Not found");
  });
  server.begin();
  Serial.println("Web server started.");
}

void loop() {
  // Read all 4 sensors and update status
  long d1 = readUltrasonic(TRIG1, ECHO1);
  long d2 = readUltrasonic(TRIG2, ECHO2);
  long d3 = readUltrasonic(TRIG3, ECHO3);
  long d4 = readUltrasonic(TRIG4, ECHO4);

  status1 = getStatus(d1);
  status2 = getStatus(d2);
  status3 = getStatus(d3);
  status4 = getStatus(d4);

  // Serial output (optional; comment out if you don't need it)
  Serial.println("--------------------------------");
  Serial.print("Sensor 1: "); Serial.print(d1); Serial.print(" cm -> "); Serial.println(status1);
  Serial.print("Sensor 2: "); Serial.print(d2); Serial.print(" cm -> "); Serial.println(status2);
  Serial.print("Sensor 3: "); Serial.print(d3); Serial.print(" cm -> "); Serial.println(status3);
  Serial.print("Sensor 4: "); Serial.print(d4); Serial.print(" cm -> "); Serial.println(status4);
  Serial.print("STATUS:"); Serial.print("1:"); Serial.print(status1); Serial.print(",2:"); Serial.print(status2);
  Serial.print(",3:"); Serial.print(status3); Serial.print(",4:"); Serial.println(status4);

  // Handle HTTP requests (website will call /api/levels)
  server.handleClient();

  delay(500);
}
