import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit, OnDestroy {
  isLoginMode = true;
  isLoading = false;
  errorMessage = '';
  showPassword = false;
  showConfirmPassword = false;
  isTransitioning = false;

  // Login attempt limiting
  loginAttempts = 0;
  maxAttempts = 5;
  isLocked = false;
  lockTimer = 0;
  private lockInterval: any = null;
  private readonly LOCK_DURATION = 60; // seconds

  // Login
  email = '';
  password = '';

  // Register
  registerData = {
    name: '',
    lastName: '',
    docType: 'CC',
    docNumber: '',
    email: '',
    password: '',
    confirmPassword: '',
    isActive: true,
    roleIds: [2]
  };

  // Validation state
  validations = {
    name: { touched: false, valid: false },
    lastName: { touched: false, valid: false },
    docNumber: { touched: false, valid: false },
    email: { touched: false, valid: false },
    password: { touched: false, valid: false },
    confirmPassword: { touched: false, valid: false },
    loginEmail: { touched: false, valid: false },
    loginPassword: { touched: false, valid: false }
  };

  // Password strength
  passwordStrength = 0;
  passwordStrengthLabel = '';
  passwordStrengthColor = '';

  // Particles
  particles: { x: number; y: number; size: number; speed: number; opacity: number; angle: number }[] = [];
  private animFrame = 0;
  private canvasCtx: CanvasRenderingContext2D | null = null;

  constructor(
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.initParticles();
    this.loadLockState();
  }

  ngOnDestroy() {
    if (this.animFrame) {
      cancelAnimationFrame(this.animFrame);
    }
    if (this.lockInterval) {
      clearInterval(this.lockInterval);
    }
  }

  // ---- Lock state persistence ----
  private loadLockState() {
    const stored = sessionStorage.getItem('login_attempts');
    if (stored) {
      this.loginAttempts = parseInt(stored, 10);
    }

    const lockUntil = sessionStorage.getItem('login_lock_until');
    if (lockUntil) {
      const remaining = Math.ceil((parseInt(lockUntil, 10) - Date.now()) / 1000);
      if (remaining > 0) {
        this.isLocked = true;
        this.lockTimer = remaining;
        this.startLockCountdown();
      } else {
        // Lock expired — reset
        sessionStorage.removeItem('login_lock_until');
        sessionStorage.removeItem('login_attempts');
        this.loginAttempts = 0;
      }
    }
  }

  private saveLockState() {
    sessionStorage.setItem('login_attempts', this.loginAttempts.toString());
  }

  private activateLock() {
    this.isLocked = true;
    this.lockTimer = this.LOCK_DURATION;
    const lockUntil = Date.now() + (this.LOCK_DURATION * 1000);
    sessionStorage.setItem('login_lock_until', lockUntil.toString());
    this.startLockCountdown();
  }

  private startLockCountdown() {
    this.lockInterval = setInterval(() => {
      this.lockTimer--;
      if (this.lockTimer <= 0) {
        clearInterval(this.lockInterval);
        this.lockInterval = null;
        this.isLocked = false;
        this.loginAttempts = 0;
        sessionStorage.removeItem('login_lock_until');
        sessionStorage.removeItem('login_attempts');
        this.cdr.detectChanges();
      }
      this.cdr.detectChanges();
    }, 1000);
  }

  private resetAttempts() {
    this.loginAttempts = 0;
    this.isLocked = false;
    if (this.lockInterval) {
      clearInterval(this.lockInterval);
      this.lockInterval = null;
    }
    sessionStorage.removeItem('login_attempts');
    sessionStorage.removeItem('login_lock_until');
  }

  get attemptsRemaining(): number {
    return this.maxAttempts - this.loginAttempts;
  }

  get lockTimerFormatted(): string {
    const m = Math.floor(this.lockTimer / 60);
    const s = this.lockTimer % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  initParticles() {
    // Generate particles data for CSS animation (no canvas needed)
    this.particles = Array.from({ length: 25 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 1,
      speed: Math.random() * 20 + 10,
      opacity: Math.random() * 0.4 + 0.1,
      angle: Math.random() * 360
    }));
  }

  // ---- Mode toggle — instant switch with CSS animation ----
  toggleMode() {
    this.errorMessage = '';
    this.isLoginMode = !this.isLoginMode;
    this.resetValidations();
    this.isTransitioning = false;
  }

  // ---- Real-time validations ----
  validateField(field: string) {
    switch (field) {
      case 'name':
        this.validations.name.touched = true;
        this.validations.name.valid = this.registerData.name.trim().length >= 2;
        break;
      case 'lastName':
        this.validations.lastName.touched = true;
        this.validations.lastName.valid = this.registerData.lastName.trim().length >= 2;
        break;
      case 'docNumber':
        this.validations.docNumber.touched = true;
        this.validations.docNumber.valid = /^\d{6,12}$/.test(this.registerData.docNumber);
        break;
      case 'email':
        this.validations.email.touched = true;
        this.validations.email.valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.registerData.email);
        break;
      case 'password':
        this.validations.password.touched = true;
        this.validations.password.valid = this.registerData.password.length >= 6;
        this.calculatePasswordStrength(this.registerData.password);
        // Re-check confirm
        if (this.validations.confirmPassword.touched) {
          this.validations.confirmPassword.valid =
            this.registerData.confirmPassword === this.registerData.password &&
            this.registerData.confirmPassword.length > 0;
        }
        break;
      case 'confirmPassword':
        this.validations.confirmPassword.touched = true;
        this.validations.confirmPassword.valid =
          this.registerData.confirmPassword === this.registerData.password &&
          this.registerData.confirmPassword.length > 0;
        break;
      case 'loginEmail':
        this.validations.loginEmail.touched = true;
        this.validations.loginEmail.valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email);
        break;
      case 'loginPassword':
        this.validations.loginPassword.touched = true;
        this.validations.loginPassword.valid = this.password.length >= 1;
        break;
    }
  }

  getFieldClass(field: string): string {
    const v = (this.validations as any)[field];
    if (!v || !v.touched) return '';
    return v.valid ? 'valid' : 'invalid';
  }

  resetValidations() {
    Object.keys(this.validations).forEach(key => {
      (this.validations as any)[key] = { touched: false, valid: false };
    });
    this.passwordStrength = 0;
    this.passwordStrengthLabel = '';
    this.passwordStrengthColor = '';
  }

  // ---- Password strength ----
  calculatePasswordStrength(pw: string) {
    let score = 0;
    if (pw.length >= 6) score++;
    if (pw.length >= 10) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;

    this.passwordStrength = score;

    const labels = ['', 'Muy débil', 'Débil', 'Regular', 'Fuerte', 'Muy fuerte'];
    const colors = ['', '#ff4757', '#ff6b35', '#ffa502', '#2ed573', '#27ae60'];

    this.passwordStrengthLabel = labels[score] || '';
    this.passwordStrengthColor = colors[score] || '';
  }

  // ---- Toggle visibility ----
  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  // ---- Submit ----
  onSubmit() {
    this.errorMessage = '';
    this.isLoading = true;

    if (this.isLoginMode) {
      this.loginUser();
    } else {
      this.registerUser();
    }
  }

  private loginUser() {
    if (this.isLocked) {
      this.isLoading = false;
      return;
    }

    this.authService.login(this.email, this.password).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.resetAttempts();
        const user = res.user;
        const isAdmin = user?.roles?.some((r: any) =>
          r.name === 'ADMIN' || r.name === 'admin' || r === 'ADMIN'
        );

        Swal.fire({
          title: '¡Bienvenido!',
          html: `<span style="color:#a0a0a0">Hola <strong style="color:#27ae60">${user?.name || ''}</strong>, nos alegra verte.</span>`,
          icon: 'success',
          confirmButtonText: 'Continuar',
          background: '#1a1a2e',
          color: '#f5f5f5',
          confirmButtonColor: '#27ae60',
          timer: 2500,
          timerProgressBar: true,
          showClass: { popup: 'animate__animated animate__fadeInUp animate__faster' },
          hideClass: { popup: 'animate__animated animate__fadeOutDown animate__faster' }
        }).then(() => {
          this.router.navigate([isAdmin ? '/admin' : '/']);
        });
      },
      error: (err) => {
        this.isLoading = false;
        this.loginAttempts++;
        this.saveLockState();

        if (this.loginAttempts >= this.maxAttempts) {
          this.activateLock();
          this.errorMessage = '';
          Swal.fire({
            title: '⛔ Cuenta Bloqueada',
            html: `<span style="color:#a0a0a0">Demasiados intentos fallidos.<br>Intenta de nuevo en <strong style="color:#ff4757">60 segundos</strong>.</span>`,
            icon: 'error',
            confirmButtonText: 'Entendido',
            background: '#1a1a2e',
            color: '#f5f5f5',
            confirmButtonColor: '#ff4757',
            showClass: { popup: 'animate__animated animate__shakeX' },
            hideClass: { popup: 'animate__animated animate__fadeOutDown animate__faster' }
          });
        } else {
          this.errorMessage = `Credenciales inválidas. Te quedan ${this.attemptsRemaining} intento${this.attemptsRemaining !== 1 ? 's' : ''}.`;
        }
      }
    });
  }

  private registerUser() {
    // Validate all fields
    ['name', 'lastName', 'docNumber', 'email', 'password', 'confirmPassword'].forEach(f => this.validateField(f));

    const hasErrors = ['name', 'lastName', 'docNumber', 'email', 'password', 'confirmPassword'].some(
      f => !(this.validations as any)[f].valid
    );

    if (hasErrors) {
      this.isLoading = false;
      this.errorMessage = 'Por favor completa todos los campos correctamente';
      return;
    }

    if (this.registerData.password !== this.registerData.confirmPassword) {
      this.isLoading = false;
      this.errorMessage = 'Las contraseñas no coinciden';
      return;
    }

    const { confirmPassword, ...payload } = this.registerData;

    this.authService.register(payload).subscribe({
      next: () => {
        this.isLoading = false;
        Swal.fire({
          title: '¡Cuenta Creada!',
          html: '<span style="color:#a0a0a0">Tu cuenta se ha creado exitosamente.<br>Ya puedes iniciar sesión.</span>',
          icon: 'success',
          confirmButtonText: 'Ir al Login',
          background: '#1a1a2e',
          color: '#f5f5f5',
          confirmButtonColor: '#27ae60',
          showClass: { popup: 'animate__animated animate__fadeInUp animate__faster' },
          hideClass: { popup: 'animate__animated animate__fadeOutDown animate__faster' }
        }).then(() => {
          this.isLoginMode = true;
          this.email = this.registerData.email;
          this.password = '';
          this.resetValidations();
          this.cdr.detectChanges(); // Forzar actualización de la vista desde SweetAlert
        });
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.message || 'Error al crear la cuenta';
      }
    });
  }

  // Check if register form is complete for button enable
  get isRegisterFormValid(): boolean {
    return this.registerData.name.trim().length >= 2
      && this.registerData.lastName.trim().length >= 2
      && /^\d{6,12}$/.test(this.registerData.docNumber)
      && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.registerData.email)
      && this.registerData.password.length >= 6
      && this.registerData.password === this.registerData.confirmPassword;
  }

  get isLoginFormValid(): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email)
      && this.password.length >= 1
      && !this.isLocked;
  }
}
