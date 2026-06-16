import Swal from 'sweetalert2';

/**
 * AppSwal is a globally configured SweetAlert mixin designed to maintain 
 * visual consistency and a premium feel across the entire application.
 * 
 * It disables default button styling and applies our custom classes,
 * which are styled in `styles.scss`.
 */
export const AppSwal = Swal.mixin({
  background: '#1a1a2e',
  color: '#f5f5f5',
  backdrop: 'rgba(0, 0, 0, 0.7)', // Dark semi-transparent background
  customClass: {
    popup: 'app-swal-popup',
    title: 'app-swal-title',
    htmlContainer: 'app-swal-content',
    confirmButton: 'app-swal-btn app-swal-confirm',
    denyButton: 'app-swal-btn app-swal-deny',
    cancelButton: 'app-swal-btn app-swal-cancel',
  },
  buttonsStyling: false,
  scrollbarPadding: false,
  heightAuto: false,
  showClass: {
    popup: 'animate__animated animate__zoomIn animate__faster'
  },
  hideClass: {
    popup: 'animate__animated animate__zoomOut animate__faster'
  }
});

export default AppSwal;
