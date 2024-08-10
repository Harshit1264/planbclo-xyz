document.addEventListener("DOMContentLoaded", function() {
    const spinner = document.createElement('div');
    spinner.className = 'spinner-container';
    spinner.innerHTML = '<div class="spinner"></div>';
    document.body.appendChild(spinner);
  
    window.addEventListener('load', function() {
      spinner.style.display = 'none';
    });
  });
  
  function showSpinner() {
    const spinner = document.querySelector('.spinner-container');
    spinner.style.display = 'flex';
  }
  
  function hideSpinner() {
    const spinner = document.querySelector('.spinner-container');
    spinner.style.display = 'none';
  }
  