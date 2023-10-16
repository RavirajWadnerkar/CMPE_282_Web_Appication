// Fake authentication logic for demo
document.getElementById('login-form').addEventListener('submit', function (e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    // Check credentials
    if (username === 'admin' && password === 'Strongpassword') {
        window.location.href = 'dashboard.html';
    } else {
        alert('Invalid credentials. Please try again.');
    }
});

// Logout functionality on the dashboard
document.getElementById('adminlogout').addEventListener('click', function () {
    window.location.href = 'admin-login.html';
});
document.getElementById('userlogout').addEventListener('click', function () {
    window.location.href = 'login.html';
});
