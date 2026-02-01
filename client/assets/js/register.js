function checkPasswordStrength() {
    const password = document.getElementById('password').value;
    const strengthBar = document.getElementById('strengthBar');
    const strengthText = document.getElementById('strengthText');

    if (password.length === 0) {
        strengthBar.style.width = '0%';
        strengthText.textContent = 'Độ mạnh: Chưa nhập';
        strengthText.style.color = '#666';
        return;
    }

    let strength = 0;

    if (password.length >= 6) strength += 25;
    if (password.length >= 10) strength += 25;

    if (/[A-Z]/.test(password)) strength += 15;
    if (/[a-z]/.test(password)) strength += 15;

    if (/[0-9]/.test(password)) strength += 10;

    if (/[^A-Za-z0-9]/.test(password)) strength += 10;

    strengthBar.style.width = strength + '%';

    if (strength < 40) {
        strengthBar.style.background = '#ff4757';
        strengthText.textContent = 'Độ mạnh: Yếu';
        strengthText.style.color = '#ff4757';
    } else if (strength < 70) {
        strengthBar.style.background = '#ffa502';
        strengthText.textContent = 'Độ mạnh: Trung bình';
        strengthText.style.color = '#ffa502';
    } else {
        strengthBar.style.background = '#2ecc71';
        strengthText.textContent = 'Độ mạnh: Mạnh';
        strengthText.style.color = '#2ecc71';
    }
}

function checkPasswordMatch() {
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const confirmError = document.getElementById('confirmError');

    if (confirmPassword.length > 0 && password !== confirmPassword) {
        confirmError.classList.add('show');
    } else {
        confirmError.classList.remove('show');
    }
}

function handleRegister(event) {
    event.preventDefault();

    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (password !== confirmPassword) {
        alert('Mật khẩu xác nhận không khớp!');
        return;
    }

    const formData = {
        fullname: document.getElementById('fullname').value,
        username: document.getElementById('username').value,
        email: document.getElementById('email').value,
        password: password,
        gender: document.getElementById('gender').value
    };

    console.log('Register attempt:', formData);

    alert('Đăng ký thành công! \nChào mừng bạn đến với Game Hub!');

    window.location.href = './client/pages/login-page/login.html';
}

const inputs = document.querySelectorAll('input, select');
inputs.forEach(input => {
    input.addEventListener('focus', function () {
        this.parentElement.style.transform = 'translateY(-2px)';
    });

    input.addEventListener('blur', function () {
        this.parentElement.style.transform = 'translateY(0)';
    });
});

document.getElementById('email').addEventListener('input', function () {
    const emailError = document.getElementById('emailError');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (this.value.length > 0 && !emailRegex.test(this.value)) {
        emailError.classList.add('show');
    } else {
        emailError.classList.remove('show');
    }
});

document.getElementById('username').addEventListener('input', function () {
    const usernameError = document.getElementById('usernameError');

    if (this.value.length > 0 && this.value.length < 4) {
        usernameError.classList.add('show');
    } else {
        usernameError.classList.remove('show');
    }
});