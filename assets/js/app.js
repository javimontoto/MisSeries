/*** VARIABLES GLOBALES ***/
let tipoCollection = 'series' // Define la colección: series o películas
let misSeries = {}; // Series que se mostrarán (tras filtro)
let misPeliculas = {}; // Películas que se mostrarán (tras filtro)
let misSeriesOriginal = {}; // Copia con las series de la BBDD
let misPeliculasOriginal = {}; // Copia con las películas de la BBDD
let lastPosition = 0; // Última posición ocupada
let user = {}; // Objeto con el usuario usuario de FB
let allPlatforms = []; // Lista con todas las plataformas (para filtrar)


/*** SELECTORES ***/
const listaSeriesPeliculas = document.getElementById('lista-elementos'),
    templateSerie = document.getElementById('template-serie').content,
    templatePelicula = document.getElementById('template-pelicula').content,
    fragment = document.createDocumentFragment(),
    loginModalButton = document.getElementById('login-modal-button'),
    registerModalButton = document.getElementById('register-modal-button'),
    loginButton = document.getElementById('login-button'),
    registerButton = document.getElementById('register-button'),
    logoutButton = document.getElementById('logout-button'),
    addElementModalButton = document.getElementById('add-element-modal-button'),
    buscador = document.getElementById('buscador'),
    filterBox = document.getElementById('filter-box'),
    resetPassButton = document.getElementById('reset-pass-button'),

    // Añadir-Editar Serie
    addSerieForm = document.getElementById('add-serie-form'),
    serieTitle = document.getElementById('serie-title'),
    serieAvailableChapter = document.getElementById('serie-available-chapter'),
    serieLastChapter = document.getElementById('serie-last-chapter'),
    serieSeason = document.getElementById('serie-season'),
    seriePlatform = document.getElementById('serie-platform'),
    seriePlatformColor = document.getElementById('serie-platform-color'),
    serieArchived = document.getElementById('serie-archived'),
    serieCaratula = document.getElementById('serie-caratula'),
    addSerieButton = document.getElementById('add-serie-button'),

    // Añadir-Editar Película
    addPeliculaForm = document.getElementById('add-pelicula-form'),
    peliculaTitle = document.getElementById('pelicula-title'),
    peliculaAnho = document.getElementById('pelicula-anho'),
    peliculaGenero = document.getElementById('pelicula-genero'),
    peliculaSinopsis = document.getElementById('pelicula-sinopsis'),
    peliculaPlatform = document.getElementById('pelicula-platform'),
    peliculaPlatformColor = document.getElementById('pelicula-platform-color'),
    peliculaArchived = document.getElementById('pelicula-archived'),
    peliculaViewed = document.getElementById('pelicula-viewed'),
    peliculaCaratula = document.getElementById('pelicula-caratula'),
    addPeliculaButton = document.getElementById('add-pelicula-button'),

    // Filtro
    filterArchived = document.getElementById('filter-archived'),
    filterAvailable = document.getElementById('filter-available'),
    filterPlatform = document.getElementById('filter-platform'),
    filterLimpiarBoton = document.getElementById('limpiar-buscador'),
    // filterCollection = document.getElementById('filter-tipo-collection'),
    filterCollectionSeries = document.getElementById('button-sel-series'),
    filterCollectionPeliculas = document.getElementById('button-sel-peliculas');



/*** LISTENERS ***/
document.addEventListener('DOMContentLoaded', () => {
    // Incializamos Firebase
    initFirebase();

    getAllSeriesPeliculas();
});

loginButton.addEventListener('click', singInFB, false);
registerButton.addEventListener('click', signUpFB, false);
logoutButton.addEventListener('click', signOutFB, false);
resetPassButton.addEventListener('click', sendPasswordReset, false);
addElementModalButton.addEventListener('click', showModalElement, false);
addSerieButton.addEventListener('click', addSerie, false);
addPeliculaButton.addEventListener('click', addPelicula, false);
seriePlatformColor.addEventListener('change', updateElementPlatformColor, false);
peliculaPlatformColor.addEventListener('change', updateElementPlatformColor, false);
filterArchived.addEventListener('change', () => runFilter(false), false);
filterAvailable.addEventListener('change', () => runFilter(false), false);
buscador.addEventListener('keyup', () => runFilter(false), false);
buscador.addEventListener('search', () => runFilter(true), false);
filterLimpiarBoton.addEventListener('click', clearFilter, false);
// filterCollection.addEventListener('change', changeCollection, false);
filterCollectionSeries.addEventListener('click', changeCollection, false);
filterCollectionPeliculas.addEventListener('click', changeCollection, false);



