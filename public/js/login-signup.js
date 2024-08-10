// Initialize intl-tel-input with India as default country
const phoneInputField = document.querySelector("#signup-mobile");
const phoneInput = window.intlTelInput(phoneInputField, {
    initialCountry: "in",
    utilsScript: "https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/17.0.8/js/utils.js",
});

function displayPopup(message, type) {
    const popup = document.createElement('div');
    popup.className = `alert-popup ${type}`;
    popup.innerText = message;

    document.body.appendChild(popup);

    // Show the popup and then hide it after 3 seconds
    popup.style.display = 'block';
    setTimeout(() => {
        popup.style.display = 'none';
        document.body.removeChild(popup);
    }, 3000);
}


async function sendOtp(type) {
    const identifier = type === 'email' ? document.getElementById('signup-email').value : document.getElementById('signup-mobile').value;

    try {
        const response = await fetch(`/auth/send-${type}-otp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ identifier }),
        });

        const data = await response.json();

        if (response.ok) {
            if (type === 'email') {
                document.getElementById('email-otp-container').style.display = 'block';
            } else {
                document.getElementById('phone-otp-container').style.display = 'block';
            }
            alert(`OTP sent to ${type}`);
        } else {
            displayError(data.error);
        }
    } catch (error) {
        displayError(`Failed to send OTP. Please try again later.`);
    }
}


async function verifyOtp(type) {
    const identifier = type === 'email' ? document.getElementById('signup-email').value : document.getElementById('signup-mobile').value;
    const otp = type === 'email' ? document.getElementById('signup-email-otp').value : document.getElementById('signup-phone-otp').value;

    try {
        const response = await fetch(`/auth/verify-${type}-otp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ identifier, otp }),
        });

        const data = await response.json();

        if (response.ok) {
            alert(`${type.charAt(0).toUpperCase() + type.slice(1)} OTP verified.`);
            if (type === 'email') {
                document.getElementById('signup-email').readOnly = true;
                document.getElementById('send-email-otp-button').disabled = true;
                document.getElementById('email-otp-container').style.display = 'none';
            } else {
                document.getElementById('signup-mobile').readOnly = true;
                document.getElementById('send-phone-otp-button').disabled = true;
                document.getElementById('phone-otp-container').style.display = 'none';
            }
        } else {
            displayError(data.error);
        }
    } catch (error) {
        displayError(`Failed to verify OTP. Please try again later.`);
    }
}





async function signup(event) {
    event.preventDefault();

    const firstname = document.getElementById('signup-firstname').value;
    const lastname = document.getElementById('signup-lastname').value;
    const mobile = phoneInput.getNumber();
    const email = document.getElementById('signup-email').value;  // Corrected to get the value directly
    const password = document.getElementById('signup-password').value;
    const repassword = document.getElementById('signup-repassword').value;
    const address1 = document.getElementById('signup-address1').value;
    const address2 = document.getElementById('signup-address2').value;
    const city = document.getElementById('signup-city').value;
    const state = document.getElementById('signup-state').value;
    const country = document.getElementById('signup-country').value;
    const pincode = document.getElementById('signup-pincode').value;

    // Logging for debugging
    console.log({ firstname, lastname, mobile, email, password, repassword, address1, address2, city, state, country, pincode });

    if (!firstname || !lastname || !mobile || !email || !password || !repassword || !address1 || !city || !state || !country || !pincode) {
        displayError('All fields are required');
        return;
    }

    if (!validateEmail(email)) {
        displayError('Invalid email format');
        return;
    }

    if (!document.getElementById('signup-email').readOnly) {
        displayError('Please verify your email first');
        return;
    }

    if (!validatePassword(password)) {
        displayError('Password must be at least 8 characters long');
        return;
    }

    if (password !== repassword) {
        displayError('Passwords do not match');
        return;
    }

    try {
        const signupResponse = await fetch('/auth/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                firstname,
                lastname,
                mobile,
                email,
                password,
                address1,
                address2,
                city,
                state,
                country,
                pincode
            }),
        });

        const signupData = await signupResponse.json();
        if (signupResponse.ok) {
            alert(signupData.message);
            window.location.href = '/';
        } else {
            displayError(signupData.error || 'Failed to sign up. Please try again later.');
        }
    } catch (error) {
        displayError('Failed to sign up. Please try again later.');
        console.error('Error:', error);
    }
}




// Other functions remain the same

