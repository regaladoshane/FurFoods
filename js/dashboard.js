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
    dashboard: '<div class="section-content section-dashboard"><h2>Dashboard Overview</h2><p>Summary of your FurFoods operations and key metrics.</p><p>Use the sidebar to open Inventory, Sales &amp; Payment Report, or Product Price.</p></div>',
    inventory: '<div class="section-content section-inventory"><h2>Inventory</h2><p>Manage and view your product stocks here.</p><p>Add tables or forms for stock levels when you build this section.</p></div>',
    sales: '<div class="section-content section-sales"><h2>Sales &amp; Payment Report</h2><p>View sales performance and payment history.</p><p>Add charts or reports when you build this section.</p></div>',
    pricing: '<div class="section-content section-pricing"><h2>Product Price</h2><p>Update and review product pricing information.</p><p>Add price lists or forms when you build this section.</p></div>'
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

  function renderSection(sectionId) {
    if (!contentMain) return;
    var url = 'sections/' + sectionId + '.html';
    var fallback = fallbackContent[sectionId] || fallbackContent.dashboard;

    fetch(url)
      .then(function (response) {
        if (!response.ok) throw new Error('Not found');
        return response.text();
      })
      .then(function (html) {
        setContent(html);
      })
      .catch(function () {
        setContent(fallback);
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

  function init() {
    initSidebarToggle();
    initMenuNavigation();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
