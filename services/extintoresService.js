const pool = require('../config/db');

exports.saveActivos = async (activosData, contratoId) => {
  const query = `
    INSERT INTO activos 
      (id_cliente, nombre, cantidad, marca_modelo, tipo, n_identificador, fecha_fabricacion, fecha_retimbrado, estado, ubicacion, notas, id_contrato)
    VALUES 
      ($1, $2, $3, $4, $5, $6, $7, $8, 'ACTIVO', $9, $10, $11)
    RETURNING id_activo;
  `;

  // Array to store the inserted IDs
  const insertedIds = [];

  try {
    // Begin a transaction to ensure atomicity in case of errors
    await pool.query('BEGIN');

    // Insert each item in extintoresData as a separate row
    for (const item of activosData) {
      const {
        Id_Cliente,
        Nombre,
        Cantidad,
        Marca_Modelo,
        N_Identificador,
        Fecha_Fabricacion,
        Fecha_Retimbrado,
        Ubicacion,
        Notas
      } = item;

      let Tipo = item.Tipo || null;
      
      if (Nombre.toLowerCase().includes("extintor")) {
        // Query to get the 'tipo' from 'ref_tipo_extintor' based on 'Extintor' value
        const tipoQuery = `SELECT tipo FROM ref_tipo_extintor WHERE extintor = $1`;
        const tipoResult = await pool.query(tipoQuery, [Nombre]);

        // If no matching 'tipo' is found, throw an error
        if (tipoResult.rows.length === 0) {
          throw new Error(`No matching 'tipo' found for extintor: ${Nombre}`);
        }

        Tipo = tipoResult.rows[0].tipo;
      }

      const values = [
        Id_Cliente,
        Nombre,
        Cantidad,
        Marca_Modelo,
        Tipo,
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
  const query = `SELECT * FROM activos WHERE id_contrato = $1 AND fecha_fabricacion <= EXTRACT(YEAR FROM CURRENT_DATE) - 20 AND estado = 'ACTIVO'`;
  const result = await pool.query(query, [extintoresData.contratoId]);
  return result.rows;
};

exports.getExtintores = async (extintoresData) => {
  const query = `
    SELECT * 
    FROM activos 
    WHERE id_contrato = $1 
      AND estado = 'ACTIVO' 
      AND nombre ILIKE '%extintor%'
  `;
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


exports.updateActivos = async (activosData, contratoId) => {
  // Query to mark all extintores associated with the given contratoId as INACTIVO
  const inactivateQuery = `
    UPDATE activos
    SET estado = 'INACTIVO'
    WHERE id_contrato = $1
  `;

  // Query to insert new extintores data
  const insertQuery = `
    INSERT INTO activos 
      (id_cliente, nombre, cantidad, marca_modelo, tipo, n_identificador, fecha_fabricacion, fecha_retimbrado, estado, ubicacion, notas, id_contrato)
    VALUES 
      ($1, $2, $3, $4, $5, $6, $7, $8, 'ACTIVO', $9, $10, $11)
    RETURNING id_activo;
  `;

  // Array to store the IDs of inserted rows
  const insertedIds = [];

  try {
    // Begin a transaction
    await pool.query('BEGIN');

    // Mark all extintores associated with the contratoId as INACTIVO
    await pool.query(inactivateQuery, [contratoId]);

    // Process each extintor in extintoresData
    for (const item of activosData) {
      const {
        Id_Cliente,
        Nombre,
        Cantidad,
        Marca_Modelo,
        N_Identificador,
        Fecha_Fabricacion,
        Fecha_Retimbrado,
        Ubicacion,
        Notas
      } = item;

      let Tipo = item.Tipo || null;
      
      if (Nombre.toLowerCase().includes("extintor")) {
        // Query to get the 'tipo' from 'ref_tipo_extintor' based on 'Extintor' value
        const tipoQuery = `SELECT tipo FROM ref_tipo_extintor WHERE extintor = $1`;
        const tipoResult = await pool.query(tipoQuery, [Nombre]);

        // If no matching 'tipo' is found, throw an error
        if (tipoResult.rows.length === 0) {
          throw new Error(`No matching 'tipo' found for extintor: ${Nombre}`);
        }

        Tipo = tipoResult.rows[0].tipo;
      }

      // Prepare values for the insert query
      const values = [
        Id_Cliente,
        Nombre,
        Cantidad,
        Marca_Modelo,
        Tipo,
        N_Identificador,
        Fecha_Fabricacion || null,
        Fecha_Retimbrado || null,
        Ubicacion || null,
        Notas || null,
        contratoId
      ];

      // Execute the insert query
      const result = await pool.query(insertQuery, values);

      // Add the inserted ID to the array
      insertedIds.push(result.rows[0].id_activo);
    }

    // Commit the transaction
    await pool.query('COMMIT');

    // Return the array of inserted IDs
    return insertedIds;

  } catch (error) {
    console.error('Error actualizando extintores data:', error);
    await pool.query('ROLLBACK'); // Rollback transaction on error
    throw new Error('Failed to update extintores data');
  }
};