/*** VARIABLES GLOBALES ***/
let misSeries = {}; // Series que se mostrarán (tras filtro)
let misSeriesOrginal = {}; // Copia con las series de la BBDD
let lastPosition = 0; // Última posición ocupada
let user = {}; // Objeto con el usuario usuario de FB
let allPlatforms = []; // Lista con todas las plataformas (para filtrar)
let filterActive = false; // Marca si se está filtrando


/*** SELECTORES ***/
const listaSeries = document.getElementById('lista-series'),
    template = document.getElementById('template').content,
    fragment = document.createDocumentFragment(),
    loginModalButton = document.getElementById('login-modal-button'),
    registerModalButton = document.getElementById('register-modal-button'),
    loginButton = document.getElementById('login-button'),
    registerButton = document.getElementById('register-button'),
    logoutButton = document.getElementById('logout-button'),
    addSerieModalButton = document.getElementById('add-serie-modal-button'),
    // filterButton = document.getElementById('filter-button'),
    filterBox = document.getElementById('filter-box'),
    resetPassButton = document.getElementById('reset-pass-button'),
    addSerieForm = document.getElementById('add-serie-form'),
    serieTitle = document.getElementById('serie-title'),
    serieAvailableChapter = document.getElementById('serie-available-chapter'),
    serieLastChapter = document.getElementById('serie-last-chapter'),
    serieSeason = document.getElementById('serie-season'),
    seriePlatform = document.getElementById('serie-platform'),
    seriePlatformColor = document.getElementById('serie-platform-color'),
    serieArchived = document.getElementById('serie-archived'),
    addSerieButton = document.getElementById('add-serie-button'),
    filterArchived = document.getElementById('filter-archived'),
    filterAvailable = document.getElementById('filter-available'),
    filterPlatform = document.getElementById('filter-platform');



/*** LISTENERS ***/
document.addEventListener('DOMContentLoaded', () => {
    // Incializamos Firebase
    initFirebase();

    getAllSeries();
});

loginButton.addEventListener('click', singInFB, false);
registerButton.addEventListener('click', signUpFB, false);
logoutButton.addEventListener('click', signOutFB, false);
resetPassButton.addEventListener('click', sendPasswordReset, false);
addSerieModalButton.addEventListener('click', showModalSerie, false);
addSerieButton.addEventListener('click', addSerie, false);
seriePlatformColor.addEventListener('change', updateSeriePlatformColor, false);
// filterButton.addEventListener('click', changeFilterButtonIcon, false);
filterArchived.addEventListener('change', runFilter, false);
filterAvailable.addEventListener('change', runFilter, false);



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
        getFBSeries(runFilter);

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
        seriePlatformColor.value = serie.platformColor;
        serieArchived.checked = serie.archived;
        addSerieButton.dataset.id = serie.id;

        updateSeriePlatformColor();

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

    // Comprobamos si estamos logueados
    if (!localStorage.getItem('user')) {
        showCloseButton(false);
        return;
    }

    // Validamos el formulario
    if (addSerieForm.checkValidity() === false) {
        addSerieForm.classList.add('was-validated');
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
        serie.platformColor = seriePlatformColor.value;
        serie.archived = serieArchived.checked;
        serie.position = lastPosition + 1;

        // Añadimos la serie a FB
        if (saveSerie(serie)) {
            // Añadimos a la colección
            misSeriesOrginal[serie.id] = serie;
        }

    } else {
        // Actualizamos serie
        serie = misSeries[e.target.dataset.id];
        serie.title = serieTitle.value;
        serie.lastChapter = serieLastChapter.value;
        serie.availableChapter = serieAvailableChapter.value;
        serie.season = serieSeason.value;
        serie.platform = seriePlatform.value;
        serie.platformColor = seriePlatformColor.value;
        serie.archived = serieArchived.checked;

        if (!updateSerie(serie)) {
            myAlert('Atención', 'Se ha producido un error al actualizar la serie.');
        } else {
            misSeriesOrginal[serie.id] = serie;
            fillAllPlatforms();
        }
    }

    // Cerramos la modal y la limpiamos
    addSerieForm.reset();
    $('#add-serie-modal').modal('hide');

    runFilter();
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
        delete misSeriesOrginal[e.target.dataset.id];
        showSeries();
    }
}

/**
 * Pintar las series que esten guardadas
 */
