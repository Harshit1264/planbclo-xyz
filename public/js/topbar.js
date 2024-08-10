document.addEventListener('DOMContentLoaded', function () {
  const menuIcon = document.getElementById('menu-icon');
  const menuContent = document.getElementById('menu-content');
  const closeIcon = document.getElementById('close-icon');
  const menuLinks = document.querySelectorAll('.menu-content ul li a');
  const profileIcon = document.querySelector('.profile-icon');
  const profileDropdown = document.querySelector('.profile-dropdown .dropdown-content');

  if (menuIcon && menuContent) {
    menuIcon.addEventListener('click', (event) => {
      event.stopPropagation(); // Prevent the event from bubbling up to the document
      menuContent.classList.toggle('active');
    });
  }

  if (closeIcon) {
    closeIcon.addEventListener('click', (event) => {
      event.stopPropagation(); // Prevent the event from bubbling up to the document
      menuContent.classList.remove('active');
    });
  }

  if (menuLinks) {
    menuLinks.forEach(link => {
      link.addEventListener('click', () => {
        if (menuContent) {
          menuContent.classList.remove('active');
        }
      });
    });
  }

  window.addEventListener('click', (event) => {
    if (menuContent && !menuContent.contains(event.target) && menuIcon && !menuIcon.contains(event.target)) {
      menuContent.classList.remove('active');
    }
    if (profileDropdown && !profileDropdown.contains(event.target) && profileIcon && !profileIcon.contains(event.target)) {
      profileDropdown.classList.remove('active');
    }
  });

  const logoutButton = document.getElementById('logout');
  if (logoutButton) {
    logoutButton.addEventListener('click', logout);
  }

  async function logout(event) {
    event.preventDefault(); // Prevent default anchor behavior
    console.log("btn clicked");
    const response = await fetch('/auth/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      Cookies.remove('token', { path: '/' }); // Ensure the path is specified
      window.location.href = '/'; // Redirect to home page after removing the token
    } else {
      alert('Failed to log out');
    }
  }

  // Automatically check for token on page load
  const token = Cookies.get('token');
  if (token && profileDropdown) {
    profileDropdown.style.display = 'block';
  }
});
