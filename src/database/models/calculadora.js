import { query } from '../connection.js';

class Calculadora {
    // Obtener impuestos activos
    static async getImpuestos() {
        try {
            const sql = `
                SELECT id, nombre_impuesto, porcentaje, monto_fijo, aplica_a,
                    cilindraje_min_aplicable, cilindraje_max_aplicable,
                    aplica_a_categoria_moto
                FROM impuestos
                WHERE es_activo = 1
                ORDER BY nombre_impuesto
            `;
            return await query(sql);
        } catch (error) {
            console.error('Error obteniendo impuestos:', error);
            throw new Error('Error obteniendo impuestos');
        }
    }

    static async getMantenimientos(tipoMoto = null) {
        try {
            let sql = `
                SELECT id, nombre_mantenimiento, costo_estimado, frecuencia_km,
                    frecuencia_meses, aplica_a_tipo_moto, es_recurrente
                FROM mantenimientos
            `;
            const params = [];

            if (tipoMoto) {
                sql += ` WHERE aplica_a_tipo_moto = ? OR aplica_a_tipo_moto IS NULL`;
                params.push(tipoMoto);
            }

            sql += ' ORDER BY nombre_mantenimiento';
            return await query(sql, params);
        } catch (error) {
            console.error('Error obteniendo mantenimientos:', error);
            throw new Error('Error obteniendo mantenimientos');
        }
    }

    static async getPapeleo() {
        try {
            const sql = `
                SELECT id, nombre_papel, costo_estimado, es_obligatorio,
                    frecuencia_años, comentarios
                FROM papeleo
                ORDER BY es_obligatorio DESC, nombre_papel
            `;
            return await query(sql);
        } catch (error) {
            console.error('Error obteniendo papeleo:', error);
            throw new Error('Error obteniendo papeleo');
        }
    }

    static async getMotos() {
        try {
            const sql = `
                SELECT id, brand, model, engine_cc, price, category, transmission
                FROM motos
                ORDER BY brand, model
            `;
            return await query(sql);
        } catch (error) {
            console.error('Error obteniendo motos:', error);
            throw new Error('Error obteniendo motos');
        }
    }

    // CORRECCIÓN 1: En el método calcularImpuestosParaMoto (línea ~95)
    static async calcularImpuestosParaMoto(motoId, precioMoto, cilindraje, categoria) {
        try {
            const impuestos = await this.getImpuestos();
            const impuestosAplicables = [];
            let totalImpuestos = 0; // CORRECCIÓN: Inicializar como número

            console.log(`Calculando impuestos para moto con cilindraje: ${cilindraje}cc, categoria: ${categoria}, precio: $${precioMoto}`);

            for (const impuesto of impuestos) {
                let aplica = false;

                console.log(`Evaluando impuesto: ${impuesto.nombre_impuesto}`);
                console.log(`Aplica a: ${impuesto.aplica_a}`);

                switch (impuesto.aplica_a) {
                    case 'todas_las_motos':
                        aplica = true;
                        console.log('Aplica a todas las motos');
                        break;
                    case 'por_cilindraje':
                        const cilindrajeMin = impuesto.cilindraje_min_aplicable || 0;
                        const cilindrajeMax = impuesto.cilindraje_max_aplicable || 9999;
                        console.log(`Rango cilindraje: ${cilindrajeMin} - ${cilindrajeMax}, moto: ${cilindraje}`);

                        if (cilindraje >= cilindrajeMin && cilindraje <= cilindrajeMax) {
                            aplica = true;
                            console.log('Aplica por cilindraje');
                        }
                        break;
                    case 'por_categoria':
                        if (impuesto.aplica_a_categoria_moto === categoria) {
                            aplica = true;
                            console.log('Aplica por categoría');
                        }
                        break;
                }

                if (aplica) {
                    let montoImpuesto = 0;

                    if (impuesto.porcentaje && impuesto.porcentaje > 0) {
                        // CORRECCIÓN: Convertir a número y hacer cálculo aritmético
                        montoImpuesto = parseFloat(precioMoto) * parseFloat(impuesto.porcentaje);
                        console.log(`Impuesto por porcentaje: ${precioMoto} * ${impuesto.porcentaje} = ${montoImpuesto}`);
                    } else if (impuesto.monto_fijo && impuesto.monto_fijo > 0) {
                        // CORRECCIÓN: Convertir a número
                        montoImpuesto = parseFloat(impuesto.monto_fijo);
                        console.log(`Impuesto monto fijo: ${montoImpuesto}`);
                    }

                    if (montoImpuesto > 0) {
                        impuestosAplicables.push({
                            nombre: impuesto.nombre_impuesto,
                            monto: montoImpuesto, // CORRECCIÓN: Mantener como número
                            tipo: impuesto.porcentaje ? 'porcentaje' : 'fijo'
                        });
                        totalImpuestos += montoImpuesto; // CORRECCIÓN: Suma aritmética
                        console.log(`Impuesto añadido: ${impuesto.nombre_impuesto} - $${montoImpuesto}`);
                    }
                } else {
                    console.log(`No aplica: ${impuesto.nombre_impuesto}`);
                }
            }

            console.log(`Total impuestos: $${totalImpuestos}`);
            return {
                impuestos: impuestosAplicables,
                total: totalImpuestos // CORRECCIÓN: Retornar como número
            };
        } catch (error) {
            console.error('Error calculando impuestos:', error);
            throw new Error('Error calculando impuestos');
        }
    }

