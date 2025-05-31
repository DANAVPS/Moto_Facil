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

        // *** AÑADE ESTA VERIFICACIÓN CRÍTICA (igual que en setupMotoComparer) ***
        if (!form || !motoSelect) {
            console.log('setupFinanceCalculator: No se encontraron elementos principales de la calculadora. Saltando inicialización.');
            return; // Salir si los elementos principales no existen
        }
        console.log('setupFinanceCalculator: Inicializando calculadora financiera.');

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

                // Verificar elementos antes de usarlos
                const motoMarca = document.getElementById('motoMarca');
                const motoModelo = document.getElementById('motoModelo');
                const motoCilindraje = document.getElementById('motoCilindraje');
                const motoPrecio = document.getElementById('motoPrecio');

                if (motoMarca) motoMarca.textContent = marca;
                if (motoModelo) motoModelo.textContent = modelo;
                if (motoCilindraje) motoCilindraje.textContent = cilindraje;
                if (motoPrecio) motoPrecio.textContent = `$${Number(precio).toLocaleString()}`;

                if (motoPreview) motoPreview.style.display = 'block';
            } else {
                if (motoPreview) motoPreview.style.display = 'none';
            }
        });

        // Envío del formulario
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Validaciones
            const motoId = motoSelect.value;
            const kmAnualesInput = document.getElementById('km_anuales');
            const anosProyeccionInput = document.getElementById('anos_proyeccion');

            if (!kmAnualesInput || !anosProyeccionInput) {
                console.error('setupFinanceCalculator: No se encontraron campos de entrada');
                return;
            }

            const kmAnuales = parseInt(kmAnualesInput.value);
            const anosProyeccion = parseInt(anosProyeccionInput.value);

            if (!motoId || isNaN(kmAnuales) || isNaN(anosProyeccion)) {
                alert('Por favor, completa todos los campos correctamente.');
                return;
            }

            // Mostrar loading
            if (resultados) resultados.style.display = 'none';
            if (loading) loading.style.display = 'block';

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
                    if (loading) loading.style.display = 'none';
                }

            } catch (error) {
                console.error('Error:', error);
                alert('Error al procesar la solicitud');
                if (loading) loading.style.display = 'none';
            }
        });

        // Función para mostrar resultados
        function mostrarResultados(data) {
            if (loading) loading.style.display = 'none';

            // Asignar valores calculados con verificaciones
            const precioMoto = document.getElementById('precioMoto');
            const totalImpuestos = document.getElementById('totalImpuestos');
            const costoInicial = document.getElementById('costoInicial');
            const costoAnual = document.getElementById('costoAnual');
            const costoTotal = document.getElementById('costoTotal');
            const costoPorKm = document.getElementById('costoPorKm');

            if (precioMoto) precioMoto.textContent = `$${Number(data.costos.precio_moto).toLocaleString()}`;
            if (totalImpuestos) totalImpuestos.textContent = `$${Number(data.costos.impuestos.total).toLocaleString()}`;
            if (costoInicial) costoInicial.textContent = `$${Number(data.costos.costo_inicial).toLocaleString()}`;
            if (costoAnual) costoAnual.textContent = `$${Number(data.costos.costo_anual_total).toLocaleString()}`;
            if (costoTotal) costoTotal.textContent = `$${Number(data.costos.costo_total_proyectado).toLocaleString()}`;
            if (costoPorKm) costoPorKm.textContent = `$${Number(data.costos.costo_por_km).toFixed(2)}`;

            // Mostrar detalles de impuestos
            const detalleImpuestos = document.getElementById('detalleImpuestos');
            if (detalleImpuestos) {
                let htmlImpuestos = '<ul>';
                data.costos.impuestos.detalle.forEach(impuesto => {
                    htmlImpuestos += `<li>${impuesto.nombre}: $${Number(impuesto.monto).toLocaleString()}</li>`;
                });
                htmlImpuestos += '</ul>';
                detalleImpuestos.innerHTML = htmlImpuestos;
            }

            // Mostrar detalles de mantenimiento
            const detalleMantenimiento = document.getElementById('detalleMantenimiento');
            if (detalleMantenimiento) {
                let htmlMantenimiento = '<ul>';
                data.costos.mantenimiento_anual.detalle.forEach(mant => {
                    htmlMantenimiento += `<li>${mant.nombre}: $${Number(mant.costo_anual).toLocaleString()} 
                (${mant.frecuencia_anual} vez${mant.frecuencia_anual > 1 ? 'es' : ''} al año)</li>`;
                });
                htmlMantenimiento += '</ul>';
                detalleMantenimiento.innerHTML = htmlMantenimiento;
            }

            // Mostrar detalles de papeleo
            const detallePapeleo = document.getElementById('detallePapeleo');
            if (detallePapeleo) {
                let htmlPapeleo = '<ul>';
                data.costos.papeleo_anual.detalle.forEach(papel => {
                    if (papel.costo_anual > 0) { // Solo mostrar si tiene costo anual
                        htmlPapeleo += `<li>${papel.nombre}: ${Number(papel.costo_anual).toLocaleString()} 
                    ${papel.es_obligatorio ? '(Obligatorio)' : '(Opcional)'}</li>`;
                    }
                });
                htmlPapeleo += '</ul>';
                detallePapeleo.innerHTML = htmlPapeleo;
            }

            // Mostrar resultados
            if (resultados) resultados.style.display = 'block';
        }

        // Funcionalidad del acordeón
        document.querySelectorAll('.acordeon-header').forEach(header => {
            header.addEventListener('click', function () {
                const content = this.nextElementSibling;
                const toggle = this.querySelector('.acordeon-toggle');

                if (content && toggle) {
                    if (content.style.display === 'none' || content.style.display === '') {
                        content.style.display = 'block';
                        toggle.textContent = '-';
                    } else {
                        content.style.display = 'none';
                        toggle.textContent = '+';
                    }
                }
            });
        });

        // Botón limpiar (con verificación)
        if (limpiarBtn) {
            limpiarBtn.addEventListener('click', () => {
                form.reset();
                if (resultados) resultados.style.display = 'none';
                if (motoPreview) motoPreview.style.display = 'none';
                if (loading) loading.style.display = 'none';
            });
        }
    };

    // --------------------------
    // Comparador de motos
    // --------------------------
    const setupMotoComparer = () => {
        // Elementos del DOM
        const selectors = document.querySelectorAll('.moto-selector');
        const compareBtn = document.getElementById('compareBtn');
        const clearBtn = document.getElementById('clearBtn');
        const loadingSpinner = document.getElementById('loadingSpinner');
        const comparisonTable = document.getElementById('comparisonTable');
        const costSummary = document.getElementById('costSummary');
        const tableHeader = document.getElementById('tableHeader');
        const tableBody = document.getElementById('tableBody');
        const costCards = document.getElementById('costCards');

        // Verificar elementos esenciales
        if (!selectors.length || !compareBtn) {
            console.log('setupMotoComparer: No se encontraron elementos del comparador de motos. Saltando inicialización.');
            return;
        }
        console.log('setupMotoComparer: Inicializando comparador de motos.');

        // Configuración de características para mostrar
        const features = [
            {
                label: "Imagen",
                key: "main_image",
                render: v => {
                    if (v) {
                        // Verificar si ya tiene prefijo para evitar duplicación
                        let imageUrl;
                        if (v.startsWith('http') || v.startsWith('img/') || v.startsWith('/img/')) {
                            imageUrl = v;
                        } else {
                            imageUrl = `/img/${v}`;
                        }

                        return `
                        <div style="position:relative; min-height:100px;">
                            <img src="${imageUrl}" 
                                class="comparison-image" 
                                style="max-width:150px; max-height:100px; object-fit:cover;"
                                onerror="console.log('Error cargando imagen en tabla:', '${imageUrl}'); this.style.display='none'; this.nextElementSibling.style.display='flex';"
                                onload="console.log('Imagen cargada exitosamente en tabla:', '${imageUrl}');">
                            <div style="display:none; position:absolute; top:0; left:0; right:0; bottom:0; background:#f8f9fa; align-items:center; justify-content:center; border-radius:4px;">
                                <div class="text-center text-muted">
                                    <i class="fas fa-motorcycle"></i><br>
                                    <small>Sin imagen</small>
                                </div>
                            </div>
                        </div>
                    `;
                    } else {
                        return `
                        <div style="background:#f8f9fa; padding:10px; text-align:center; border-radius:4px;">
                            <i class="fas fa-motorcycle"></i><br>
                            <small>Sin imagen</small>
                        </div>
                    `;
                    }
                }
            },
            {
                label: "Marca",
                key: "brand",
                render: v => v || 'N/A'
            },
            {
                label: "Modelo",
                key: "model",
                render: v => v || 'N/A'
            },
            {
                label: "Precio",
                key: "price",
                render: v => v ? `$${parseFloat(v).toLocaleString()}` : 'N/A'
            },
            {
                label: "Categoría",
                key: "category",
                render: v => v || 'N/A'
            },
            {
                label: "Cilindraje",
                key: "engine_cc",
                render: v => v ? `${v} cc` : 'N/A'
            },
            {
                label: "Nivel de Experiencia",
                key: "nivel_experiencia",
                render: v => v || 'N/A'
            },
            {
                label: "Freno Trasero",
                key: "freno_trasero",
                render: v => v || 'N/A'
            },
            {
                label: "Capacidad del Tanque",
                key: "capacidad_del_tanque",
                render: v => v || 'N/A'
            },
            {
                label: "Potencia",
                key: "potencia",
                render: v => v || 'N/A'
            },
            {
                label: "Freno Delantero",
                key: "freno_delantero",
                render: v => v || 'N/A'
            },
            {
                label: "Peso",
                key: "peso",
                render: v => v || 'N/A'
            },
            {
                label: "Caja de Velocidades",
                key: "caja_de_velocidades",
                render: v => v || 'N/A'
            },
            {
                label: "Garantía",
                key: "garantia",
                render: v => v || 'N/A'
            }
        ];

        // Cálculo de costos totales
        const calculateTotalCost = (price) => {
            const basePrice = parseFloat(price) || 0;
            const iva = basePrice * 0.19;        // IVA 19%
            const aranceles = basePrice * 0.05;  // Aranceles 5%
            const runt = 15000;                  // RUNT fijo
            const soat = 400000;                 // SOAT fijo

            return {
                basePrice,
                iva,
                aranceles,
                runt,
                soat,
                total: basePrice + iva + aranceles + runt + soat
            };
        };

        // Funciones principales
        function getSelectedMotos() {
            const selectedMotos = Array.from(selectors)
                .map(s => s.value)
                .filter(val => val !== "")
                .map(id => {
                    // Buscar en todos los selectores la opción correspondiente
                    for (let selector of selectors) {
                        const option = selector.querySelector(`option[value="${id}"]`);
                        if (option) {
                            const texto = option.textContent.trim();
                            const partes = texto.split(' - $');

                            if (partes.length >= 2) {
                                const marcaModelo = partes[0].trim();
                                const precio = partes[1].replace(/[,$]/g, '');
                                const marcaModeloParts = marcaModelo.split(' ');
                                const marca = marcaModeloParts[0];
                                const modelo = marcaModeloParts.slice(1).join(' ');

                                return {
                                    id: option.value,
                                    brand: marca,
                                    model: modelo,
                                    price: parseFloat(precio) || 0,
                                    category: option.dataset.category || null,
                                    engine_cc: option.dataset.engine_cc || option.dataset.cilindraje || null,
                                    main_image: option.dataset.main_image || option.dataset.image || null,
                                    nivel_experiencia: option.dataset.nivel_experiencia || null,
                                    freno_trasero: option.dataset.freno_trasero || null,
                                    capacidad_del_tanque: option.dataset.capacidad_del_tanque || null,
                                    potencia: option.dataset.potencia || null,
                                    freno_delantero: option.dataset.freno_delantero || null,
                                    peso: option.dataset.peso || null,
                                    caja_de_velocidades: option.dataset.caja_de_velocidades || null,
                                    garantia: option.dataset.garantia || null
                                };
                            }
                        }
                    }
                    return null;
                })
                .filter(moto => moto !== null);

            console.log('getSelectedMotos: Motos seleccionadas:', selectedMotos);
            return selectedMotos;
        }

        function updateCompareButton() {
            const selected = getSelectedMotos();
            compareBtn.disabled = selected.length < 2;
            console.log(`updateCompareButton: ${selected.length} motos seleccionadas`);
        }

        function generateComparison(motos) {
            console.log('generateComparison: Generando comparación con motos:', motos);

            // Limpiar tablas
            if (tableHeader) tableHeader.innerHTML = `<th class="sticky-column">Características</th>`;
            if (tableBody) tableBody.innerHTML = ``;
            if (costCards) costCards.innerHTML = ``;

            // Llenar cabeceras
            if (tableHeader) {
                motos.forEach(moto => {
                    tableHeader.innerHTML += `<th>${moto.brand} ${moto.model}</th>`;
                });
            }

            // Generar filas de características
            if (tableBody) {
                features.forEach(feature => {
                    const row = document.createElement('tr');
                    row.classList.add('feature-row');
                    row.innerHTML = `<td class="sticky-column">${feature.label}</td>`;

                    motos.forEach(moto => {
                        let value = moto[feature.key];
                        if (feature.render) {
                            value = feature.render(value);
                        } else if (value === undefined || value === null || value === '') {
                            value = 'N/A';
                        }
                        row.innerHTML += `<td>${value}</td>`;
                    });

                    tableBody.appendChild(row);
                });
            }

            // Generar tarjetas de costo total
            if (costCards) {
                motos.forEach(moto => {
                    const costs = calculateTotalCost(moto.price);

                    // CORRECCIÓN: Verificar si ya tiene el prefijo img/ para evitar duplicación
                    const imageUrl = moto.main_image ?
                        (moto.main_image.startsWith('http') || moto.main_image.startsWith('img/') ?
                            moto.main_image : `/img/${moto.main_image}`) :
                        null;

                    const card = document.createElement('div');
                    card.classList.add('col-md-4', 'mb-3');

                    const imageHtml = imageUrl ?
                        `<img src="${imageUrl}" class="card-img-top" style="max-height: 180px; object-fit: cover;" 
            onload="console.log('Imagen de tarjeta cargada:', '${imageUrl}');"
            onerror="console.log('Error en imagen de tarjeta:', '${imageUrl}'); this.style.display='none'; this.nextElementSibling.style.display='flex';">
        <div class="card-img-top d-none align-items-center justify-content-center" style="height: 180px; background-color: #f8f9fa;">
            <div class="text-center text-muted">
                <i class="fas fa-motorcycle fa-3x mb-2"></i>
                <div>Sin imagen</div>
            </div>
        </div>` :
                        `<div class="card-img-top d-flex align-items-center justify-content-center" style="height: 180px; background-color: #f8f9fa;">
            <div class="text-center text-muted">
                <i class="fas fa-motorcycle fa-3x mb-2"></i>
                <div>Sin imagen</div>
            </div>
        </div>`;

                    card.innerHTML = `
        <div class="card h-100 moto-card">
            ${imageHtml}
            <div class="card-body">
                <h5 class="card-title">${moto.brand} ${moto.model}</h5>
                <div class="cost-breakdown">
                    <p class="mb-1"><strong>Precio base:</strong> $${costs.basePrice.toLocaleString()}</p>
                    <p class="mb-1 text-muted small">IVA (19%): $${Math.round(costs.iva).toLocaleString()}</p>
                    <p class="mb-1 text-muted small">Aranceles (5%): $${Math.round(costs.aranceles).toLocaleString()}</p>
                    <p class="mb-1 text-muted small">RUNT: $${costs.runt.toLocaleString()}</p>
                    <p class="mb-2 text-muted small">SOAT: $${costs.soat.toLocaleString()}</p>
                    <hr>
                    <p class="mb-0"><strong>Costo Total:</strong></p>
                    <h4 class="text-primary total-cost">$${Math.round(costs.total).toLocaleString()}</h4>
                </div>
            </div>
        </div>
    `;
                    costCards.appendChild(card);
                });
            }

            // Mostrar secciones
            if (loadingSpinner) loadingSpinner.classList.add('d-none');
            if (comparisonTable) comparisonTable.classList.remove('d-none');
            if (costSummary) costSummary.classList.remove('d-none');

            console.log('generateComparison: Comparación generada exitosamente.');
        }

        // Event Listeners
        selectors.forEach(select => {
            select.addEventListener('change', updateCompareButton);
        });

        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                console.log('clearBtn: Limpiando comparador.');
                selectors.forEach(select => select.value = "");
                compareBtn.disabled = true;
                if (comparisonTable) comparisonTable.classList.add('d-none');
                if (costSummary) costSummary.classList.add('d-none');
                console.log('clearBtn: Comparador reseteado.');
            });
        }

        compareBtn.addEventListener('click', async () => {
            console.log('compareBtn: Iniciando comparación.');
            const selectedMotos = getSelectedMotos();

            if (selectedMotos.length < 2) {
                console.log('compareBtn: Menos de 2 motos seleccionadas.');
                alert('Selecciona al menos dos motos para comparar.');
                return;
            }

            // Mostrar spinner
            if (loadingSpinner) loadingSpinner.classList.remove('d-none');
            if (comparisonTable) comparisonTable.classList.add('d-none');
            if (costSummary) costSummary.classList.add('d-none');

            try {
                // Intentar obtener datos completos del servidor
                const response = await fetch('/comparar', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        moto_ids: selectedMotos.map(m => m.id)
                    })
                });

                let motosCompletas = selectedMotos; // Fallback a datos básicos

                if (response.ok) {
                    const data = await response.json();
                    if (data.success && data.motos) {
                        motosCompletas = data.motos;
                        console.log('compareBtn: Datos completos obtenidos del servidor.');
                    }
                } else {
                    console.warn('compareBtn: Usando datos básicos de los selectores.');
                }

                // Generar comparación
                generateComparison(motosCompletas);

            } catch (error) {
                console.error('compareBtn: Error al obtener datos:', error);
                // Continuar con datos básicos
                generateComparison(selectedMotos);
            }
        });

        // Inicialización
        updateCompareButton();
        console.log('setupMotoComparer: Comparador inicializado correctamente.');
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