function showSeries() {

    // Limpiamos la lista de series
    listaSeries.innerHTML = '';

    // Ocultamos el loader
    showLoader(false);

    // Comprobamos si la lista de objetos está vacía
    if (Object.values(misSeries).length === 0) {
        const divNoSeries = document.createElement('div');
        divNoSeries.classList.add('alert', 'alert-secondary', 'text-center');
        const divNoSeriesText = document.createElement('p');
        divNoSeriesText.innerHTML = filterActive ? 'No hay series que coincidan con el filtro 😢.' : 'No hay series guardadas 😢.';
        const buttonClone = addSerieModalButton.cloneNode(true);
        buttonClone.addEventListener('click', showModalSerie, false);
        divNoSeries.appendChild(divNoSeriesText);
        divNoSeries.appendChild(buttonClone);
        listaSeries.appendChild(divNoSeries);
        return;
    }

    // Ordenamos las series por orden alfabético
    sortSeriesByTitle();

    Object.values(misSeries).forEach(serie => {
        const clone = template.cloneNode(true);

        // Comprobamos si la posición es mayor que la última guardada
        checkLastPosition(serie.position);

        // Si el capítulo disponible es igual al visto marcamos la serie como vista
        if (serie.availableChapter === serie.lastChapter)
            clone.querySelector('li').classList.add('serie-viewed');

        // Recuperamos los valores
        clone.querySelector('.serie-title').textContent = `${serie.title} [${serie.season}]`;
        clone.querySelector('.serie-platform').innerHTML = serie.platform;
        clone.querySelector('.serie-platform').style.color = serie.platformColor;
        clone.querySelector('.serie-available-chapter-input').textContent = serie.availableChapter;
        clone.querySelector('.serie-last-chapter-input').textContent = serie.lastChapter;

        // Botón de archivar serie
        const archiveSerieButton = clone.querySelector('.archive-serie');
        if (serie.archived) {
            archiveSerieButton.classList.remove('fa-archive');
            archiveSerieButton.classList.add('fa-box-open');
        }
        archiveSerieButton.dataset.id = serie.id;
        archiveSerieButton.addEventListener('click', event => { archiveSerie(event); }, false);
        if (serie.archived) {

        }

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
    const changeLastChapter = e.target.parentElement.parentElement.parentElement.classList.contains('serie-last-chapter');

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
            misSeriesOrginal[serie.id] = serie;
            if (changeLastChapter) {
                e.target.parentElement.parentElement.firstElementChild.textContent = serie.lastChapter;
            } else {
                e.target.parentElement.parentElement.firstElementChild.textContent = serie.availableChapter;
            }

            // Comprobamos si la serie ya está vista
            const serieBox = e.target.parentElement.parentElement.parentElement.parentElement.parentElement;
            if (serie.availableChapter === serie.lastChapter) {
                serieBox.classList.add('serie-viewed');
            } else {
                if (serieBox.classList.contains('serie-viewed'))
                    serieBox.classList.remove('serie-viewed');
            }
        } else {
            myAlert('Atención', 'Se ha producido un error al actualizar la serie.');
            t
        }

    }
}

/**
 * Cambia el icono del botón de mostrar los filtros
 */
// function changeFilterButtonIcon() {
//     const buttonIcon = filterButton.getElementsByTagName('i')[0];
//     buttonIcon.classList.toggle('fa-minus');
//     buttonIcon.classList.toggle('fa-plus');
// }

/**
 * Archiva o desarchiva (según si ya lo estuviera o no) una serie con botón directo
 * @param {Event} e 
 */