    // CORRECCIÓN 2: En el método calcularMantenimientoAnual (línea ~150)
    static async calcularMantenimientoAnual(tipoMoto, kmAnuales = 12000) {
        try {
            const mantenimientos = await this.getMantenimientos(tipoMoto);
            let costoAnual = 0;
            const detalleMantenimiento = [];

            console.log(`Calculando mantenimiento para tipo: ${tipoMoto}, km anuales: ${kmAnuales}`);

            for (const mant of mantenimientos) {
                let frecuenciaAnual = 0;

                if (mant.frecuencia_km && mant.frecuencia_km > 0 && kmAnuales > 0) {
                    frecuenciaAnual = Math.max(1, Math.ceil(kmAnuales / mant.frecuencia_km));
                } else if (mant.frecuencia_meses && mant.frecuencia_meses > 0) {
                    frecuenciaAnual = Math.max(1, Math.ceil(12 / mant.frecuencia_meses));
                } else {
                    frecuenciaAnual = mant.es_recurrente ? 1 : 1;
                }

                if (mant.nombre_mantenimiento === 'Revisión 500 km') {
                    frecuenciaAnual = 1;
                }

                // CORRECCIÓN: Convertir a número antes de calcular
                const costoUnitario = parseFloat(mant.costo_estimado);
                const costoItem = costoUnitario * frecuenciaAnual;
                costoAnual += costoItem;

                console.log(`${mant.nombre_mantenimiento}: ${frecuenciaAnual} veces al año, costo: $${costoItem}`);

                detalleMantenimiento.push({
                    nombre: mant.nombre_mantenimiento,
                    costo_unitario: costoUnitario, // CORRECCIÓN: Como número
                    frecuencia_anual: frecuenciaAnual,
                    costo_anual: costoItem // CORRECCIÓN: Como número
                });
            }

            console.log(`Total mantenimiento anual: $${costoAnual}`);
            return {
                mantenimientos: detalleMantenimiento,
                total_anual: costoAnual
            };
        } catch (error) {
            console.error('Error calculando mantenimiento:', error);
            throw new Error('Error calculando mantenimiento');
        }
    }

