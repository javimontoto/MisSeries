/**
 * Funciones para mostrar ventanas de alerta, diálogo...
 */

function myAlert(title, message) {
   bootbox.alert({
      title: title,
      message: message,
      buttons: {
         ok: {
            label: "Aceptar",
            className: 'btn-primary',
         }
      }
   })
}

/**
 * Popup cuando el usuario entra pero no ha verificado su email
 * 
 * @param {String} title 
 * @param {String} message 
 */
function emailVerifiedDialog() {
   bootbox.dialog({
      title: 'Atención',
      message: 'No ha verificado la la dirección de email proporcionada.<br><br>Por favor, vaya a su bandeja de entrada y confirme el email de verificación.<br><br>Si ha pasado más de una hora y no lo ha recibido puede pulsar en el botón de reenviar email.',
      buttons: {
         resend: {
             label: "Reenviar email de verificación",
             className: 'btn-danger',
             callback: function(){
               sendEmailVerification();
             }
         },
         cancel: {
             label: "Cancelar",
             className: 'btn-secondary',
         },
     }
   })
}