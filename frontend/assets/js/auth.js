const API_BASE = 'http://localhost:8001/api';

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const showRegisterBtn = document.getElementById('showRegister');
  const showLoginBtn = document.getElementById('showLogin');
  const alertBox = document.getElementById('alertBox');
  
  // DOM Elements for validation
  const regPassword = document.getElementById('regPassword');
  const regConfirmPassword = document.getElementById('regConfirmPassword');
  const regBtn = document.getElementById('regBtn');
  const strengthContainer = document.getElementById('strengthContainer');
  const confirmIcon = document.getElementById('confirmIcon');

  // Toggle Forms (with CSS transition)
  function switchForm(hideForm, showForm) {
    hideAlert();
    hideForm.classList.remove('active');
    hideForm.classList.add('hidden');
    
    showForm.classList.remove('hidden');
    // small timeout to allow display:block to apply before opacity transition
    setTimeout(() => {
      showForm.classList.add('active');
    }, 10);
  }

  showRegisterBtn.addEventListener('click', () => switchForm(loginForm, registerForm));
  showLoginBtn.addEventListener('click', () => switchForm(registerForm, loginForm));

  // Show/Hide Password Toggle
  document.querySelectorAll('.toggle-pwd').forEach(icon => {
    icon.addEventListener('click', function() {
      const input = this.previousElementSibling;
      if (input.type === 'password') {
        input.type = 'text';
        this.classList.remove('bx-hide');
        this.classList.add('bx-show');
        this.style.color = 'var(--cyan)';
      } else {
        input.type = 'password';
        this.classList.remove('bx-show');
        this.classList.add('bx-hide');
        this.style.color = 'var(--text-dim)';
      }
    });
  });

  function showAlert(message, type = 'error') {
    alertBox.textContent = message;
    alertBox.className = `alert-box ${type}`;
    // trigger reflow to restart animation
    void alertBox.offsetWidth;
  }

  function hideAlert() {
    alertBox.className = 'alert-box';
  }

  // UI Error Shake Helper
  function triggerError(element) {
    element.classList.remove('shake');
    void element.offsetWidth; // trigger reflow
    element.classList.add('shake');
  }

  function setButtonLoading(btn, isLoading) {
    const text = btn.querySelector('.btn-text');
    const spinner = btn.querySelector('.spinner');
    if (isLoading) {
      btn.disabled = true;
      text.style.display = 'none';
      spinner.style.display = 'block';
    } else {
      btn.disabled = false;
      text.style.display = 'block';
      spinner.style.display = 'none';
    }
  }

  // Password Strength Logic
  const criteria = {
    length: val => val.length >= 6,
    upper: val => /[A-Z]/.test(val),
    num: val => /[0-9]/.test(val),
    spec: val => /[^A-Za-z0-9]/.test(val)
  };

  function updateCheckItem(id, isMet) {
    const li = document.getElementById(id);
    if (isMet) {
      li.classList.add('met');
      li.innerHTML = "<i class='bx bx-check'></i> " + li.innerText.trim();
    } else {
      li.classList.remove('met');
      li.innerHTML = "<i class='bx bx-minus'></i> " + li.innerText.trim();
    }
  }

  function evaluateStrength(val) {
    let score = 0;
    const isLen = criteria.length(val);
    const isUp = criteria.upper(val);
    const isNum = criteria.num(val);
    const isSpc = criteria.spec(val);

    if (isLen) score++;
    if (isUp) score++;
    if (isNum) score++;
    if (isSpc) score++;

    updateCheckItem('chkLength', isLen);
    updateCheckItem('chkUpper', isUp);
    updateCheckItem('chkNum', isNum);
    updateCheckItem('chkSpec', isSpc);

    const colors = ['rgba(255,255,255,0.1)', 'var(--red)', '#ff9500', '#c6ff00', 'var(--cyan)'];
    let currentColor = score > 0 ? colors[score] : colors[0];

    for (let i = 1; i <= 4; i++) {
      document.getElementById(`seg${i}`).style.background = (i <= score) ? currentColor : colors[0];
    }

    return isLen;
  }

  regPassword.addEventListener('input', (e) => {
    const val = e.target.value;
    if (val.length > 0) {
      strengthContainer.style.display = 'block';
    } else {
      strengthContainer.style.display = 'none';
    }
    
    const isLenMet = evaluateStrength(val);
    regBtn.disabled = !isLenMet; // Hard enforce 6 chars

    validateConfirmPassword();
  });

  regConfirmPassword.addEventListener('input', () => {
    validateConfirmPassword();
  });

  function validateConfirmPassword() {
    const pwd = regPassword.value;
    const confirm = regConfirmPassword.value;
    
    if (confirm.length === 0) {
      confirmIcon.className = 'bx bx-shield-quarter main-icon';
      confirmIcon.style.color = '';
      regConfirmPassword.classList.remove('error-border', 'success-border');
      return;
    }

    if (pwd === confirm) {
      confirmIcon.className = 'bx bx-check-circle main-icon';
      confirmIcon.style.color = 'var(--green)';
      regConfirmPassword.classList.remove('error-border');
      regConfirmPassword.classList.add('success-border');
    } else {
      confirmIcon.className = 'bx bx-x-circle main-icon';
      confirmIcon.style.color = 'var(--red)';
      regConfirmPassword.classList.remove('success-border');
      regConfirmPassword.classList.add('error-border');
    }
  }

  // Handle Login
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    const btn = document.getElementById('loginBtn');

    try {
      setButtonLoading(btn, true);
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);

      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData
      });

      if (!response.ok) {
        triggerError(loginForm);
        throw new Error('Invalid credentials');
      }

      const data = await response.json();
      localStorage.setItem('justiceToken', data.access_token);
      window.location.href = 'index.html';
    } catch (err) {
      showAlert(err.message);
    } finally {
      setButtonLoading(btn, false);
    }
  });

  // Handle Register
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('regUsername').value;
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regConfirmPassword').value;
    const btn = document.getElementById('regBtn');

    if (!criteria.length(password)) {
      triggerError(registerForm);
      showAlert("Passkey must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      triggerError(registerForm);
      triggerError(regConfirmPassword);
      showAlert("Passwords do not match");
      return;
    }

    try {
      setButtonLoading(btn, true);
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username,
          password: password,
          role: "Investigator"
        })
      });

      if (!response.ok) {
        triggerError(registerForm);
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Registration failed');
      }

      showAlert('Clearance registered. You may now Initialize Uplink.', 'success');
      setTimeout(() => {
        switchForm(registerForm, loginForm);
      }, 2000);
    } catch (err) {
      showAlert(err.message);
    } finally {
      setButtonLoading(btn, false);
    }
  });
});