/*** FUNCIONES PRINCIPALES ***/
/**
 * Carga la lista de series y películas de FB
 */
function getAllSeriesPeliculas() {
    if (localStorage.getItem('user')) {
        // Tenemos usuario logueado => recuperamos series de FB
        user = JSON.parse(localStorage.getItem('user'));
        showCloseButton(true);
        showLoader(true);
        getFBSeriesPeliculas(() => runFilter(false));

    } else {
        // No tenemos usuario logueado
        showCloseButton(false);
    }
}


/**** 1 - SERIES ****/
/**
 * Muestra modal para crear o actualizar serie
 * @param {Event} e 
 */
function showModalSerie(e) {
    e.preventDefault;

    const edit = !(e.target.id === 'add-element-modal-button'),
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

        updateElementPlatformColor();

        // Añadimos botón para borrar la serie si no existe
        let removeSerieButton = document.getElementById('remove-serie-button');
        if (typeof(removeSerieButton) === 'undefined' || removeSerieButton === null) {
            // Lo creamos
            removeSerieButton = document.createElement('button');
            removeSerieButton.id = 'remove-serie-button';
            removeSerieButton.classList.add('btn', 'btn-danger');
            removeSerieButton.textContent = 'Eliminar serie';
            const modalFooter = modal.querySelector('.modal-footer');
            modalFooter.insertBefore(removeSerieButton, modalFooter.lastElementChild);
        }
        removeSerieButton.dataset.id = serie.id;
        removeSerieButton.addEventListener('click', deleteSerie, false);

    } else {
        // Creando nueva serie
        modal.querySelector('.modal-title').textContent = 'Nueva serie';
        addSerieForm.reset();
        delete addSerieButton.dataset.id;

        updateElementPlatformColor();

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
    let update = false;

    // Comprobamos si estamos logueados
    if (!localStorage.getItem('user')) {
        showCloseButton(false);
        return;
    }

    // Comprobamos si tiene carátula su tamaño
    if (serieCaratula.files[0] !== undefined && serieCaratula.files[0].size > 1024 * 1024) {
        serieCaratula.classList.add('is-invalid');
        addSerieForm.classList.add('was-validated');
        return;
    } else {
        serieCaratula.classList.remove('is-invalid');
    }

    // Validamos el formulario
    if (addSerieForm.checkValidity() === false) {
        addSerieForm.classList.add('was-validated');
        return;
    }

    if (e.target.dataset.id === undefined || e.target.dataset.id === 0) {
        // Creamos nueva serie
        update = false;
        serie.id = Date.now();
        serie.title = serieTitle.value;
        serie.lastChapter = serieLastChapter.value;
        serie.availableChapter = serieAvailableChapter.value;
        serie.season = serieSeason.value;
        serie.platform = seriePlatform.value;
        serie.platformColor = seriePlatformColor.value;
        serie.archived = serieArchived.checked;
        serie.position = lastPosition + 1;
        serie.file = serieCaratula.files[0];

    } else {
        // Actualizamos serie
        update = true;
        serie = misSeries[e.target.dataset.id];
        serie.title = serieTitle.value;
        serie.lastChapter = serieLastChapter.value;
        serie.availableChapter = serieAvailableChapter.value;
        serie.season = serieSeason.value;
        serie.platform = seriePlatform.value;
        serie.platformColor = seriePlatformColor.value;
        serie.archived = serieArchived.checked;
        serie.file = serieCaratula.files[0];
    }

    if (serie.file !== undefined) {
        // Guardamos la serie y la carátula => con promesa
        saveSerie(serie, update)
            .then(() => {
                misSeriesOriginal[serie.id] = serie;
                fillAllPlatforms();
                runFilter(false);

            }).catch(() => {
                myAlert('Atención', `Se ha producido un error al ${update ? 'actualizar' : 'crear'} la serie.`);
            });
    } else {
        if (saveSerie(serie, update)) {
            misSeriesOriginal[serie.id] = serie;
            fillAllPlatforms();
            runFilter(false);
        }
    }

    // Cerramos la modal y la limpiamos
    addSerieForm.reset();
    $('#add-serie-modal').modal('hide');

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
        delete misSeriesOriginal[e.target.dataset.id];
        showSeries();
    }
}

