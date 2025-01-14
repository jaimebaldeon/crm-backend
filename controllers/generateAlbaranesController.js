const { getContractsByMonth, getAlbaranesAceptadosByMonth, deleteAlbaranesPendientesByMonth, getClientByContract, getClientAssets, generateAlbaranDocument, deriveMaintenance, insertAlbaranes, getContractPrices } = require('../services/albaranesService');


exports.generateAlbaranes = async (req, res) => {
    const month = req.query.month;
    const year = new Date().getFullYear()
  
    try {
      // Fetch contracts for the specified month from the database
      const contracts = await getContractsByMonth(month);

      // Fetch contracts for the specified month from the database
      const albaranesAceptados = await getAlbaranesAceptadosByMonth(month, year);
  
      // Filter contracts: not in albaranesAceptados
      const filteredContracts = contracts.filter(contract => 
        !albaranesAceptados.some(albaran => albaran.id_contrato === contract.id_contrato)
      );
    
      const clientesSinActivos = [];
      const clientesSinDatos = [];
      const clientesIncorrectos = [];
      const generatedAlbaranes = [];

      
      // Generate and save albaran documents for each filtered contract
      for (const contract of filteredContracts) {
          const client = await getClientByContract(contract)
          const activosCliente = await getClientAssets(client)

          // BORRAR: Detector Excepciones
        //   if (client.nombre.includes('MIGUEL BECERRO')) {
        //     activosCliente;
        //   }

          if (activosCliente.length === 0) {
              // Add client name to notification list if no assets are found
              clientesSinActivos.push(client.name); // Assuming client.name holds the client’s name
              console.log(`Saltando albaran de ${client.name} por falta de activos.`);
              continue; // Skip to the next contract in the loop
          }
          
          // Derive products and services from client assets
          const { productosServiciosCounter, saltarAlbaran, clienteSinDatos, clienteIncorrecto } = await deriveMaintenance(activosCliente)

          // Detect any error with client data before generating
          if (saltarAlbaran) {
              if (clienteSinDatos) {clientesSinDatos.push(client.name);}
              if (clienteIncorrecto) {clientesIncorrectos.push(client.name);}
              continue;
          }
          
          // Generate albaran for clients with assets
          const albaranNumber = await generateAlbaranDocument(contract, client, activosCliente, productosServiciosCounter);

          // Collect albaran data for database insertion
          generatedAlbaranes.push({
              idAlbaran: albaranNumber,
              idContrato: contract.id_contrato,
              idCliente: client.id_cliente,
              productosServicios: Object.keys(productosServiciosCounter),
              cantidades: Object.values(productosServiciosCounter),
              precios: getContractPrices(contract.precios, Object.keys(productosServiciosCounter)), 
              cuota: null,
              mes: month,
              anio: year,
              estado: 'PENDIENTE',
              fecha: new Date(),
              notas_adicionales: null,
          });
      }

      // Insert all generated albaranes into the database
      if (generatedAlbaranes.length > 0) {
          const deletionResult = await deleteAlbaranesPendientesByMonth(month, year);
          const insertionResult = await insertAlbaranes(generatedAlbaranes);
          console.log(`Inserted ${insertionResult.inserted} albaranes into the database.`);
      }

      // Initialize the message variable
      let message = `Albaranes de ${month} generados correctamente.\n`;

      // Notify about skipped clients
      if (clientesSinActivos.length > 0) {
          console.log('Generacion de albaranes completada. Los siguientes clientes no tienen activos:');
          clientesSinActivos.forEach(clientName => console.log(`- ${clientName}`));
          message += 'Generación de albaranes completada. Los siguientes clientes no tienen activos:\n';
          clientesSinActivos.forEach(clientName => {
              message += `- ${clientName}\n`;
          });
      } 
      if (clientesSinDatos.length > 0) {
          console.log('Generacion de albaranes completada. Los siguientes clientes tienes activos incompletos:');
          clientesSinDatos.forEach(clientName => console.log(`- ${clientName}`));
          message += 'Generación de albaranes completada. Los siguientes clientes tienen activos incompletos:\n';
          clientesSinDatos.forEach(clientName => {
              message += `- ${clientName}\n`;
          });
      }
      if (clientesIncorrectos.length > 0) {
          console.log('Generacion de albaranes completada. Los siguientes clientes tienen datos incorrectos:');
          clientesIncorrectos.forEach(clientName => console.log(`- ${clientName}`));
          message += 'Generación de albaranes completada. Los siguientes clientes tienen datos incorrectos:\n';
          clientesIncorrectos.forEach(clientName => {
              message += `- ${clientName}\n`;
          });
      }  
  
      res.status(200).json({ message: message });
    } catch (error) {
      console.error('Error generando albaranes:', error);
      res.status(500).json({ message: 'Error al generar albaranes.' });
    }
  };
  