function archiveSerie(e) {
    const idSerie = e.target.dataset.id;
    const serie = cloneSerie(misSeries[idSerie]);

    serie.archived = !serie.archived;
    if (updateSerie(serie)) {
        // Actualización correcta => refrescamos valores
        misSeries[serie.id] = serie;
        misSeriesOrginal[serie.id] = serie;
    } else {
        myAlert('Atención', 'Se ha producido un error al actualizar la serie.');
    }

    runFilter();
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
        filterBox.classList.replace('hidden', 'active');

    } else {
        // Ocultamos el botón de salir y mostramos los de entrar y registrarse
        // y limpiamos la lista
        misSeries = {};
        misSeriesOrginal = {};
        allPlatforms = [];
        logoutButton.classList.replace('active', 'hidden');
        addSerieModalButton.classList.replace('active', 'hidden');
        listaSeries.classList.replace('active', 'hidden');
        listaSeries.innerHTML = '';
        loginModalButton.classList.replace('hidden', 'active');
        registerModalButton.classList.replace('hidden', 'active');
        filterBox.classList.replace('active', 'hidden');
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

/**
 * Clona un objeto serie
 * 
 * @param {Object} serie Objeto serie
 * @returns 
 */
function cloneSerie(serie) {
    const newSerie = {};
    newSerie.id = serie.id;
    newSerie.title = serie.title;
    newSerie.lastChapter = serie.lastChapter;
    newSerie.availableChapter = serie.availableChapter;
    newSerie.platform = serie.platform;
    newSerie.platformColor = serie.platformColor;
    newSerie.season = serie.season;
    newSerie.position = serie.position;
    newSerie.modified = serie.modified;
    newSerie.archived = serie.archived;

    return newSerie;
}

/**
 * Comprueba si la nueva posición es mayor que la última y si lo es la actualiza
 * 
 * @param {Number} newPosition Nueva posición a comprobar si es la mayor
 */
function checkLastPosition(newPosition) {
    if (newPosition > lastPosition)
        lastPosition = newPosition;
}

function updateSeriePlatformColor() {
    seriePlatformColor.style.color = seriePlatformColor.value;
}

/**
 * Recupera las plataformas registradas
 */
function fillAllPlatforms() {
    const allPlatformsFull = Object.values(misSeriesOrginal).map(s => {
        if (s.platform !== undefined && s.platform !== '') {
            return { 'plataforma': s.platform, 'color': s.platformColor };
        }
    });

    // Quitamos los duplicados y ordenamos
    // allPlatforms = allPlatformsFull.length > 0 ? [...new Set(allPlatformsFull)].sort() : [];
    allPlatforms = allPlatformsFull;

    fillSelectPlatformFilter();
}

/**
 * Rellena las plataformas seleccionables del filtro
 */
function fillSelectPlatformFilter() {
    // filterPlatform.removeEventListener('change', runFilter);

    if (allPlatforms.length > 0) {
        // Borramos los elementos que haya
        const nOptions = filterPlatform.options.length - 1;
        for (var i = nOptions; i >= 0; i--) {
            filterPlatform.remove(i);
        }

        // Añadimos el elemento 0
        var opt = document.createElement('option');
        opt.value = 0;
        opt.innerHTML = 'TODAS';
        filterPlatform.appendChild(opt);
    }

    allPlatforms.forEach(p => {
        var opt = document.createElement('option');
        opt.value = p.plataforma;
        opt.innerHTML = adjustLabelSize(p.plataforma, 12); // Solo mostramos 12 caracteres
        opt.style.color = p.color;
        opt.style.backgroundColor = 'black';
        filterPlatform.appendChild(opt);
    });

    filterPlatform.addEventListener('change', runFilter, false);
}

/**
 * Filtra las series según si están archivadas, plataforma o con caps disponibles
 */
function runFilter() {
    filterActive = true;
    const selectedPlatform = filterPlatform.options[filterPlatform.selectedIndex].value;
    const selectedArchived = filterArchived.checked;
    const selectedAvailable = filterAvailable.checked;

    misSeries = {};
    Object.values(misSeriesOrginal).forEach(serie => {
        if (checkFilterArchived(serie, selectedArchived) &&
            checkFilterPlataform(serie, selectedPlatform) &&
            checkFilterAvailable(serie, selectedAvailable)) {
            misSeries[serie.id] = serie;
        }
    });

    showSeries();
}

function checkFilterArchived(serie, selectedArchived) {
    serie.archived = serie.archived ? serie.archived : false;
    return serie.archived === selectedArchived;
}

function checkFilterPlataform(serie, selectedPlatform) {
    return (selectedPlatform == 0 || serie.platform === selectedPlatform);
}

function checkFilterAvailable(serie, selectedAvailable) {
    const lastChapter = parseInt(serie.lastChapter);
    const availableChapter = parseInt(serie.availableChapter);

    return selectedAvailable ? (availableChapter - lastChapter > 0) : true;
}

/**
 * Si el tamaño en caracteres de la label es mayor de size lo recorta
 * 
 * @param {String} label 
 * @param {Ingeger} size 
 * @returns label
 */
function adjustLabelSize(label, size) {
    if (label.length > size) {
        label = label.slice(0, size) + "...";
    }

    return label;
}