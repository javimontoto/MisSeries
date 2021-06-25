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