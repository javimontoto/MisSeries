/*** VARIABLES GLOBALES ***/
/** Array con las series */
let misSeries = {};
/** Última posición ocupada */
let lastPosition = 0;
/** Objeto con el usuario usuario de FB */
let user = {}; //=> Usuario de firebase 


/*** SELECTORES ***/
const listaSeries = document.getElementById('lista-series'),
    template = document.getElementById('template').content,
    fragment = document.createDocumentFragment(),
    loginModalButton = document.getElementById('login-modal-button'),
    registerModalButton = document.getElementById('register-modal-button'),
    loginButton = document.getElementById('login-button'),
    registerButton = document.getElementById('register-button'),
    verificationButton = document.getElementById('verification-button'),
    logoutButton = document.getElementById('logout-button'),
    addSerieModalButton = document.getElementById('add-serie-modal-button'),
    resetPassButton = document.getElementById('reset-pass-button'),
    addSerieForm = document.getElementById('add-serie-form'),
    serieTitle = document.getElementById('serie-title'),
    serieAvailableChapter = document.getElementById('serie-available-chapter'),
    serieLastChapter = document.getElementById('serie-last-chapter'),
    seriePlatform = document.getElementById('serie-platform'),
    addSerieButton = document.getElementById('add-serie-button');



/*** LISTENERS ***/
document.addEventListener('DOMContentLoaded', () => {
    // Incializamos Firebase
    initFirebase();

    getAllSeries();
});

loginButton.addEventListener('click', singInFB, false);
registerButton.addEventListener('click', signUpFB, false);
verificationButton.addEventListener('click', sendEmailVerification, false);
logoutButton.addEventListener('click', signOutFB, false);
resetPassButton.addEventListener('click', sendPasswordReset, false);
addSerieButton.addEventListener('click', e => { addSerie(e); });


/*** FUNCIONES PRINCIPALES ***/
/**
 * Carga la lista de series de FB
 */
function getAllSeries() {
    if (localStorage.getItem('user')) {
        // Tenemos usuario logueado => recuperamos series de FB
        user = JSON.parse(localStorage.getItem('user'));
        showCloseButton(true);
        showLoader(true);
        getFBSeries(showSeries);

    } else {
        // No tenemos usuario logueado => Recuperamos las series guardas en localStorage
        showCloseButton(false);
    }
}

/**
 * Guardar la serie
 * @param {Event} e 
 */
function addSerie(e) {
    e.preventDefault();

    // Creamos la tarea
    const serie = {};
    serie.id = Date.now();
    serie.title = serieTitle.value;
    serie.lastChapter = serieLastChapter.value;
    serie.availableChapter = serieAvailableChapter.value;
    serie.platform = seriePlatform.value;
    serie.position = lastPosition + 1;

    // Comprobamos si estamos logueados
    if (localStorage.getItem('user')) {
        // Añadimos la serie a FB
        if (!saveSerie(serie))
            return;
    }

    // Añadimos a la colección
    misSeries[serie.id] = serie;

    // Cerramos la modal y la limpiamos
    closeModal('add-serie-modal');
    addSerieForm.reset();

    showSeries();
}

function editSerie(e) {
    const serie = misSeries[e.target.dataset.id];

}

/**
 * Pintar las series que esten guardadas
 */
function showSeries() {

    // Ocultamos el loader
    showLoader(false);

    // Comprobamos si la lista de objetos está vacía
    if (Object.values(misSeries).length === 0) {
        listaSeries.innerHTML = `<div class="alert alert-dark text-center">No hay series pendientes guardadas 😢</div>`;
        return;
    }

    // Ordenamos las series según su posición
    sortSeries();

    // Limpiamos la lista de series
    listaSeries.innerHTML = '';

    Object.values(misSeries).forEach(serie => {
        const clone = template.cloneNode(true);
        clone.querySelector('li').dataset.id = serie.id;
        clone.querySelector('.serie-title').textContent = serie.title;
        const editSerieButton = clone.querySelector('.edit-serie');
        editSerieButton.addEventListener("click", e => editSerie(e));
        editSerieButton.dataset.id = serie.id;
        clone.querySelector('.serie-platform').textContent = serie.platform;
        clone.querySelector('.serie-available-chapter-input').textContent = serie.availableChapter;
        clone.querySelector('.serie-last-chapter-input').textContent = serie.lastChapter;
        const buttonsPlus = clone.querySelectorAll('.plus-chapter');
        buttonsPlus.forEach(b => {
            b.dataset.id = serie.id;
            b.addEventListener("click", e => updateChapter(e, true));
        });
        const buttonsMinus = clone.querySelectorAll('.minus-chapter');
        buttonsMinus.forEach(b => {
            b.dataset.id = serie.id;
            b.addEventListener("click", e => updateChapter(e, false));
        })

        fragment.appendChild(clone);
    });

    listaSeries.appendChild(fragment);

    // Hacemos la lista de series ordenable utilizando la función de Bootstrap
    Sortable.create(listaSeries, {
        onEnd: e => {
            listaSeries.querySelectorAll('li').forEach((el, index) => {
                series[el.dataset.id].position = index + 1;
            });

            // Actualizamos las series en FB
            // TODO: Crear función que guarde todas las series a la vez
            Object.values(series).forEach(tarea => saveSerie(tarea));
        }
    });

}

