import CalculadoraModel from '../database/models/calculadora.js';

class CalculadoraController {
    // Mostrar la página de la calculadora
    static async mostrarCalculadora(req, res) {
        try {
            const motos = await CalculadoraModel.getMotos();
            res.render('users/calculadora', {
                title: 'Calculadora de Costos - MotoFácil',
                motos: motos,
                error: null
            });
        } catch (error) {
            console.error('Error al cargar calculadora:', error);
            res.render('users/calculadora', {
                title: 'Calculadora de Costos - MotoFácil',
                motos: [],
                error: 'Error al cargar los datos de las motocicletas'
            });
        }
    }

    // Calcular costos totales
    static async calcularCostos(req, res) {
        try {
            const { moto_id, km_anuales, anos_proyeccion } = req.body;
            
            // Validación de datos
            if (!moto_id || !km_anuales || !anos_proyeccion) {
                return res.json({
                    success: false,
                    message: 'Datos incompletos'
                });
            }

            // Obtener la moto seleccionada
            const motos = await CalculadoraModel.getMotos();
            const motoSeleccionada = motos.find(m => m.id == moto_id);
            
            if (!motoSeleccionada) {
                return res.json({
                    success: false,
                    message: 'Motocicleta no encontrada'
                });
            }

            // Calcular impuestos - CORREGIDO: usar los nombres correctos de las columnas
            const impuestos = await CalculadoraModel.calcularImpuestosParaMoto(
                moto_id,
                motoSeleccionada.price, // Corregido: era 'precio', ahora 'price'
                motoSeleccionada.engine_cc, // Corregido: era 'cilindraje', ahora 'engine_cc'
                motoSeleccionada.category
            );

            // Calcular mantenimiento anual
            const mantenimiento = await CalculadoraModel.calcularMantenimientoAnual(
                motoSeleccionada.category, // Usar category de la tabla motos
                parseInt(km_anuales)
            );

            // Calcular papeleo anual
            const papeleo = await CalculadoraModel.calcularPapeleoAnual();

            // Cálculos finales
            const costoInicial = parseFloat(motoSeleccionada.price) + impuestos.total;
            const costoAnual = mantenimiento.total_anual + papeleo.total_anual;
            const costoTotalProyectado = costoInicial + (costoAnual * parseInt(anos_proyeccion));
            const kmTotales = parseInt(km_anuales) * parseInt(anos_proyeccion);
            const costoPorKm = kmTotales > 0 ? costoTotalProyectado / kmTotales : 0;

            // Agregar la matrícula inicial al costo inicial si aplica
            let matriculaInicial = 0;
            const matricula = papeleo.papeleo.find(p => p.nombre === 'Matrícula Inicial');
            if (matricula) {
                matriculaInicial = matricula.costo_estimado;
            }

            const costoInicialConMatricula = parseFloat(motoSeleccionada.price) + impuestos.total + matriculaInicial;
            const costoTotalProyectadoFinal = costoInicialConMatricula + (costoAnual * parseInt(anos_proyeccion));
            const costoPorKmFinal = kmTotales > 0 ? costoTotalProyectadoFinal / kmTotales : 0;

            // Resultado corregido con nombres de columnas correctos
            const resultado = {
                success: true,
                moto: {
                    marca: motoSeleccionada.brand,
                    modelo: motoSeleccionada.model,
                    precio: motoSeleccionada.price,
                    cilindraje: motoSeleccionada.engine_cc
                },
                parametros: {
                    km_anuales: parseInt(km_anuales),
                    anos_proyeccion: parseInt(anos_proyeccion),
                    km_totales: kmTotales
                },
                costos: {
                    precio_moto: parseFloat(motoSeleccionada.price),
                    impuestos: {
                        detalle: impuestos.impuestos,
                        total: impuestos.total
                    },
                    matricula_inicial: matriculaInicial,
                    costo_inicial: costoInicialConMatricula,
                    mantenimiento_anual: {
                        detalle: mantenimiento.mantenimientos,
                        total: mantenimiento.total_anual
                    },
                    papeleo_anual: {
                        detalle: papeleo.papeleo.filter(p => p.costo_anual > 0), // Solo mostrar items con costo anual
                        total: papeleo.total_anual
                    },
                    costo_anual_total: costoAnual,
                    costo_total_proyectado: costoTotalProyectadoFinal,
                    costo_por_km: costoPorKmFinal
                }
            };

            console.log('Resultado final:', JSON.stringify(resultado, null, 2));
            res.json(resultado);

        } catch (error) {
            console.error('Error al calcular costos:', error);
            res.json({
                success: false,
                message: 'Error interno del servidor: ' + error.message
            });
        }
    }

    // Obtener detalles de una moto específica
    static async obtenerDetallesMoto(req, res) {
        try {
            const { moto_id } = req.params;
            const motos = await CalculadoraModel.getMotos();
            const moto = motos.find(m => m.id == moto_id);
            
            if (!moto) {
                return res.json({
                    success: false,
                    message: 'Moto no encontrada'
                });
            }

            res.json({
                success: true,
                moto: moto
            });
        } catch (error) {
            console.error('Error al obtener detalles de moto:', error);
            res.json({
                success: false,
                message: 'Error al obtener detalles'
            });
        }
    }
}

export default CalculadoraController;