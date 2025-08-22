
import Swal from 'sweetalert2';

// Configure SweetAlert2 with our design system
const swalConfig = {
  customClass: {
    popup: 'rounded-xl shadow-2xl swal-wide-popup',
    title: 'text-xl font-semibold text-foreground',
    content: 'text-muted-foreground',
    confirmButton: 'bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-lg font-medium transition-colors',
    cancelButton: 'bg-secondary text-secondary-foreground hover:bg-secondary/90 px-4 py-2 rounded-lg font-medium transition-colors ml-2',
    input: 'border border-input rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-primary focus:border-transparent swal-input-fixed',
  },
  buttonsStyling: false,
};

export const showSwal = (options) => {
  return Swal.fire({
    ...swalConfig,
    ...options,
  });
};

export default swalConfig;