/**
 * Realiza la acción de añadir capítulo o borrarlo en la sección de último capítulo viso o disponible según el botón
 *  
 * @param {Event} e 
 * @param {Boolean} add Identifica si la operación es añadir capítulo (true) o borrar (false).
 */
function updateChapter(e, add) {
    let actualiza = false;
    const idSerie = e.target.dataset.id;
    const serie = misSeries[idSerie];
    const lastChapter = e.target.parentElement.parentElement.classList.contains('serie-last-chapter');

    if (lastChapter) {
        // Último cap visto
        if ((add && parseInt(serie.lastChapter) < parseInt(serie.availableChapter)) || (!add && parseInt(serie.lastChapter) > 0)) {
            serie.lastChapter = (add ? parseInt(serie.lastChapter) + 1 : parseInt(serie.lastChapter) - 1).toString();
            e.target.parentElement.firstElementChild.textContent = serie.lastChapter;
            actualiza = true;
        }

    } else {
        // Último cap disponible
        if (add || parseInt(serie.availableChapter) > 0) {
            serie.availableChapter = (add ? parseInt(serie.availableChapter) + 1 : parseInt(serie.availableChapter) - 1).toString();
            e.target.parentElement.firstElementChild.textContent = serie.availableChapter;
            actualiza = true;
        }
    }

    if (actualiza)
        updateSerie(serie);
}


/*** FUNCIONES AUXILIARES ***/
/**
 * Muestra u oculta el botón de cerrar sesión, y a la vez muestra u oculta los botones de entrar y registrarse
 * @param {boolean} show True = muestra, False = oculta
 */
function showCloseButton(show) {
    if (show) {
        // Mostramos el botón de salir y ocultamos los de entrar y registrarse
        loginModalButton.classList.replace('active', 'hidden');
        registerModalButton.classList.replace('active', 'hidden');
        addSerieModalButton.classList.replace('hidden', 'active');
        logoutButton.classList.replace('hidden', 'active');

        // Si no ha verificado el email mostramos el botón de reenvío
        if (!user.emailVerified) {
            verificationButton.classList.replace('hidden', 'active');
        }

    } else {
        // Ocultamos el botón de salir y mostramos los de entrar y registrarse
        // y limpiamos la lista

        logoutButton.classList.replace('active', 'hidden');
        addSerieModalButton.classList.replace('active', 'hidden');
        verificationButton.classList.replace('active', 'hidden');
        listaSeries.classList.replace('active', 'hidden');
        listaSeries.innerHTML = '';
        loginModalButton.classList.replace('hidden', 'active');
        registerModalButton.classList.replace('hidden', 'active');

    }
}

/**
 * Cierra la modal con el id proporcionado
 * @param {string} modalId Id de la modal: login-modal, register-modal
 */
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');
    modal.setAttribute('style', 'display: none');

    // get modal backdrops
    const modalsBackdrops = document.getElementsByClassName('modal-backdrop');

    // remove every modal backdrop
    for (let i = 0; i < modalsBackdrops.length; i++) {
        document.body.removeChild(modalsBackdrops[i]);
    }
}

/**
 * Comprueba si el email y la contraseña tienen el formato adecuado y si no marca en rojo el campo
 * @param {String} email 
 * @param {String} pass 
 * @param {String} type Acción que lo ejecuta: login, register o resetPass
 * @returns {Boolean}
 */
function checkEmailAndPass(email, pass, type) {
    let result = true,
        resetPass = false;
    const mailFormat = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

    // Si la acción es resetear contraseña 
    if (type === 'resetPass') {
        type = 'login';
        resetPass = true;
    }

    // Comprobamos el email
    const emailInput = document.getElementById('email-' + type);
    if (email.length === 0 || !mailFormat.test(String(email).toLowerCase())) {
        emailInput.classList.add('is-invalid');
        emailInput.nextElementSibling.classList.replace('hidden', 'active');
        result = false;
    } else {
        emailInput.classList.remove('is-invalid');
        emailInput.nextElementSibling.classList.replace('active', 'hidden');
    }

    if (!resetPass) {
        // Comprobamos la contraseña
        const passInput = document.getElementById('pass-' + type);
        if (pass.length < 6) {
            passInput.classList.add('is-invalid');
            passInput.nextElementSibling.classList.replace('hidden', 'active');
            result = false;
        } else {
            passInput.classList.remove('is-invalid');
            passInput.nextElementSibling.classList.replace('active', 'hidden');
        }
    }

    return result;
}

/**
 * Muestra u oculta el gif de cargando
 * @param {Boolean} show Muestra (true) u oculta (false)
 */
function showLoader(show) {
    if (show) {
        const loader = document.createElement('div');
        loader.id = 'loader';
        loader.classList.add('center');
        listaSeries.appendChild(loader);
    } else if (document.getElementById('loader')) {
        document.getElementById('loader').remove();
    }
}

/**
 * Ordena las series según el campo posición
 */
function sortSeries() {
    let seriesArray = Object.values(misSeries);
    if (seriesArray.length > 1) {
        seriesArray.sort((a, b) => {
            return a.position - b.position;
        });
        lastPosition = seriesArray[seriesArray.length - 1].position;
        misSeries = {};
        seriesArray.forEach(tarea => misSeries[tarea.id] = tarea);

    } else
        lastPosition = 1;

}