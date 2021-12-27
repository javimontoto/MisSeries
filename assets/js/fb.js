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
                // Si no ha verificado el email no puede acceder => mostramos popup
                user = firebase.auth().currentUser;
                if (!user.emailVerified) {
                    emailVerifiedDialog();
                    return;
                }

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
            showCloseButton(false);
            user = userCredential.user;

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
            myAlert('Confirmación de email',
                'Se ha enviado un correo electrónico para que confirme la dirección de email proporcionada (revise la bandeja de spam).<br><br>Una vez lo confirme podrá iniciar sesión.');
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
 * Guarda la serie 
 * @param {Object} serie Objeto de tipo serie
 * @param {boolean} update Indica si actualiza (true) o crea (false)
 */
function saveSerie(serie, update = false) {

    // Si tiene imagen la guardamos primero para obtener la referencia
    if (serie.file !== undefined) {
        return update ? saveCover(serie, updateSerie) : saveCover(serie, createSerie);
    } else {
        return update ? updateSerie(serie) : createSerie(serie);
    }
}

/**
 * Crea la serie en FB
 * @param {Object} serie Objeto de tipo serie
 */
function createSerie(serie) {
    firebase.database().ref('series/' + user.uid + '/' + serie.id).set({
            id: serie.id,
            title: serie.title,
            lastChapter: serie.lastChapter,
            availableChapter: serie.availableChapter,
            season: serie.season,
            platform: serie.platform,
            platformColor: serie.platformColor,
            archived: serie.archived,
            position: serie.position,
            modified: Date.now(),
            caratula: serie.caratula !== undefined ? { url: serie.caratula.url, name: serie.caratula.name } : {}
        })
        .catch((error) => {
            myAlert('Atención', error.message);
            return false;
        });

    return true;
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
            platformColor: serie.platformColor,
            archived: (serie.archived !== undefined ? serie.archived : false),
            modified: Date.now(),
            caratula: serie.caratula !== undefined ? { url: serie.caratula.url, name: serie.caratula.name } : {}
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
                misSeriesOrginal = series.val();
                fillAllPlatforms();

            } else {
                misSeries = {};
                misSeriesOrginal = {};
                allPlatforms = [];
                lastPosition = 0;
            }

            callback();

        }).catch((error) => {
            myAlert('Atención', error.message);
        });

}

/**
 * Elimina una serie y, si la tiene su carátula
 * 
 * @param {Object} serie Objeto de tipo serie
 */
function removeSerie(serie) {

    // Si tiene carátula la borramos
    if (serie.caratula !== undefined) {
        return deleteCover(serie, delSerie);
    } else {
        return delSerie(serie);
    }
}

/**
 * elima una serie
 * 
 * @param {Object} serie Objeto de tipo serie
 */
function delSerie(serie) {
    firebase.database().ref('series/' + user.uid + '/' + serie.id).remove()
        .catch((error) => {
            myAlert('Atención', error.message);
            return false;
        });
    return true;
}

/**
 * Guarda la carátula de la serie
 * 
 * @param {Object} serie Objeto de tipo serie
 * @param {function} callback Función que se ejutará después de realizar la petición a FB si todo va bien
 * @returns 
 */
function saveCover(serie, callback) {
    return new Promise(function(resolve, reject) {

        if (serie.file !== undefined) {
            let storageRef = firebase.storage().ref('series/caratulas/' + user.uid + '/');

            let extension = getExtensionFile(serie.file.name);

            var metadata = {
                'contentType': serie.file.type
            };

            storageRef.child(serie.id + '.' + extension).put(serie.file, metadata)
                .then(snapshot => {
                    // Let's get a download URL for the file.
                    snapshot.ref.getDownloadURL().then(url => {
                        caratula = {};
                        caratula.name = serie.id + '.' + extension;
                        caratula.url = url;
                        serie.caratula = caratula;
                        resolve(callback(serie));
                    }).catch(error => {
                        myAlert('Atención', error.message);
                        reject(false);
                    });

                }).catch(error => {
                    myAlert('Atención', error.message);
                    reject(false);
                });

        }
    });
}

function getExtensionFile(filename) {
    if (filename !== "" && filename.includes('.')) {
        return filename.split('.').pop();
    }

    return '';
}

/**
 * Borra una serie con carátula
 * 
 * @param {Object} serie 
 * @returns 
 */
function deleteCover(serie, deleteSerie = false) {
    return new Promise(function(resolve, reject) {
        firebase.storage().ref('series/caratulas/' + user.uid + '/' + serie.caratula.name).delete().then(() => {
            // File deleted successfully
            resolve(delSerie(serie));
        }).catch((error) => {
            if (error.code === "storage/object-not-found") {
                // La carátula no existe => podemos borrar la serie
                resolve(delSerie(serie));
            } else {
                myAlert('Atención', error.message);
                reject(false);
            }
        });
    });
}