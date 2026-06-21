// Funciones de formateo para RUT y fecha, utilizadas en los formularios de registro y login para mejorar la experiencia del usuario.
export const formatRut = (rut) => {
  // Eliminar todo lo que no sea número o k/K
  let cleanRut = rut.replace(/[^0-9kK]/g, '').toUpperCase();
  
  if (cleanRut.length === 0) return '';
  
  // Truncar a máximo 9 caracteres (8 números + 1 verificador)
  if (cleanRut.length > 9) {
    cleanRut = cleanRut.slice(0, 9);
  }
  
  let result = cleanRut;
  if (cleanRut.length > 1) {
    const cuerpo = cleanRut.slice(0, -1);
    const dv = cleanRut.slice(-1);
    
    // Formatear cuerpo con puntos
    let cuerpoFormat = '';
    for (let i = cuerpo.length - 1, j = 0; i >= 0; i--, j++) {
      if (j > 0 && j % 3 === 0) {
        cuerpoFormat = '.' + cuerpoFormat;
      }
      cuerpoFormat = cuerpo[i] + cuerpoFormat;
    }
    
    result = `${cuerpoFormat}-${dv}`;
  }
  
  return result;
};

// Función para formatear fechas en formato dd/mm/aa, utilizada en el formulario de registro para facilitar la entrada de la fecha de nacimiento.
export const formatDate = (date) => {
  // Eliminar todo lo que no sea número
  let cleanDate = date.replace(/[^0-9]/g, '');
  
  if (cleanDate.length === 0) return '';
  
  // Truncar a máximo 8 caracteres (DDMMYYYY)
  if (cleanDate.length > 8) {
    cleanDate = cleanDate.slice(0, 8);
  }
  
  let result = '';
  
  if (cleanDate.length > 0) {
    result += cleanDate.substring(0, 2);
  }
  if (cleanDate.length > 2) {
    result += '/' + cleanDate.substring(2, 4);
  }
  if (cleanDate.length > 4) {
    result += '/' + cleanDate.substring(4, 8);
  }
  
  return result;
};
