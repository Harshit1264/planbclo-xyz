async function loadPage(url) {
    showSpinner();
    
    try {
      const response = await fetch(url, { headers: { 'X-Requested-With': 'XMLHttpRequest' } });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const html = await response.text();
      document.querySelector('#content').innerHTML = html;
      
      // Update the browser history
      window.history.pushState({}, '', url);
  
      // Re-run any necessary JavaScript for the new content
      hideSpinner();
    } catch (error) {
      console.error('Error loading page:', error);
      hideSpinner();
      document.querySelector('#content').innerHTML = '<p>Error loading page. Please try again later.</p>';
    }
  }
  
  document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('a[data-dynamic="true"]').forEach(link => {
      link.addEventListener('click', function(event) {
        event.preventDefault();
        loadPage(event.target.href);
      });
    });
  
    window.addEventListener('popstate', function() {
      loadPage(location.pathname);
    });
  });
  