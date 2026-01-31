window.addEventListener('DOMContentLoaded', function () {
    const currentUser = sessionStorage.getItem('currentUser');
    if (currentUser) {
        window.location.href = './main.html';
    }
});

function handleLogin(event) {
    event.preventDefault();

    const emailOrUsername = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const remember = document.getElementById('remember').checked;

    const users = JSON.parse(localStorage.getItem('users')) || [];

    const user = users.find(u =>
        (u.email === emailOrUsername || u.username === emailOrUsername) &&
        u.password === password
    );

    if (user) {
        const userData = {
            username: user.username,
            email: user.email,
            fullname: user.fullname,
            loginTime: new Date().toISOString()
        };

        sessionStorage.setItem('currentUser', JSON.stringify(userData));
        sessionStorage.setItem('isLoggedIn', 'true');

        if (remember) {
            localStorage.setItem('rememberedUser', JSON.stringify(userData));
        }

        alert(`Đăng nhập thành công! 🎉\nChào mừng ${user.fullname}!`);

        window.location.href = './main.html';
    } else {
        alert('❌ Đăng nhập thất bại!\n\nEmail/Username hoặc mật khẩu không đúng.\nVui lòng thử lại.');

        document.getElementById('password').value = '';
        document.getElementById('password').focus();
    }
}

function socialLogin(platform) {
    alert(`Đăng nhập bằng ${platform}!\n\n(Chức năng đang phát triển - sẽ có trong phiên bản tiếp theo)`);
}

window.addEventListener('DOMContentLoaded', function () {
    const rememberedUser = localStorage.getItem('rememberedUser');
    if (rememberedUser) {
        const user = JSON.parse(rememberedUser);
        document.getElementById('email').value = user.username;
        document.getElementById('remember').checked = true;
    }
});

const inputs = document.querySelectorAll('input');
inputs.forEach(input => {
    input.addEventListener('focus', function () {
        this.parentElement.style.transform = 'translateY(-2px)';
    });

    input.addEventListener('blur', function () {
        this.parentElement.style.transform = 'translateY(0)';
    });
});

document.querySelector('.forgot-password').addEventListener('click', function (e) {
    e.preventDefault();
    const email = prompt('Nhập email của bạn để khôi phục mật khẩu:');
    if (email) {
        const users = JSON.parse(localStorage.getItem('users')) || [];
        const user = users.find(u => u.email === email);

        if (user) {
            alert(`Email khôi phục đã được gửi đến ${email}!\n\n(Demo: Mật khẩu của bạn là: ${user.password})`);
        } else {
            alert('Email không tồn tại trong hệ thống!');
        }
    }
});