    // CORRECCIÓN 3: En el método calcularPapeleoAnual (línea ~200)
    static async calcularPapeleoAnual() {
        try {
            const papeleo = await this.getPapeleo();
            let costoAnual = 0;
            const detallePapeleo = [];

            console.log('Calculando costos de papeleo anual');

            for (const papel of papeleo) {
                let costoAnualItem = 0;

                if (papel.frecuencia_años && papel.frecuencia_años > 0) {
                    // CORRECCIÓN: Convertir a número antes de dividir
                    costoAnualItem = parseFloat(papel.costo_estimado) / parseFloat(papel.frecuencia_años);
                } else {
                    if (papel.nombre_papel === 'Matrícula Inicial') {
                        costoAnualItem = 0;
                    } else {
                        // CORRECCIÓN: Convertir a número
                        costoAnualItem = parseFloat(papel.costo_estimado);
                    }
                }

                costoAnual += costoAnualItem; // CORRECCIÓN: Suma aritmética

                console.log(`${papel.nombre_papel}: Costo anual $${costoAnualItem}`);

                detallePapeleo.push({
                    nombre: papel.nombre_papel,
                    costo_estimado: parseFloat(papel.costo_estimado), // CORRECCIÓN: Como número
                    frecuencia_años: papel.frecuencia_años,
                    costo_anual: costoAnualItem, // CORRECCIÓN: Como número
                    es_obligatorio: papel.es_obligatorio
                });
            }

            console.log(`Total papeleo anual: $${costoAnual}`);
            return {
                papeleo: detallePapeleo,
                total_anual: costoAnual // CORRECCIÓN: Como número
            };
        } catch (error) {
            console.error('Error calculando papeleo:', error);
            throw new Error('Error calculando papeleo');
        }
    }

    // CORRECCIÓN 4: En el controlador calcularCostos (línea ~250)
    static async calcularCostos(req, res) {
        try {
            const { moto_id, km_anuales, anos_proyeccion } = req.body;

            if (!moto_id || !km_anuales || !anos_proyeccion) {
                return res.json({
                    success: false,
                    message: 'Datos incompletos'
                });
            }

            const motos = await CalculadoraModel.getMotos();
            const motoSeleccionada = motos.find(m => m.id == moto_id);

            if (!motoSeleccionada) {
                return res.json({
                    success: false,
                    message: 'Motocicleta no encontrada'
                });
            }

            // CORRECCIÓN: Convertir precio a número desde el inicio
            const precioMoto = parseFloat(motoSeleccionada.price);

            const impuestos = await CalculadoraModel.calcularImpuestosParaMoto(
                moto_id,
                precioMoto,
                motoSeleccionada.engine_cc,
                motoSeleccionada.category
            );

            const mantenimiento = await CalculadoraModel.calcularMantenimientoAnual(
                motoSeleccionada.category,
                parseInt(km_anuales)
            );

            const papeleo = await CalculadoraModel.calcularPapeleoAnual();

            // CORRECCIÓN: Todos los cálculos como números
            const costoInicial = precioMoto + impuestos.total;
            const costoAnual = mantenimiento.total_anual + papeleo.total_anual;

            // Agregar matrícula inicial
            let matriculaInicial = 0;
            const matricula = papeleo.papeleo.find(p => p.nombre === 'Matrícula Inicial');
            if (matricula) {
                matriculaInicial = parseFloat(matricula.costo_estimado);
            }

            const costoInicialConMatricula = precioMoto + impuestos.total + matriculaInicial;
            const costoTotalProyectado = costoInicialConMatricula + (costoAnual * parseInt(anos_proyeccion));
            const kmTotales = parseInt(km_anuales) * parseInt(anos_proyeccion);
            const costoPorKm = kmTotales > 0 ? costoTotalProyectado / kmTotales : 0;

            const resultado = {
                success: true,
                moto: {
                    marca: motoSeleccionada.brand,
                    modelo: motoSeleccionada.model,
                    precio: precioMoto, // CORRECCIÓN: Como número
                    cilindraje: motoSeleccionada.engine_cc
                },
                parametros: {
                    km_anuales: parseInt(km_anuales),
                    anos_proyeccion: parseInt(anos_proyeccion),
                    km_totales: kmTotales
                },
                costos: {
                    precio_moto: precioMoto,
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
                        detalle: papeleo.papeleo.filter(p => p.costo_anual > 0),
                        total: papeleo.total_anual
                    },
                    costo_anual_total: costoAnual,
                    costo_total_proyectado: costoTotalProyectado,
                    costo_por_km: costoPorKm
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
}

export default Calculadora;