async function login(event) {
    event.preventDefault();

    const identifier = document.getElementById('login-identifier').value;
    const password = document.getElementById('login-password').value;

    console.log({ identifier, password });

    if (!identifier || !password) {
        displayPopup('Both email and password are required', 'error');
        return;
    }

    try {
        const response = await fetch('/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ identifier, password }),
            redirect: 'follow'  // Let the browser follow the redirect
        });

        if (response.redirected) {
            // If the server sends a redirect, follow it
            window.location.href = response.url;
        } else if (response.ok) {
            displayPopup('Login successful', 'success');
            setTimeout(() => {
                window.location.href = '/';
            }, 2000); // Redirect after showing the success popup
        } else {
            // Handle errors
            const text = await response.text();
            console.error('Unexpected non-JSON response:', text);
            displayPopup('Login failed. Please try again.', 'error');
        }
    } catch (error) {
        displayPopup('Failed to log in. Please try again later.', 'error');
        console.error('Error:', error);
    }
}

function toggleLogin() {
    document.getElementById('login-form').style.display = 'block';
    document.getElementById('signup-form').style.display = 'none';
    document.getElementById('otp-popup').style.display = 'none';
    document.getElementById('forgot-password-form').style.display = 'none';
}

function togglesignup() {
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('signup-form').style.display = 'block';
    document.getElementById('otp-popup').style.display = 'none';
    document.getElementById('forgot-password-form').style.display = 'none';
}

document.addEventListener('DOMContentLoaded', () => {
     // Toggle password visibility
     const togglePasswordVisibility = (event) => {
        const passwordField = event.target.previousElementSibling;
        if (passwordField.type === 'password') {
            passwordField.type = 'text';
            event.target.setAttribute('aria-label', 'Hide password');
        } else {
            passwordField.type = 'password';
            event.target.setAttribute('aria-label', 'Show password');
        }
    };

    // Attach click event to all password visibility toggle icons
    document.querySelectorAll('.toggle-password-visibility').forEach(icon => {
        icon.addEventListener('click', togglePasswordVisibility);
    });
});


function initializeMediaLoop() {
    const desktopMediaItems = document.querySelectorAll('.media-item');
    let currentIndex = 0;
    let desktopImageInterval;

    function showMedia(items, index) {
        items.forEach((item, i) => {
            item.style.opacity = i === index ? '1' : '0';
            const video = item.querySelector('video');
            if (video) {
                if (i === index) {
                    video.play().catch(error => console.log('Error playing video:', error));
                    video.addEventListener('ended', () => onVideoEnd(items));
                } else {
                    video.pause();
                    video.currentTime = 0;
                    video.removeEventListener('ended', () => onVideoEnd(items));
                }
            }
        });
    }

    function loopMedia(items) {
        const currentItem = items[currentIndex];
        if (!currentItem) return;

        const isVideo = currentItem.querySelector('video') !== null;
        if (!isVideo) {
            currentIndex = (currentIndex + 1) % items.length;
            showMedia(items, currentIndex);
        }
    }

    function onVideoEnd(items) {
        currentIndex = (currentIndex + 1) % items.length;
        showMedia(items, currentIndex);

        const nextItem = items[currentIndex];
        if (!nextItem.querySelector('video')) {
            clearInterval(desktopImageInterval);
            desktopImageInterval = setInterval(() => loopMedia(desktopMediaItems), 5000);
        }
    }

    showMedia(desktopMediaItems, currentIndex);
    desktopImageInterval = setInterval(() => loopMedia(desktopMediaItems), 5000);
}

document.addEventListener('DOMContentLoaded', () => {
    initializePasswordVisibilityToggle();

    if (Cookies.get('token')) {
        fetchProtectedResource();
    }

    initializeMediaLoop();
});

function displayError(message) {
    const errorContainer = document.getElementById('error-container');
    errorContainer.textContent = message;
    errorContainer.style.display = 'block';
    setTimeout(() => {
        errorContainer.style.display = 'none';
    }, 5000);
}

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
}

function validatePassword(password) {
    return password.length >= 8;
}
function toggleForgotPassword() {
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('signup-form').style.display = 'none';
    document.getElementById('forgot-password-form').style.display = 'block';
    document.getElementById('otp-popup').style.display = 'none';
}

async function forgotPassword(event) {
    event.preventDefault();

    const email = document.getElementById('forgot-password-email').value;

    try {
        const response = await fetch('/auth/forgot-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email }),
        });

        const data = await response.json();

        if (response.ok) {
            alert(data.message);
        } else {
            displayError(data.error);
        }
    } catch (error) {
        displayError('Failed to send reset link. Please try again later.');
        console.error('Error:', error);
    }
}