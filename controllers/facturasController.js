const { getAlbaranesAceptadosByMonth, getClientByContract } = require('../services/albaranesService');
const { getAlbaranesConFactura, saveFactura, generateFacturaDocument, getFacturasByClientId } = require('../services/facturasService');

exports.generateFacturas = async (req, res) => {
    const month = req.query.month;
    const year = new Date().getFullYear()
  
    try {
      // Fetch albaranes aceptados for the specified month from the database
      const albaranesAceptados = await getAlbaranesAceptadosByMonth(month, year);

      // Fetch albaranes con factura for the specified month from the database
      const albaranesConFactura = await getAlbaranesConFactura(month, year);
  
      // Filter albaranes: not in albaranesConFactura
      const filteredAlbaranes = albaranesAceptados.filter(albaran => 
        !albaranesConFactura.some(factura => factura.id_albaran === albaran.id_albaran)
      );
    
      const clientesIncorrectos = [];

      
      // Generate and save facturas documents for each filtered albaran
      for (const albaran of filteredAlbaranes) {
        const client = await getClientByContract(albaran)

          // BORRAR: Detector Excepciones
        //   if (client.nombre.includes('MIGUEL BECERRO')) {
        //     activosCliente;
        //   }
        
        // Guardar factura en BBDD
        try {
            idFactura = await saveFactura(albaran)
        } catch {
            clientesIncorrectos.push(client.nombre)
            continue
        }
        
        // Generate factura
        const facturaNumber = await generateFacturaDocument(albaran, client, idFactura);
      }

      // Initialize the message variable
      let message = `Facturas de ${month} generadas correctamente.\n`;

      // Notify about skipped clients
      if (clientesIncorrectos.length > 0) {
          console.log('Las facturas de los siguientes clientes no se generaron:');
          clientesIncorrectos.forEach(clientName => console.log(`- ${clientName}`));
        //   message += 'Las facturas de los siguientes clientes no se generaron:\n';
        //   clientesIncorrectos.forEach(clientName => {
        //       message += `- ${clientName}\n`;
        //   });
      }  
  
      res.status(200).json({ message: message });
    } catch (error) {
      console.error('Error generando albaranes:', error);
      res.status(500).json({ message: 'Error al generar albaranes.' });
    }
  };
  
  exports.getFacturas = async (req, res) => {
    try {
      const data = await getFacturasByClientId(req.query.clientId);
      res.json(data);
    } catch (err) {
      console.error('Error fetching facturas:', err);
      res.status(500).send('Server Error');
    }
  };