/**
 * Pintar las series que esten guardadas
 */
function showSeries() {

    // Limpiamos la lista de series
    listaSeriesPeliculas.innerHTML = '';

    // Ocultamos el loader
    showLoader(false);

    // Comprobamos si la lista de objetos está vacía
    if (Object.values(misSeries).length === 0) {
        const divNoSeries = document.createElement('div');
        divNoSeries.classList.add('alert', 'alert-secondary', 'text-center');
        const divNoSeriesText = document.createElement('p');
        divNoSeriesText.innerHTML = Object.entries(misSeriesOriginal).length > 0 ? `No hay ${tipoCollection.toLowerCase()} que coincidan con el filtro.` : `No hay ${tipoCollection.toLowerCase()} guardadas 😢.`;
        const buttonClone = addElementModalButton.cloneNode(true);
        buttonClone.addEventListener('click', showModalSerie, false);
        divNoSeries.appendChild(divNoSeriesText);
        divNoSeries.appendChild(buttonClone);
        listaSeriesPeliculas.appendChild(divNoSeries);
        return;
    }

    // Ordenamos las series por orden alfabético
    sortSeriesByTitle();

    Object.values(misSeries).forEach(serie => {
        const clone = templateSerie.cloneNode(true);

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

        if (serie.caratula !== undefined) {
            const caratula = clone.querySelector('.serie-caratula');
            caratula.src = serie.caratula.url;
            caratula.classList.remove('default-image');
            caratula.addEventListener("click", () => showCoverModal(serie), false);
        }

        // Botón de archivar serie
        const archiveSerieButton = clone.querySelector('.archive-serie');
        if (serie.archived) {
            archiveSerieButton.classList.remove('fa-archive');
            archiveSerieButton.classList.add('fa-box-open');
        }
        archiveSerieButton.dataset.id = serie.id;
        archiveSerieButton.addEventListener('click', event => { archiveSerie(event); }, false);

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

    listaSeriesPeliculas.appendChild(fragment);


    // Hacemos la lista de series ordenable utilizando la función de Bootstrap
    // Sortable.create(listaSeriesPeliculas, {
    //     onEnd: e => {
    //         listaSeriesPeliculas.querySelectorAll('li').forEach((el, index) => {
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
    const serie = cloneElement(misSeries[idSerie], 'serie');
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
            misSeriesOriginal[serie.id] = serie;
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

            runFilter(false);
        } else {
            myAlert('Atención', 'Se ha producido un error al actualizar la serie.');
            t
        }

    }
}

/**
 * Archiva o desarchiva (según si ya lo estuviera o no) una serie con botón directo
 * @param {Event} e 
 */
function archiveSerie(e) {
    const idSerie = e.target.dataset.id;
    const serie = cloneElement(misSeries[idSerie], 'serie');

    serie.archived = !serie.archived;
    if (updateSerie(serie)) {
        // Actualización correcta => refrescamos valores
        misSeries[serie.id] = serie;
        misSeriesOriginal[serie.id] = serie;
    } else {
        myAlert('Atención', 'Se ha producido un error al actualizar la serie.');
    }

    runFilter(false);
}



/**** 2 - PELÍCULAS ****/
/**
 * Pintar las series que esten guardadas
 */
