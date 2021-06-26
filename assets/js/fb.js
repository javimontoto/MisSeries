// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCEufG-h-c_ChNywU_nCBjis8z9jEaVPS0",
    authDomain: "mis-series-adb9e.firebaseapp.com",
    databaseURL: "https://mis-series-adb9e-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "mis-series-adb9e",
    storageBucket: "mis-series-adb9e.appspot.com",
    messagingSenderId: "281840285483",
    appId: "1:281840285483:web:cf97b1d9d41d6e500ff76e"
};

/**
 * Initialize Firebase
 */
function initFirebase() {
    firebase.initializeApp(firebaseConfig);
}


/*** AUTENTIFICACIÓN ***/
/**
 * Entra en Firebase
 */
function singInFB() {
    if (user != {}) {
        let email = document.getElementById('email-login').value,
            password = document.getElementById('pass-login').value;

        if (!checkEmailAndPass(email, password, 'login'))
            return;

        // Sign in with email and pass.
        firebase.auth().signInWithEmailAndPassword(email, password)
            .then((userCredential) => {
                $('#login-modal').modal('hide');
                user = firebase.auth().currentUser;
                localStorage.setItem('user', JSON.stringify(user));
                showCloseButton(true);
                getAllSeries();
            })
            .catch((error) => {
                // Handle Errors here.
                $('#login-modal').modal('hide');
                const errorCode = error.code;
                const errorMessage = error.message;
                switch (errorCode) {
                    case 'auth/wrong-password':
                        myAlert('Atención', 'La contraseña es incorrecta.');
                        break;
                    case 'auth/user-not-found':
                        myAlert('Atención', 'No hay ningún usuario con ese email.')
                        break;
                    default:
                        myAlert('Atención', errorMessage);
                        break;
                }
                console.log(error);
                showCloseButton(false);
            });
    } else {
        $('#login-modal').modal('hide');
    }
}

/**
 * Registra nuevo usuario en Firebase
 */
function signUpFB() {

    const email = document.getElementById('email-register').value;
    const password = document.getElementById('pass-register').value;

    if (!checkEmailAndPass(email, password, 'register'))
        return;

    // Create user with email and pass.
    firebase.auth().createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            $('#register-modal').modal('hide');
            showCloseButton(true);

            // Enviamos correo de verificación
            sendEmailVerification();

        })
        .catch((error) => {
            // Handle Errors here.
            $('#register-modal').modal('hide');

            const errorCode = error.code;
            const errorMessage = error.message;
            switch (errorCode) {
                case 'auth/weak-password':
                    myAlert('Atención', 'La contraseña debe tener al menos 6 caracteres.');
                    break;
                case 'auth/email-already-in-use':
                    myAlert('Atención', 'La dirección de correo electrónico ya está siendo utilizada por otra cuenta.');
                    break;

                default:
                    myAlert('Atención', errorMessage);
                    break;
            }

            console.log(error);
        });
}

/**
 * Cierra la sesión en Firebase
 */
function signOutFB() {
    if (user) {
        firebase.auth().signOut();
        localStorage.removeItem('user');

        showCloseButton(false);
    }
}

/**
 * Envía el email de verificación del correo electrónico proporcionado
 */
function sendEmailVerification() {
    user.sendEmailVerification()
        .then(() => {
            myAlert('Confirmación de email', 'Se ha enviado un correo electrónico para que confirme la dirección de email proporcionada.');
        })
        .catch((error) => {
            console.log(error);
        });
}

/**
 * Envía un email para resetear la contraseña
 * @returns Boolean Devuelve true si todo fue bien, false en otro caso
 */
function sendPasswordReset() {
    let email = document.getElementById('email-login').value;

    if (!checkEmailAndPass(email, '', 'resetPass'))
        return;

    firebase.auth().sendPasswordResetEmail(email).then(function() {
        // Password Reset Email Sent!
        myAlert('Reseteo de contraseña', 'Se ha enviado un correo electrónico con las instrucciones para resetear la contraseña.');
    }).catch(function(error) {
        // Handle Errors here.
        var errorCode = error.code;
        var errorMessage = error.message;
        if (errorCode == 'auth/invalid-email') {
            myAlert('Atención', errorMessage);
        } else if (errorCode == 'auth/user-not-found') {
            myAlert('Atención', errorMessage);
        }
        console.log(error);
    });
}


/*** MÉTODOS FB */
/**
 * Guarda la serie en FB
 * @param {Object} serie Objeto de tipo serie
 */
function saveSerie(serie) {
    firebase.database().ref('series/' + user.uid + '/' + serie.id).set({
            id: serie.id,
            title: serie.title,
            lastChapter: serie.lastChapter,
            availableChapter: serie.availableChapter,
            season: serie.season,
            platform: serie.platform,
            position: serie.position,
            modified: Date.now()
        })
        .catch((error) => {
            myAlert('Atención', error.message);
            return false;
        });

    return true;
}

/**
 * Recupera las series almacenadas en FB
 * @param {function} callback Función que se ejutará después de realizar la petición a FB si todo va bien
 */
function getFBSeries(callback) {
    const db = firebase.database().ref();
    db.child('series').child(user.uid).get()
        .then((series) => {
            if (series.exists()) {
                misSeries = series.val();
            } else {
                misSeries = {};
                lastPosition = 0;
            }
            callback();

        }).catch((error) => {
            myAlert('Atención', error.message);
        });

}

/**
 * Actualiza una serie
 * @param {Object} serie Objeto de tipo serie
 */
function updateSerie(serie) {
    firebase.database().ref('series/' + user.uid + '/' + serie.id).update({
            id: serie.id,
            title: serie.title,
            lastChapter: serie.lastChapter,
            availableChapter: serie.availableChapter,
            position: serie.position,
            season: serie.season,
            platform: serie.platform,
            modified: Date.now()
        })
        .catch((error) => {
            myAlert('Atención', error.message);
            return false;
        });

    return true;
}

/**
 * Elimina una serie
 * @param {Object} serie Objeto de tipo serie
 */
function removeSerie(serie) {
    firebase.database().ref('series/' + user.uid + '/' + serie.id).remove()
        .catch((error) => {
            myAlert('Atención', error.message);
            return false;
        });

    return true;
}