/**
 * Script principal del cliente para la tienda de motos
 * Maneja la interactividad de la interfaz de usuario
 */

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

            // Hover para desktop
            trigger.addEventListener('mouseenter', () => {
                dropdown.classList.add('show');
            });

            // Cerrar al salir
            trigger.parentElement.addEventListener('mouseleave', () => {
                dropdown.classList.remove('show');
            });

            // Click para móvil
            trigger.addEventListener('click', (e) => {
                if (window.innerWidth <= 768) {
                    e.preventDefault();
                    dropdown.classList.toggle('show');
                }
            });
        });
    };

    // --------------------------
    // Galería de imágenes en la página de moto
    // --------------------------
    const initImageGallery = () => {
        const mainImage = document.querySelector('.galeria-principal img');
        const thumbnails = document.querySelectorAll('.galeria-miniaturas img');

        if (!mainImage || !thumbnails.length) return;

        thumbnails.forEach(thumbnail => {
            thumbnail.addEventListener('click', () => {
                // Cambiar imagen principal
                mainImage.src = thumbnail.src;

                // Actualizar miniatura activa
                thumbnails.forEach(t => t.classList.remove('active'));
                thumbnail.classList.add('active');
            });
        });
    };

    // --------------------------
    // Filtrado de motos por categoría
    // --------------------------
    const setupMotoFilters = () => {
        const filterButtons = document.querySelectorAll('.categoria-item');
        const motoCards = document.querySelectorAll('.moto-card');

        if (!filterButtons.length || !motoCards.length) return;

        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                const category = button.dataset.categoria;

                // Actualizar botón activo
                filterButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');

                // Filtrar motos
                motoCards.forEach(card => {
                    if (category === 'todas' || card.dataset.categoria === category) {
                        card.style.display = 'block';
                    } else {
                        card.style.display = 'none';
                    }
                });
            });
        });
    };

    // --------------------------
    // Calculadora de financiamiento
    // --------------------------
    const setupFinanceCalculator = () => {
        const calculatorForm = document.getElementById('formulario-financiamiento');

        if (!calculatorForm) return;

        const precioMotoInput = document.getElementById('precio-moto');
        const inicialInput = document.getElementById('inicial');
        const plazoSelect = document.getElementById('plazo');
        const tasaSelect = document.getElementById('tasa');
        const porcentajeInicial = document.querySelector('.porcentaje-inicial');

        // Actualizar porcentaje inicial
        const updateInitialPercentage = debounce(() => {
            const precio = parseFloat(precioMotoInput.value) || 0;
            const inicial = parseFloat(inicialInput.value) || 0;

            if (precio > 0) {
                const porcentaje = Math.round((inicial / precio) * 100);
                porcentajeInicial.textContent = `${porcentaje}%`;
            } else {
                porcentajeInicial.textContent = '0%';
            }
        }, 300);

        precioMotoInput.addEventListener('input', updateInitialPercentage);
        inicialInput.addEventListener('input', updateInitialPercentage);

        // Calcular financiamiento
        calculatorForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const precio = parseFloat(precioMotoInput.value);
            const inicial = parseFloat(inicialInput.value);
            const plazo = parseInt(plazoSelect.value);
            const tasa = parseFloat(tasaSelect.value) / 100 / 12; // Tasa mensual

            if (inicial >= precio) {
                showNotification('La cuota inicial debe ser menor al precio total', 'error');
                return;
            }

            const montoFinanciar = precio - inicial;
            const cuota = (montoFinanciar * tasa) / (1 - Math.pow(1 + tasa, -plazo));

            // Mostrar resultados
            document.getElementById('precio-total').textContent = `$${precio.toLocaleString()}`;
            document.getElementById('cuota-inicial').textContent = `$${inicial.toLocaleString()}`;
            document.getElementById('monto-financiar').textContent = `$${montoFinanciar.toLocaleString()}`;
            document.getElementById('plazo-financiamiento').textContent = `${plazo} meses`;
            document.getElementById('tasa-interes').textContent = `${(tasa * 12 * 100).toFixed(2)}% anual`;
            document.getElementById('cuota-mensual').textContent = `$${cuota.toFixed(2)}`;
        });
    };

    // --------------------------
    // Comparador de motos
    // --------------------------
    const setupMotoComparer = () => {
        const comparerForm = document.querySelector('.selector-motos');
        const compareBtn = document.getElementById('comparar-btn');
        const clearBtn = document.getElementById('limpiar-btn');

        if (!comparerForm || !compareBtn) return;

        // Cargar opciones de motos
        const loadMotoOptions = async () => {
            const motos = await fetchData('/api/motos');
            if (!motos) return;

            const select1 = document.getElementById('moto1');
            const select2 = document.getElementById('moto2');

            // Limpiar selects
            select1.innerHTML = '<option value="">Selecciona una moto</option>';
            select2.innerHTML = '<option value="">Selecciona una moto</option>';

            // Llenar opciones
            motos.forEach(moto => {
                const option = document.createElement('option');
                option.value = moto._id;
                option.textContent = `${moto.marca} ${moto.modelo}`;

                select1.appendChild(option.cloneNode(true));
                select2.appendChild(option);
            });
        };

        // Comparar motos
        const compareMotos = async () => {
            const moto1Id = document.getElementById('moto1').value;
            const moto2Id = document.getElementById('moto2').value;

            if (!moto1Id || !moto2Id) {
                showNotification('Selecciona dos motos para comparar', 'error');
                return;
            }

            if (moto1Id === moto2Id) {
                showNotification('Selecciona motos diferentes para comparar', 'error');
                return;
            }

            const [moto1, moto2] = await Promise.all([
                fetchData(`/api/motos/${moto1Id}`),
                fetchData(`/api/motos/${moto2Id}`)
            ]);

            if (!moto1 || !moto2) return;

            // Actualizar nombres
            document.getElementById('nombre-moto1').textContent = `${moto1.marca} ${moto1.modelo}`;
            document.getElementById('nombre-moto2').textContent = `${moto2.marca} ${moto2.modelo}`;
            document.getElementById('moto1-nombre').textContent = `${moto1.marca} ${moto1.modelo}`;
            document.getElementById('moto2-nombre').textContent = `${moto2.marca} ${moto2.modelo}`;

            // Actualizar imágenes
            document.querySelector('.moto-1 .imagen-moto img').src = moto1.imagenPrincipal;
            document.querySelector('.moto-2 .imagen-moto img').src = moto2.imagenPrincipal;

            // Actualizar tabla comparativa
            document.getElementById('precio-moto1').textContent = `$${moto1.precio.toLocaleString()}`;
            document.getElementById('precio-moto2').textContent = `$${moto2.precio.toLocaleString()}`;
            document.getElementById('cilindrada-moto1').textContent = moto1.especificaciones.motor || '-';
            document.getElementById('cilindrada-moto2').textContent = moto2.especificaciones.motor || '-';
            document.getElementById('potencia-moto1').textContent = moto1.especificaciones.potencia || '-';
            document.getElementById('potencia-moto2').textContent = moto2.especificaciones.potencia || '-';
            document.getElementById('consumo-moto1').textContent = moto1.especificaciones.consumo || '-';
            document.getElementById('consumo-moto2').textContent = moto2.especificaciones.consumo || '-';
            document.getElementById('peso-moto1').textContent = moto1.especificaciones.peso || '-';
            document.getElementById('peso-moto2').textContent = moto2.especificaciones.peso || '-';
        };

        // Limpiar comparación
        const clearComparison = () => {
            document.getElementById('moto1').value = '';
            document.getElementById('moto2').value = '';

            document.getElementById('nombre-moto1').textContent = 'Selecciona una moto';
            document.getElementById('nombre-moto2').textContent = 'Selecciona una moto';

            const defaultImg = '/img/placeholder-moto.png';
            document.querySelector('.moto-1 .imagen-moto img').src = defaultImg;
            document.querySelector('.moto-2 .imagen-moto img').src = defaultImg;

            // Resetear tabla
            const tableCells = document.querySelectorAll('.tabla-comparacion td:not(:first-child)');
            tableCells.forEach(cell => cell.textContent = '-');
        };

        // Event listeners
        compareBtn.addEventListener('click', compareMotos);
        if (clearBtn) clearBtn.addEventListener('click', clearComparison);

        // Cargar opciones al cargar la página
        loadMotoOptions();
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
                const response = await fetch('/api/contacto', {
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
                const response = await fetch('/api/asesoria', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });

                if (response.ok) {
                    const result = await response.json();
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

        const displayRecommendedMotos = (motos) => {
            const resultsContainer = document.getElementById('resultado-asesoria');

            if (!resultsContainer || !motos || !motos.length) {
                showNotification('No se encontraron motos recomendadas', 'warning');
                return;
            }

            resultsContainer.innerHTML = motos.map(moto => `
                <div class="moto-recomendada">
                    <img src="${moto.imagenPrincipal}" alt="${moto.marca} ${moto.modelo}">
                    <h3>${moto.marca} ${moto.modelo}</h3>
                    <p class="precio">$${moto.precio.toLocaleString()}</p>
                    <p class="categoria">${moto.categoria}</p>
                    <a href="/motos/${moto._id}" class="btn btn--small">Ver detalles</a>
                </div>
            `).join('');
        };
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

    // --------------------------
    // Estilos dinámicos
    // --------------------------
    const style = document.createElement('style');
    style.textContent = `
        .notification {
            position: fixed;
            bottom: 20px;
            right: 20px;
            padding: 15px 25px;
            border-radius: 5px;
            color: white;
            z-index: 1000;
            transform: translateX(0);
            transition: transform 0.3s ease;
        }
    
        .notification.success {
            background-color: #4CAF50;
        }
    
        .notification.error {
            background-color: #F44336;
        }
    
        .notification.warning {
            background-color: #FF9800;
        }
    
        .notification.fade-out {
            transform: translateX(200%);
        }

        .galeria-miniaturas img.active {
            border: 2px solid #e63946;
        }

        .moto-recomendada {
            background: white;
            padding: 1rem;
            border-radius: 5px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            text-align: center;
        }

        .moto-recomendada img {
            width: 100%;
            height: 150px;
            object-fit: contain;
        }

        .moto-recomendada .precio {
            color: #e63946;
            font-weight: bold;
        }
    `;
    document.head.appendChild(style);
});