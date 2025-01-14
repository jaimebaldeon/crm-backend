const pool = require('../config/db');

exports.saveExtintores = async (extintoresData, contratoId) => {
  const query = `
    INSERT INTO activos 
      (id_cliente, nombre, cantidad, marca_modelo, tipo, n_identificador, fecha_fabricacion, fecha_retimbrado, estado, ubicacion, notas, id_contrato)
    VALUES 
      ($1, $2, 1, $3, $4, $5, $6, $7, 'ACTIVO', $8, $9, $10)
    RETURNING id_activo;
  `;

  // Array to store the inserted IDs
  const insertedIds = [];

  try {
    // Begin a transaction to ensure atomicity in case of errors
    await pool.query('BEGIN');

    // Insert each item in extintoresData as a separate row
    for (const item of extintoresData) {
      const {
        Id_Cliente,
        Extintor,
        Marca_Modelo,
        N_Identificador,
        Fecha_Fabricacion,
        Fecha_Retimbrado,
        Ubicacion,
        Notas
      } = item;
      
      // Query to get the 'tipo' from 'ref_tipo_extintor' based on 'Extintor' value
      const tipoQuery = `SELECT tipo FROM ref_tipo_extintor WHERE extintor = $1`;
      const tipoResult = await pool.query(tipoQuery, [Extintor]);

      // If no matching 'tipo' is found, throw an error
      if (tipoResult.rows.length === 0) {
        throw new Error(`No matching 'tipo' found for extintor: ${Extintor}`);
      }

      const tipo = tipoResult.rows[0].tipo;

      const values = [
        Id_Cliente,
        Extintor,
        Marca_Modelo,
        tipo,
        N_Identificador,
        Fecha_Fabricacion || null,
        Fecha_Retimbrado || null,
        Ubicacion || null,
        Notas || null,
        contratoId
      ];

      // Execute the insert query for each item
      const result = await pool.query(query, values);
      insertedIds.push(result.rows[0].id_activo); // Store the ID of the inserted row
    }

    // Commit the transaction if all inserts succeed
    await pool.query('COMMIT');
    return insertedIds; // Return the IDs of all inserted rows
  } catch (error) {
    console.error('Error inserting extintores data:', error);
    await pool.query('ROLLBACK'); // Rollback transaction on error
    throw new Error('Failed to insert extintores data');
  }
};


exports.getExtintoresCaducados = async (extintoresData) => {
  extintoresData.clientId
  const query = `SELECT * FROM activos WHERE id_contrato = $1 AND fecha_fabricacion <= EXTRACT(YEAR FROM CURRENT_DATE) - 20 AND estado = 'ACTIVO'`;
  const result = await pool.query(query, [extintoresData.contratoId]);
  return result.rows;
};

exports.updateExtintoresCaducados = async (extintoresData) => {
  const query = `
    UPDATE activos
    SET estado = 'CADUCADO'
    WHERE id_contrato = $1 
      AND fecha_fabricacion <= EXTRACT(YEAR FROM CURRENT_DATE) - 20
    RETURNING *; -- Opcional: Devuelve las filas actualizadas
  `;

  try {
    const result = await pool.query(query, [extintoresData.contratoId]);
    return result.rows; // Devuelve las filas actualizadas, si es necesario
  } catch (error) {
    console.error('Error actualizando extintores caducados:', error);
    throw error; // Rethrow para manejar errores a nivel superior
  }
};

exports.updateExtintoresRetimbrados = async (extintoresData) => {
  const query = `
    UPDATE activos
    SET fecha_retimbrado = EXTRACT(YEAR FROM CURRENT_DATE)
    WHERE 
		  id_contrato = $1 
      AND (
            (
                    fecha_retimbrado <= EXTRACT(YEAR FROM CURRENT_DATE) - 5
                AND fecha_fabricacion > EXTRACT(YEAR FROM CURRENT_DATE) - 20
            )
            OR (
                    fecha_retimbrado IS NULL
                AND fecha_fabricacion <= EXTRACT(YEAR FROM CURRENT_DATE) - 5
            )
      )
      AND estado = 'ACTIVO'
    RETURNING *; -- Opcional: Devuelve las filas actualizadas
  `;

  try {
    const result = await pool.query(query, [extintoresData.contratoId]);
    return result.rows; // Devuelve las filas actualizadas, si es necesario
  } catch (error) {
    console.error('Error actualizando extintores retimbrados:', error);
    throw error; // Rethrow para manejar errores a nivel superior
  }
};