function showPeliculas() {

    // Limpiamos la lista de series
    listaSeriesPeliculas.innerHTML = '';

    // Ocultamos el loader
    showLoader(false);

    // Comprobamos si la lista de objetos está vacía
    if (Object.values(misPeliculas).length === 0) {
        const divNoSeries = document.createElement('div');
        divNoSeries.classList.add('alert', 'alert-secondary', 'text-center');
        const divNoSeriesText = document.createElement('p');
        divNoSeriesText.innerHTML = Object.entries(misPeliculasOriginal).length > 0 ? `No hay ${tipoCollection.toLowerCase()} que coincidan con el filtro.` : `No hay ${tipoCollection.toLowerCase()} guardadas 😢.`;
        const buttonClone = addElementModalButton.cloneNode(true);
        buttonClone.addEventListener('click', showModalPelicula, false);
        divNoSeries.appendChild(divNoSeriesText);
        divNoSeries.appendChild(buttonClone);
        listaSeriesPeliculas.appendChild(divNoSeries);
        return;
    }

    // Ordenamos las series por orden alfabético
    sortPeliculasByTitle();

    Object.values(misPeliculas).forEach(pelicula => {
        const clone = templatePelicula.cloneNode(true);

        // Comprobamos si la posición es mayor que la última guardada
        checkLastPosition(pelicula.position);

        // Si el capítulo disponible es igual al visto marcamos la serie como vista
        if (pelicula.viewed)
            clone.querySelector('li').classList.add('serie-viewed');

        // Recuperamos los valores
        clone.querySelector('.pelicula-title').textContent = `${pelicula.title} [${pelicula.anho}]`;
        clone.querySelector('.pelicula-genero').textContent = pelicula.genero;
        clone.querySelector('.pelicula-platform').innerHTML = pelicula.platform;
        clone.querySelector('.pelicula-platform').style.color = pelicula.platformColor;
        clone.querySelector('.pelicula-sinopsis').textContent = recortaSinopsis(pelicula.sinopsis);

        if (pelicula.caratula !== undefined) {
            const caratula = clone.querySelector('.pelicula-caratula');
            caratula.src = pelicula.caratula.url;
            caratula.classList.remove('default-image');
            caratula.addEventListener("click", () => showCoverModal(pelicula), false);
        }

        // Botón de archivar pelicula
        const archivePeliculaButton = clone.querySelector('.archive-pelicula');
        if (pelicula.archived) {
            archivePeliculaButton.classList.remove('fa-archive');
            archivePeliculaButton.classList.add('fa-box-open');
        }
        archivePeliculaButton.dataset.id = pelicula.id;
        archivePeliculaButton.addEventListener('click', event => { archivePelicula(event); }, false);

        // Actualizamos el botón de editar la pelicula
        const editPeliculaButton = clone.querySelector('.edit-pelicula');
        editPeliculaButton.dataset.id = pelicula.id;
        editPeliculaButton.addEventListener("click", showModalPelicula, false);

        fragment.appendChild(clone);
    });

    listaSeriesPeliculas.appendChild(fragment);
}

/**
 * Muestra modal para crear o actualizar pelicula
 * @param {Event} e 
 */
function showModalPelicula(e) {
    e.preventDefault;

    const edit = !(e.target.id === 'add-element-modal-button'),
        modal = document.getElementById('add-pelicula-modal');

    if (edit) {
        // Editando pelicula
        modal.querySelector('.modal-title').textContent = 'Editar pelicula';
        const pelicula = misPeliculas[e.target.dataset.id];
        peliculaTitle.value = pelicula.title;
        peliculaAnho.value = pelicula.anho;
        peliculaGenero.value = pelicula.genero ? pelicula.genero : '';
        peliculaSinopsis.value = pelicula.sinopsis;
        peliculaPlatform.value = pelicula.platform;
        peliculaPlatformColor.value = pelicula.platformColor;
        peliculaArchived.checked = pelicula.archived;
        peliculaViewed.checked = pelicula.viewed;
        addPeliculaButton.dataset.id = pelicula.id;

        updateElementPlatformColor();

        // Añadimos botón para borrar la pelicula si no existe
        let removePeliculaButton = document.getElementById('remove-pelicula-button');
        if (typeof(removePeliculaButton) === 'undefined' || removePeliculaButton === null) {
            // Lo creamos
            removePeliculaButton = document.createElement('button');
            removePeliculaButton.id = 'remove-pelicula-button';
            removePeliculaButton.classList.add('btn', 'btn-danger');
            removePeliculaButton.textContent = 'Eliminar pelicula';
            const modalFooter = modal.querySelector('.modal-footer');
            modalFooter.insertBefore(removePeliculaButton, modalFooter.lastElementChild);
        }
        removePeliculaButton.dataset.id = pelicula.id;
        removePeliculaButton.addEventListener('click', deletePelicula, false);

    } else {
        // Creando nueva pelicula
        modal.querySelector('.modal-title').textContent = 'Nueva pelicula';
        addPeliculaForm.reset();
        delete addPeliculaButton.dataset.id;

        updateElementPlatformColor();

        // Si está presente el botón borrar pelicula lo quitamos
        const removePeliculaButton = document.getElementById('remove-pelicula-button');
        if (typeof(removePeliculaButton) != 'undefined' && removePeliculaButton != null)
            removePeliculaButton.remove();
    }

    // Mostramos las modal con jQuery
    $('#add-pelicula-modal').modal('show');

}

