document.addEventListener('DOMContentLoaded', () => {
    // --------------------------
    // Funciones de utilidad
    // --------------------------
    const debounce = (func, wait = 300) => {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    };

    const fetchData = async (url, options = {}) => {
        try {
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching data:', error);
            showNotification('Error al cargar los datos', 'error');
            return null;
        }
    };

    const showNotification = (message, type = 'success') => {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 500);
        }, 3000);
    };

    // --------------------------
    // Manejo del menú desplegable
    // --------------------------
    const setupDropdowns = () => {
        const dropdownTriggers = document.querySelectorAll('.nav-item-dropdown > a');

        dropdownTriggers.forEach(trigger => {
            const dropdown = trigger.nextElementSibling;

            trigger.addEventListener('mouseenter', () => {
                dropdown.classList.add('show');
            });

            trigger.parentElement.addEventListener('mouseleave', () => {
                dropdown.classList.remove('show');
            });

            trigger.addEventListener('click', (e) => {
                if (window.innerWidth <= 768) {
                    e.preventDefault();
                    dropdown.classList.toggle('show');
                }
            });
        });
    };

    // --------------------------
    // Galería de imágenes
    // --------------------------
    const initImageGallery = () => {
        const mainImage = document.querySelector('.galeria-principal img');
        const thumbnails = document.querySelectorAll('.galeria-miniaturas img');

        if (!mainImage || !thumbnails.length) return;

        thumbnails.forEach(thumbnail => {
            thumbnail.addEventListener('click', () => {
                mainImage.src = thumbnail.src;

                thumbnails.forEach(t => t.classList.remove('active'));
                thumbnail.classList.add('active');
            });
        });
    };

    // --------------------------
    // Filtros de motos
    // --------------------------
    const setupMotoFilters = () => {
        const transmissionSelect = document.querySelector('#filtro-transmision');
        const categorySelect = document.querySelector('#filtro-categoria');

        if (transmissionSelect) {
            transmissionSelect.addEventListener('change', () => {
                applyFilters();
            });
        }

        if (categorySelect) {
            categorySelect.addEventListener('change', () => {
                applyFilters();
            });
        }

        const applyFilters = () => {
            const transmission = transmissionSelect?.value || '';
            const category = categorySelect?.value || '';

            let url = '/motos?';

            if (category) url += `category=${encodeURIComponent(category)}&`;
            if (transmission) url += `transmission=${encodeURIComponent(transmission)}`;

            window.location.href = url;
        };
    };

    // --------------------------
    // Calculadora de costos de moto
    // --------------------------
    const setupFinanceCalculator = () => {
        const form = document.getElementById('calculadoraForm');
        const resultados = document.getElementById('resultados');
        const loading = document.getElementById('loading');
        const limpiarBtn = document.getElementById('limpiarForm');
        const motoSelect = document.getElementById('moto_select');
        const motoPreview = document.getElementById('motoPreview');

        // Mostrar preview de moto cuando se selecciona
        motoSelect.addEventListener('change', function () {
            if (this.value) {
                const selectedOption = this.options[this.selectedIndex];
                const texto = selectedOption.textContent;
                const partes = texto.split(' - ');

                // Extraer marca y modelo del texto
                const marcaModelo = partes[0].split(' ');
                const marca = marcaModelo[0];
                const modelo = marcaModelo.slice(1).join(' ');
                const cilindraje = selectedOption.dataset.cilindraje;
                const precio = selectedOption.dataset.precio;

                // Mostrar preview
                document.getElementById('motoMarca').textContent = marca;
                document.getElementById('motoModelo').textContent = modelo;
                document.getElementById('motoCilindraje').textContent = cilindraje;
                document.getElementById('motoPrecio').textContent = `$${Number(precio).toLocaleString()}`;

                motoPreview.style.display = 'block';
            } else {
                motoPreview.style.display = 'none';
            }
        });

        // Envío del formulario
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Validaciones
            const motoId = motoSelect.value;
            const kmAnuales = parseInt(document.getElementById('km_anuales').value);
            const anosProyeccion = parseInt(document.getElementById('anos_proyeccion').value);

            if (!motoId || isNaN(kmAnuales) || isNaN(anosProyeccion)) {
                alert('Por favor, completa todos los campos correctamente.');
                return;
            }

            // Mostrar loading
            resultados.style.display = 'none';
            loading.style.display = 'block';

            try {
                // Hacer petición al servidor
                const response = await fetch('/calculadora/calcular', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        moto_id: motoId,
                        km_anuales: kmAnuales,
                        anos_proyeccion: anosProyeccion
                    })
                });

                const data = await response.json();

                if (data.success) {
                    // Mostrar resultados
                    mostrarResultados(data);
                } else {
                    alert('Error: ' + data.message);
                    loading.style.display = 'none';
                }

            } catch (error) {
                console.error('Error:', error);
                alert('Error al procesar la solicitud');
                loading.style.display = 'none';
            }
        });

        // Función para mostrar resultados
        function mostrarResultados(data) {
            loading.style.display = 'none';

            // Asignar valores calculados
            document.getElementById('precioMoto').textContent =
                `$${Number(data.costos.precio_moto).toLocaleString()}`;
            document.getElementById('totalImpuestos').textContent =
                `$${Number(data.costos.impuestos.total).toLocaleString()}`;
            document.getElementById('costoInicial').textContent =
                `$${Number(data.costos.costo_inicial).toLocaleString()}`;
            document.getElementById('costoAnual').textContent =
                `$${Number(data.costos.costo_anual_total).toLocaleString()}`;
            document.getElementById('costoTotal').textContent =
                `$${Number(data.costos.costo_total_proyectado).toLocaleString()}`;
            document.getElementById('costoPorKm').textContent =
                `$${Number(data.costos.costo_por_km).toFixed(2)}`;

            // Mostrar detalles de impuestos
            let htmlImpuestos = '<ul>';
            data.costos.impuestos.detalle.forEach(impuesto => {
                htmlImpuestos += `<li>${impuesto.nombre}: $${Number(impuesto.monto).toLocaleString()}</li>`;
            });
            htmlImpuestos += '</ul>';
            document.getElementById('detalleImpuestos').innerHTML = htmlImpuestos;

            // Mostrar detalles de mantenimiento
            let htmlMantenimiento = '<ul>';
            data.costos.mantenimiento_anual.detalle.forEach(mant => {
                htmlMantenimiento += `<li>${mant.nombre}: $${Number(mant.costo_anual).toLocaleString()} 
                (${mant.frecuencia_anual} vez${mant.frecuencia_anual > 1 ? 'es' : ''} al año)</li>`;
            });
            htmlMantenimiento += '</ul>';
            document.getElementById('detalleMantenimiento').innerHTML = htmlMantenimiento;

            // Mostrar detalles de papeleo
            let htmlPapeleo = '<ul>';
            data.costos.papeleo_anual.detalle.forEach(papel => {
                if (papel.costo_anual > 0) { // Solo mostrar si tiene costo anual
                    htmlPapeleo += `<li>${papel.nombre}: ${Number(papel.costo_anual).toLocaleString()} 
                    ${papel.es_obligatorio ? '(Obligatorio)' : '(Opcional)'}</li>`;
                }
            });
            htmlPapeleo += '</ul>';
            document.getElementById('detallePapeleo').innerHTML = htmlPapeleo;

            // Mostrar resultados
            resultados.style.display = 'block';
        }

        // Funcionalidad del acordeón
        document.querySelectorAll('.acordeon-header').forEach(header => {
            header.addEventListener('click', function () {
                const content = this.nextElementSibling;
                const toggle = this.querySelector('.acordeon-toggle');

                if (content.style.display === 'none' || content.style.display === '') {
                    content.style.display = 'block';
                    toggle.textContent = '-';
                } else {
                    content.style.display = 'none';
                    toggle.textContent = '+';
                }
            });
        });

        // Botón limpiar
        limpiarBtn.addEventListener('click', () => {
            form.reset();
            resultados.style.display = 'none';
            motoPreview.style.display = 'none';
            loading.style.display = 'none';
        });
    };

    // --------------------------
    // Comparador de motos (por implementar)
    // --------------------------
    const setupMotoComparer = () => {
        // Lógica pendiente
    };

    // --------------------------
    // Formulario de contacto
    // --------------------------
    const setupContactForm = () => {
        const contactForm = document.querySelector('.contact-form__container');

        if (!contactForm) return;

        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = new FormData(contactForm);
            const data = Object.fromEntries(formData.entries());

            try {
                const response = await fetch('/enviar-contacto', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });

                if (response.ok) {
                    showNotification('Mensaje enviado correctamente');
                    contactForm.reset();
                } else {
                    throw new Error('Error al enviar el mensaje');
                }
            } catch (error) {
                console.error('Error:', error);
                showNotification('Error al enviar el mensaje', 'error');
            }
        });
    };

    // --------------------------
    // Asesoría personalizada
    // --------------------------
    const setupAdvisoryForm = () => {
        const advisoryForm = document.getElementById('formulario-asesoria');

        if (!advisoryForm) return;

        advisoryForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = new FormData(advisoryForm);
            const data = Object.fromEntries(formData.entries());

            try {
                const response = await fetch('/Asesoria', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });

                if (response.ok) {
                    const result = await response.json();
                    console.log('Respuesta del servidor:', result);
                    showNotification('Asesoría recibida. Mostrando recomendaciones...');
                    displayRecommendedMotos(result.recomendaciones);
                } else {
                    throw new Error('Error al enviar la solicitud');
                }
            } catch (error) {
                console.error('Error:', error);
                showNotification('Error al enviar la solicitud', 'error');
            }
        });
    };

    const displayRecommendedMotos = (motos) => {
        const resultsContainer = document.getElementById('resultado-asesoria');

        if (!resultsContainer || !motos || !motos.length) {
            showNotification('No se encontraron motos recomendadas', 'warning');
            return;
        }

        resultsContainer.innerHTML = motos.map(moto => `
            <div class="moto-recomendada">
                <img src="/img/${moto.main_image}" alt="${moto.brand} ${moto.model}">
                <h3>${moto.brand} ${moto.model}</h3>
                <p class="precio">${parseFloat(moto.price).toLocaleString()}</p>
                <p class="categoria">${moto.category}</p>
                <a href="/motos/${moto.id}" class="btn btn--small">Ver detalles</a>
            </div>
        `).join('');
    };

    // --------------------------
    // Inicialización
    // --------------------------
    setupDropdowns();
    initImageGallery();
    setupMotoFilters();
    setupFinanceCalculator();
    setupMotoComparer();
    setupContactForm();
    setupAdvisoryForm();
});
