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
    serieSeason = document.getElementById('serie-season'),
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
addSerieModalButton.addEventListener('click', showModalSerie, false);
addSerieButton.addEventListener('click', addSerie, false);


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
 * Muestra modal para crear o actualizar serie
 * @param {Event} e 
 */
function showModalSerie(e) {
    e.preventDefault;

    const edit = !(e.target.id === 'add-serie-modal-button'),
        modal = document.getElementById('add-serie-modal');

    if (edit) {
        // Editando serie
        modal.querySelector('.modal-title').textContent = 'Editar serie';
        const serie = misSeries[e.target.dataset.id];
        serieTitle.value = serie.title;
        serieLastChapter.value = serie.lastChapter;
        serieAvailableChapter.value = serie.availableChapter;
        serieSeason.value = serie.season;
        seriePlatform.value = serie.platform;
        addSerieButton.dataset.id = serie.id;

        // Añadimos botón para borrar la serie si no existe
        let removeSerieButton = document.getElementById('remove-serie-button');
        if (typeof(removeSerieButton) === 'undefined' || removeSerieButton === null) {
            // Lo creamos
            removeSerieButton = document.createElement('button');
            removeSerieButton.id = 'remove-serie-button';
            removeSerieButton.classList.add('btn', 'btn-danger');
            removeSerieButton.textContent = 'Eliminar serie';
            removeSerieButton.dataset.id = serie.id;
            const modalFooter = modal.querySelector('.modal-footer');
            modalFooter.insertBefore(removeSerieButton, modalFooter.lastElementChild);
        }
        removeSerieButton.addEventListener('click', deleteSerie, false);

    } else {
        // Creando nueva serie
        modal.querySelector('.modal-title').textContent = 'Nueva serie';
        addSerieForm.reset();
        delete addSerieButton.dataset.id;

        // Si está presente el botón borrar serie lo quitamos
        const removeSerieButton = document.getElementById('remove-serie-button');
        if (typeof(removeSerieButton) != 'undefined' && removeSerieButton != null)
            removeSerieButton.remove();
    }

    // Mostramos las modal con jQuery
    $('#add-serie-modal').modal('show');

}

/**
 * Guardar la serie
 * @param {Event} e 
 */
function addSerie(e) {
    e.preventDefault();
    let serie = {};

    console.log('event.target: ', e.target);

    // Comprobamos si estamos logueados
    if (!localStorage.getItem('user')) {
        showCloseButton(false);
        return;
    }

    if (e.target.dataset.id === undefined || e.target.dataset.id === 0) {
        // Creamos nueva serie
        serie.id = Date.now();
        serie.title = serieTitle.value;
        serie.lastChapter = serieLastChapter.value;
        serie.availableChapter = serieAvailableChapter.value;
        serie.season = serieSeason.value;
        serie.platform = seriePlatform.value;
        serie.position = lastPosition + 1;

        // Añadimos la serie a FB
        if (saveSerie(serie)) {
            // Añadimos a la colección
            misSeries[serie.id] = serie;
        }

    } else {
        // Actualizamos serie
        serie = misSeries[e.target.dataset.id];
        serie.title = serieTitle.value;
        serie.lastChapter = serieLastChapter.value;
        serie.availableChapter = serieAvailableChapter.value;
        serie.season = serieSeason.value;
        serie.platform = seriePlatform.value;

        updateSerie(serie);
    }

    // Cerramos la modal y la limpiamos
    addSerieForm.reset();
    $('#add-serie-modal').modal('hide');

    showSeries();
}

/**
 * Elimina una serie
 * @param {Event} e 
 */