/**
 * Guardar la pelicula
 * @param {Event} e 
 */
function addPelicula(e) {
    e.preventDefault();
    let pelicula = {};
    let update = false;

    // Comprobamos si estamos logueados
    if (!localStorage.getItem('user')) {
        showCloseButton(false);
        return;
    }

    // Comprobamos si tiene carátula su tamaño
    if (peliculaCaratula.files[0] !== undefined && peliculaCaratula.files[0].size > 1024 * 1024) {
        peliculaCaratula.classList.add('is-invalid');
        addPeliculaForm.classList.add('was-validated');
        return;
    } else {
        peliculaCaratula.classList.remove('is-invalid');
    }

    // Validamos el formulario
    if (addPeliculaForm.checkValidity() === false) {
        addPeliculaForm.classList.add('was-validated');
        return;
    }

    if (e.target.dataset.id === undefined || e.target.dataset.id === 0) {
        // Creamos nueva pelicula
        update = false;
        pelicula.id = Date.now();
        pelicula.title = peliculaTitle.value;
        pelicula.anho = peliculaAnho.value;
        pelicula.genero = peliculaGenero.value;
        pelicula.sinopsis = peliculaSinopsis.value;
        pelicula.platform = peliculaPlatform.value;
        pelicula.platformColor = peliculaPlatformColor.value;
        pelicula.archived = peliculaArchived.checked;
        pelicula.viewed = peliculaViewed.checked;
        pelicula.position = lastPosition + 1;
        pelicula.file = peliculaCaratula.files[0];

    } else {
        // Actualizamos pelicula
        update = true;
        pelicula = misPeliculas[e.target.dataset.id];
        pelicula.title = peliculaTitle.value;
        pelicula.anho = peliculaAnho.value;
        pelicula.genero = peliculaGenero.value;
        pelicula.sinopsis = peliculaSinopsis.value;
        pelicula.platform = peliculaPlatform.value;
        pelicula.platformColor = peliculaPlatformColor.value;
        pelicula.archived = peliculaArchived.checked;
        pelicula.viewed = peliculaViewed.checked;
        pelicula.file = peliculaCaratula.files[0];
    }

    if (pelicula.file !== undefined) {
        // Guardamos la pelicula y la carátula => con promesa
        savePelicula(pelicula, update)
            .then(() => {
                misPeliculasOriginal[pelicula.id] = pelicula;
                fillAllPlatforms();
                runFilter(false);

            }).catch(() => {
                myAlert('Atención', `Se ha producido un error al ${update ? 'actualizar' : 'crear'} la pelicula.`);
            });
    } else {
        if (savePelicula(pelicula, update)) {
            misPeliculasOriginal[pelicula.id] = pelicula;
            fillAllPlatforms();
            runFilter(false);
        }
    }

    // Cerramos la modal y la limpiamos
    addPeliculaForm.reset();
    $('#add-pelicula-modal').modal('hide');

}

/**
 * Elimina una pelicula
 * @param {Event} e 
 */
function deletePelicula(e) {
    const pelicula = misPeliculas[e.target.dataset.id];
    if (removePelicula(pelicula)) {
        // Cerramos la modal y la limpiamos
        addPeliculaForm.reset();
        $('#add-pelicula-modal').modal('hide');
        delete misPeliculas[e.target.dataset.id];
        delete misPeliculasOriginal[e.target.dataset.id];
        showPeliculas();
    }
}

/**
 * Archiva o desarchiva (según si ya lo estuviera o no) una pelicula con botón directo
 * @param {Event} e 
 */
