/**
 * Dashboard behavior: sidebar toggle and section navigation
 * FurFoods – loads section content from sections/*.html
 */

(function () {
  'use strict';

  var sidebarOpen = true;
  var sidebar = document.getElementById('dashboardSidebar');
  var contentContainer = document.getElementById('dashboardContentContainer');
  var logo = document.getElementById('dashboardLogo');
  var userImage = document.getElementById('userImage');
  var navBtn = document.getElementById('navigationBtn');
  var contentMain = document.getElementById('dashboardContentMain');
  var menuLinks = document.querySelectorAll('.dashboard-menulists li a');

  /** Fallback when section file cannot be loaded (e.g. file://). Matches sections/*.html structure. */
  var fallbackContent = {
    dashboard: '<div class="section-content section-dashboard"><h2>Dashboard Overview</h2><p>Summary of your FurFoods operations and key metrics.</p><p>Use the sidebar to open Inventory, Sales &amp; Payment Report, or Product Monitoring.</p></div>',
    inventory: '<div class="section-content section-inventory"><h2>Inventory</h2><p>Manage and view your product stocks here.</p><p>Add tables or forms for stock levels when you build this section.</p></div>',
    sales: '<div class="section-content section-sales"><h2>Sales &amp; Payment Report</h2><p>View sales performance and payment history.</p><p>Add charts or reports when you build this section.</p></div>',
    pricing: '<div class="section-content section-pricing"><h2>Product Price</h2><p>Update and review product pricing information.</p><p>Add price lists or forms when you build this section.</p></div>',
    stocklevel: '<div class="section-content section-stocklevel"><h2>Product Monitoring</h2><p>Container levels from sensors. To see the Connect button and 4 jars, open this site via a <strong>local server</strong> (e.g. Live Server or <code>python -m http.server</code>), then go to Product Monitoring again. See <strong>ESP32-CONNECTION-GUIDE.md</strong> for step-by-step instructions.</p></div>'
  };

  function collapseSidebar() {
    if (!sidebar || !contentContainer || !logo || !userImage) return;
    sidebar.style.width = '80px';
    sidebar.style.transition = '0.3s all';
    logo.style.fontSize = '1rem';
    userImage.style.width = '50px';
    userImage.style.height = '50px';
    hideMenuText();
    var list = document.querySelector('.dashboard-menulists');
    if (list) list.style.textAlign = 'center';
    sidebarOpen = false;
  }

  function expandSidebar() {
    if (!sidebar || !contentContainer || !logo || !userImage) return;
    sidebar.style.width = '240px';
    sidebar.style.transition = '0.3s all';
    logo.style.fontSize = '1.875rem';
    userImage.style.width = '80px';
    userImage.style.height = '80px';
    showMenuText();
    var list = document.querySelector('.dashboard-menulists');
    if (list) list.style.textAlign = '';
    sidebarOpen = true;
  }

  function hideMenuText() {
    var texts = document.getElementsByClassName('menuText');
    for (var i = 0; i < texts.length; i++) {
      texts[i].style.display = 'none';
    }
  }

  function showMenuText() {
    var texts = document.getElementsByClassName('menuText');
    for (var i = 0; i < texts.length; i++) {
      texts[i].style.display = 'inline-block';
    }
  }

  function setContent(html) {
    if (!contentMain) return;
    contentMain.innerHTML = html;
  }

  var wifiPollInterval = null;
  var wifiConnected = false;

  function stopStocklevelConnections() {
    if (wifiPollInterval) {
      clearInterval(wifiPollInterval);
      wifiPollInterval = null;
      wifiConnected = false;
    }
    if (serialPortRef) closeSerial();
  }

  function renderSection(sectionId) {
    if (!contentMain) return;
    stopStocklevelConnections();
    var url = 'sections/' + sectionId + '.html';
    var fallback = fallbackContent[sectionId] || fallbackContent.dashboard;

    fetch(url)
      .then(function (response) {
        if (!response.ok) throw new Error('Not found');
        return response.text();
      })
      .then(function (html) {
        setContent(html);
        if (sectionId === 'stocklevel') initStocklevelSerial();
      })
      .catch(function () {
        setContent(fallback);
        if (sectionId === 'stocklevel') initStocklevelSerial();
      });
  }

  function initSidebarToggle() {
    if (!navBtn) return;
    navBtn.addEventListener('click', function (e) {
      e.preventDefault();
      if (sidebarOpen) {
        collapseSidebar();
      } else {
        expandSidebar();
      }
    });
  }

  /** Section id from URL hash (e.g. #inventory → "inventory"). Default "dashboard". */
  function getSectionFromHash() {
    var hash = window.location.hash.slice(1);
    return hash && fallbackContent[hash] ? hash : 'dashboard';
  }

  function setActiveMenu(sectionId) {
    document.querySelectorAll('.dashboard-menulists li').forEach(function (li) {
      li.classList.remove('menuActive');
      if (li.querySelector('a[data-section="' + sectionId + '"]')) {
        li.classList.add('menuActive');
      }
    });
  }

  function showSectionFromHash() {
    var sectionId = getSectionFromHash();
    setActiveMenu(sectionId);
    renderSection(sectionId);
  }

  function initMenuNavigation() {
    showSectionFromHash();
    if (!window.location.hash) window.location.hash = 'dashboard';
    window.addEventListener('hashchange', showSectionFromHash);
  }

  /**
   * Product Monitoring – for ESP32 ultrasonic integration.
   * Updates status and jar image only (no distance shown). Thresholds: 60+ = EMPTY, 10-59 = RUNNING LOW, <10 = FULL.
   */
  function updateContainerStatus(containerNum, status) {
    var img = document.getElementById('container-' + containerNum + '-img');
    var el = document.getElementById('container-' + containerNum + '-status');
    if (!img || !el) return;
    var statusMap = {
      full: { text: 'FULL', img: 'images/fulljar.png', className: 'stocklevel-status-full' },
      low: { text: 'RUNNING LOW', img: 'images/lowjar.png', className: 'stocklevel-status-low' },
      empty: { text: 'EMPTY', img: 'images/emptyjar.png', className: 'stocklevel-status-empty' }
    };
    var s = statusMap[status];
    if (!s) return;
    img.src = s.img;
    el.textContent = s.text;
    el.setAttribute('data-status', status);
    el.className = 'stocklevel-status ' + s.className;
  }

  /** Map ESP32 status string to internal key */
  function serialStatusToKey(str) {
    if (str === 'FULL') return 'full';
    if (str === 'RUNNING LOW') return 'low';
    if (str === 'EMPTY') return 'empty';
    return null;
  }

  var serialPortRef = null;
  var serialReaderRef = null;
  var serialReadAborted = false;

  function setSerialStatus(text, connected) {
    var el = document.getElementById('stocklevelSerialStatus');
    var btn = document.getElementById('stocklevelConnectBtn');
    if (el) el.textContent = text;
    if (btn) btn.classList.toggle('connected', !!connected);
    if (btn) btn.textContent = connected ? 'Disconnect' : 'Connect to ESP32';
  }

  function closeSerial() {
    serialReadAborted = true;
    if (serialReaderRef) {
      try { serialReaderRef.cancel(); } catch (e) {}
      serialReaderRef = null;
    }
    if (serialPortRef) {
      try { serialPortRef.close(); } catch (e) {}
      serialPortRef = null;
    }
    setSerialStatus('Disconnected. Connect again to resume.', false);
  }

  function parseStatusLine(line) {
    if (!line || line.indexOf('STATUS:') !== 0) return;
    var payload = line.slice(7).trim();
    var parts = payload.split(',');
    for (var i = 0; i < parts.length; i++) {
      var pair = parts[i].split(':');
      if (pair.length !== 2) continue;
      var num = parseInt(pair[0], 10);
      var statusStr = pair[1].trim();
      var key = serialStatusToKey(statusStr);
      if (num >= 1 && num <= 4 && key) updateContainerStatus(num, key);
    }
  }

  function readSerialLoop(port) {
    serialReadAborted = false;
    port.readable.getReader().then(function (reader) {
      serialReaderRef = reader;
      var buffer = '';
      function doRead() {
        if (serialReadAborted) return reader.releaseLock();
        reader.read().then(function (result) {
          if (result.done) {
            try { reader.releaseLock(); } catch (e) {}
            closeSerial();
            return;
          }
          buffer += new TextDecoder().decode(result.value);
          var idx = buffer.indexOf('\n');
          while (idx !== -1) {
            var line = buffer.slice(0, idx).replace(/\r/g, '');
            buffer = buffer.slice(idx + 1);
            parseStatusLine(line);
            idx = buffer.indexOf('\n');
          }
          doRead();
        }).catch(function () {
          try { reader.releaseLock(); } catch (e) {}
          closeSerial();
        });
      }
      doRead();
    });
  }

  function setWifiStatus(text, connected) {
    var el = document.getElementById('stocklevelWifiStatus');
    var btn = document.getElementById('stocklevelWifiBtn');
    if (el) el.textContent = text;
    if (btn) {
      btn.classList.toggle('connected', !!connected);
      btn.textContent = connected ? 'Disconnect WiFi' : 'Connect via WiFi';
    }
  }

  function fetchAndUpdateLevels(ip) {
    var url = 'http://' + ip + '/api/levels';
    fetch(url)
      .then(function (res) { return res.json(); })
      .then(function (data) {
        for (var i = 1; i <= 4; i++) {
          var s = data[String(i)];
          if (s) {
            var key = serialStatusToKey(s);
            if (key) updateContainerStatus(i, key);
          }
        }
      })
      .catch(function () {
        setWifiStatus('Connection error. Check IP and that ESP32 is on same WiFi.', true);
      });
  }

  function initStocklevelSerial() {
    var btn = document.getElementById('stocklevelConnectBtn');
    var statusEl = document.getElementById('stocklevelSerialStatus');
    var ipInput = document.getElementById('stocklevelEsp32Ip');
    var wifiBtn = document.getElementById('stocklevelWifiBtn');

    if (ipInput) {
      try {
        var saved = localStorage.getItem('furfoods_esp32_ip');
        if (saved) ipInput.value = saved;
      } catch (e) {}
    }

    if (wifiBtn && ipInput) {
      wifiBtn.onclick = function () {
        if (wifiConnected) {
          if (wifiPollInterval) clearInterval(wifiPollInterval);
          wifiPollInterval = null;
          wifiConnected = false;
          setWifiStatus('', false);
          return;
        }
        var ip = (ipInput.value || '').trim();
        if (!ip) {
          setWifiStatus('Enter the ESP32 IP address (e.g. 192.168.1.100).', false);
          return;
        }
        setWifiStatus('Connecting…', false);
        try { localStorage.setItem('furfoods_esp32_ip', ip); } catch (e) {}
        wifiConnected = true;
        setWifiStatus('Connected – updating from sensors…', true);
        fetchAndUpdateLevels(ip);
        wifiPollInterval = setInterval(function () { fetchAndUpdateLevels(ip); }, 1200);
      };
    }

    if (!btn || !statusEl) return;
    if (!navigator.serial) {
      statusEl.textContent = 'Use Chrome (or Edge) for USB. Or use WiFi above.';
      btn.disabled = true;
      return;
    }
    statusEl.textContent = '';
    btn.disabled = false;
    btn.onclick = function () {
      if (serialPortRef) {
        closeSerial();
        return;
      }
      navigator.serial.requestPort()
        .then(function (port) {
          serialPortRef = port;
          return port.open({ baudRate: 115200 });
        })
        .then(function () {
          setSerialStatus('Connected – updating from sensors…', true);
          readSerialLoop(serialPortRef);
        })
        .catch(function (err) {
          serialPortRef = null;
          setSerialStatus('Could not connect: ' + (err.message || 'Unknown error'), false);
        });
    };
  }

  function init() {
    initSidebarToggle();
    initMenuNavigation();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.FurFoods = window.FurFoods || {};
  window.FurFoods.updateContainerStatus = updateContainerStatus;
})();