function deleteSerie(e) {
    const serie = misSeries[e.target.dataset.id];
    if (removeSerie(serie)) {
        // Cerramos la modal y la limpiamos
        addSerieForm.reset();
        $('#add-serie-modal').modal('hide');
        delete misSeries[e.target.dataset.id];
        showSeries();
    }
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

    // Ordenamos las series por orden alfabético
    sortSeriesByTitle();

    // Limpiamos la lista de series
    listaSeries.innerHTML = '';

    Object.values(misSeries).forEach(serie => {
        const clone = template.cloneNode(true);

        // Si el capítulo disponible es igual al visto marcamos la serie como vista
        if (serie.availableChapter === serie.lastChapter)
            clone.querySelector('li').classList.add('serie-viewed');

        // Recuperamos los valores
        clone.querySelector('.serie-title').textContent = serie.title;
        clone.querySelector('.serie-platform').innerHTML = `Temporada ${serie.season} en <b>${serie.platform}`;
        clone.querySelector('.serie-available-chapter-input').textContent = serie.availableChapter;
        clone.querySelector('.serie-last-chapter-input').textContent = serie.lastChapter;

        // Actualizamos el botón de editar la serie
        const editSerieButton = clone.querySelector('.edit-serie');
        editSerieButton.dataset.id = serie.id;
        editSerieButton.addEventListener("click", showModalSerie, false);

        // Preparamos los botones de añadir/quitar capítulos
        const buttonsPlus = clone.querySelectorAll('.plus-chapter');
        buttonsPlus.forEach(b => {
            b.dataset.id = serie.id;
            b.addEventListener("click", event => { updateChapter(event, true); }, false);
        });
        const buttonsMinus = clone.querySelectorAll('.minus-chapter');
        buttonsMinus.forEach(b => {
            b.dataset.id = serie.id;
            b.addEventListener("click", event => { updateChapter(event, false); }, false);
        })

        fragment.appendChild(clone);
    });

    listaSeries.appendChild(fragment);

    // Hacemos la lista de series ordenable utilizando la función de Bootstrap
    // Sortable.create(listaSeries, {
    //     onEnd: e => {
    //         listaSeries.querySelectorAll('li').forEach((el, index) => {
    //             series[el.dataset.id].position = index + 1;
    //         });

    //         // Actualizamos las series en FB
    //         // TODO: Crear función que guarde todas las series a la vez
    //         Object.values(series).forEach(tarea => saveSerie(tarea));
    //     }
    // });

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
    const serie = cloneSerie(misSeries[idSerie]);
    let lastChapter = parseInt(serie.lastChapter);
    let availableChapter = parseInt(serie.availableChapter);
    let newValue = -1;
    const changeLastChapter = e.target.parentElement.parentElement.classList.contains('serie-last-chapter');

    if (changeLastChapter) {
        // Último cap visto
        if ((add && lastChapter < availableChapter) || (!add && lastChapter > 0)) {
            serie.lastChapter = (add ? lastChapter + 1 : lastChapter - 1).toString();
            actualiza = true;
        }

    } else {
        // Último cap disponible
        if ((!add && lastChapter < availableChapter) || (add)) {
            serie.availableChapter = (add ? availableChapter + 1 : availableChapter - 1).toString();
            actualiza = true;
        }
    }

    if (actualiza) {
        if (updateSerie(serie)) {
            // Actualización correcta => refrescamos valores
            misSeries[serie.id] = serie;
            if (changeLastChapter) {
                e.target.parentElement.firstElementChild.textContent = serie.lastChapter;
            } else {
                e.target.parentElement.firstElementChild.textContent = serie.availableChapter;
            }

            // Comprobamos si la serie ya está vista
            const serieBox = e.target.parentElement.parentElement.parentElement.parentElement;
            if (serie.availableChapter === serie.lastChapter) {
                serieBox.classList.add('serie-viewed');
            } else {
                if (serieBox.classList.contains('serie-viewed'))
                    serieBox.classList.remove('serie-viewed');
            }
        }

    }
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
        misSeries = {};
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
 * Ordena las series por orden albético modificando su posición
 */
function sortSeriesByTitle() {
    let seriesArray = Object.values(misSeries);
    if (seriesArray.length > 1) {
        seriesArray.sort((a, b) => {
            return a.title.toLowerCase().localeCompare(b.title.toLowerCase());
        });
        misSeries = {};
        seriesArray.forEach(tarea => misSeries[tarea.id] = tarea);

    } else
        lastPosition = 1;

}

/**
 * Ordena las series según el campo posición
 */
function sortSeriesByPosition() {
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

function cloneSerie(serie) {
    const newSerie = {};
    newSerie.id = serie.id;
    newSerie.title = serie.title;
    newSerie.lastChapter = serie.lastChapter;
    newSerie.availableChapter = serie.availableChapter;
    newSerie.platform = serie.platform;
    newSerie.season = serie.season;
    newSerie.position = serie.position;
    newSerie.modified = serie.modified;

    return newSerie;
}