function archivePelicula(e) {
    const idPelicula = e.target.dataset.id;
    const pelicula = cloneElement(misPeliculas[idPelicula], 'pelicula');

    pelicula.archived = !pelicula.archived;
    if (updatePelicula(pelicula)) {
        // Actualización correcta => refrescamos valores
        misPeliculas[pelicula.id] = pelicula;
        misPeliculasOriginal[pelicula.id] = pelicula;
    } else {
        myAlert('Atención', 'Se ha producido un error al actualizar la pelicula.');
    }

    runFilter(false);
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
        addElementModalButton.classList.replace('hidden', 'active');
        logoutButton.classList.replace('hidden', 'active');
        filterBox.classList.replace('hidden', 'active');

    } else {
        // Ocultamos el botón de salir y mostramos los de entrar y registrarse
        // y limpiamos la lista
        misSeries = {};
        misSeriesOriginal = {};
        allPlatforms = [];
        logoutButton.classList.replace('active', 'hidden');
        addElementModalButton.classList.replace('active', 'hidden');
        listaSeriesPeliculas.classList.replace('active', 'hidden');
        listaSeriesPeliculas.innerHTML = '';
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
        listaSeriesPeliculas.appendChild(loader);
    } else if (document.getElementById('loader')) {
        document.getElementById('loader').remove();
    }
}

/**
 * Ordena las series por orden albético
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
 * Ordena las peliculas por orden albético
 */
function sortPeliculasByTitle() {
    let seriesArray = Object.values(misPeliculas);
    if (seriesArray.length > 1) {
        seriesArray.sort((a, b) => {
            return a.title.toLowerCase().localeCompare(b.title.toLowerCase());
        });
        misPeliculas = {};
        seriesArray.forEach(tarea => misPeliculas[tarea.id] = tarea);

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
 * Clona un objeto serie/pelicula
 * 
 * @param {Object} element Objeto serie/pelicula
 * @returns 
 */
function cloneElement(element, tipo) {
    const newElement = {};
    newElement.id = element.id;
    newElement.title = element.title;
    newElement.platform = element.platform;
    newElement.platformColor = element.platformColor;
    newElement.position = element.position;
    newElement.modified = element.modified;
    newElement.archived = element.archived;
    newElement.caratula = element.caratula;

    if (tipo === 'serie') {
        newElement.lastChapter = element.lastChapter;
        newElement.availableChapter = element.availableChapter;
        newElement.season = element.season;
    } else {
        newElement.anho = element.anho;
        newElement.sinopsis = element.sinopsis;
        newElement.viewed = element.viewed;
        newElement.genero = element.genero;
    }

    return newElement;
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

function updateElementPlatformColor() {
    if (tipoCollection === 'series') {
        seriePlatformColor.style.color = seriePlatformColor.value;
    } else {
        peliculaPlatformColor.style.color = peliculaPlatformColor.value;
    }
}

/**
 * Recupera las plataformas registradas
 */
function fillAllPlatforms() {

    let seriesPeliculasOriginal = tipoCollection === 'series' ? misSeriesOriginal : misPeliculasOriginal;

    const allPlatformsFull = Object.values(seriesPeliculasOriginal).map(o => {
        if (o.platform !== undefined && o.platform !== '') {
            return { 'plataforma': o.platform, 'color': o.platformColor };
        }
    });

    // Quitamos los duplicados y ordenamos
    allPlatforms = allPlatformsFull.filter((value, index, self) =>
        index === self.findIndex((p) => (
            p.plataforma === value.plataforma
        ))
    );

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
        opt.style.fontWeight = 'bold';
        filterPlatform.appendChild(opt);
    });

    filterPlatform.addEventListener('change', () => runFilter(false), false);
}

/**
 * Realiza las operaciones desencadenadas al cambiar la coleción (series/películas)
 */
function changeCollection(e) {
    tipoCollection = e.target.id === "button-sel-series" ? 'series' : 'películas';
    // tipoCollection = filterCollection.options[filterCollection.selectedIndex].value;

    if (tipoCollection === 'series'){
        // Actualizamos el botón de la colección seleccionada
        filterCollectionSeries.classList.remove('btn-filter-no-selected');
        filterCollectionPeliculas.classList.add('btn-filter-no-selected');

        // Cambiamos el título de la página
        document.querySelector('.navbar-brand > h1').textContent = 'Mis SERIES'
    
        // Cambiamos el texto del filtro
        filterAvailable.nextElementSibling.textContent = 'Caps disponibles';
    } else {
        // Actualizamos el botón de la colección seleccionada
        filterCollectionSeries.classList.add('btn-filter-no-selected');
        filterCollectionPeliculas.classList.remove('btn-filter-no-selected');

        // Cambiamos el título de la página
        document.querySelector('.navbar-brand > h1').textContent = 'Mis PELÍCULAS';
    
        // Cambiamos el texto del filtro
        filterAvailable.nextElementSibling.textContent = 'Sin ver';
    }

    // Actualizamos la etiqueta de añadir serie/película
    updateLabelAddElementModalButton();


    // Recuperamos las plataformas según la colección
    fillAllPlatforms();

    runFilter(false);
}

/**
 * Actualiza el nombre el botón según la colección (series/películas) seleccionada
 */
function updateLabelAddElementModalButton() {
    addElementModalButton.textContent = `Añadir ${tipoCollection.toLowerCase().slice(0, -1)}`;
}

/**
 * Filtra las series según si están archivadas, plataforma, con caps disponibles y buscador
 * 
 * @param borraBuscador true => viene de picar en borrar el input del buscador
 */
function runFilter(borraBuscador = false) {
    const selectedPlatform = filterPlatform.options[filterPlatform.selectedIndex].value;
    const selectedArchived = filterArchived.checked;
    const selectedAvailable = filterAvailable.checked;
    const textoBuscado = borraBuscador ? "" : buscador.value.toLowerCase();

    let seriesPeliculasOriginal = tipoCollection === 'series' ? misSeriesOriginal : misPeliculasOriginal;
    misSeries = {};
    misPeliculas = {};
    Object.values(seriesPeliculasOriginal).forEach(item => {
        if (checkFilterArchived(item, selectedArchived) &&
            checkFilterPlataform(item, selectedPlatform) &&
            checkFilterAvailable(item, selectedAvailable) &&
            checkFilterTextoBuscado(item, textoBuscado)) {
            tipoCollection === 'series' ? misSeries[item.id] = item : misPeliculas[item.id] = item;
        }
    });

    tipoCollection === 'series' ? showSeries() : showPeliculas();
}

function checkFilterArchived(serie, selectedArchived) {
    serie.archived = serie.archived ? serie.archived : false;
    return serie.archived === selectedArchived;
}

function checkFilterPlataform(serie, selectedPlatform) {
    return (selectedPlatform == 0 || serie.platform === selectedPlatform);
}

function checkFilterAvailable(elemento, selectedAvailable) {
    let result = false;

    if (tipoCollection === 'series') {
        const lastChapter = parseInt(elemento.lastChapter);
        const availableChapter = parseInt(elemento.availableChapter);
        result = availableChapter - lastChapter > 0;
    } else {
        elemento.viewed = elemento.viewed ? elemento.viewed : false;
        result = !elemento.viewed;
    }

    return selectedAvailable ? result : true;
}

function checkFilterTextoBuscado(serie, textoBuscado) {
    return serie.title.toLowerCase().includes(textoBuscado);
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

function clearFilter() {
    buscador.value = "";
    filterPlatform.value = '0';
    filterAvailable.checked = false;
    filterArchived.checked = false;

    runFilter(false);
}

function showCoverModal(elemento) {
    modal = document.getElementById('cover-modal');

    modal.querySelector('.modal-title').textContent = `${elemento.title} [${tipoCollection === 'series' ? `Temporada ${elemento.season}` : elemento.anho}]`;
    modal.querySelector('#cover-image').src = elemento.caratula.url;

    // Si es película mostramos la sinopsis completa
    if (tipoCollection === 'películas') {
        modal.querySelector('.cover-sinopsis').textContent = elemento.sinopsis;
    }

    // Mostramos las modal con jQuery
    $('#cover-modal').modal('show');
}

/**
 * Método llamado al picar en Añadir Serie/Película => según lo que esté seleccionado mostrará una modal u otra
 */
function showModalElement(e) {
    if (tipoCollection === 'series') {
        showModalSerie(e);
    } else {
        showModalPelicula(e);
    }
}

/**
 * Recorta la sinopsis a un máx de 150 caracteres
 * 
 * @param {String} sinopsis 
 * @returns 
 */
function recortaSinopsis(sinopsis) {
    const limite = 150;
    if (sinopsis.length > limite) {
        return sinopsis.slice(0,limite) + '...';
    } else {
        return sinopsis;
    }
}